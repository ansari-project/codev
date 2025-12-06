/**
 * Migration Functions
 *
 * Handles migration from JSON files to SQLite databases
 */

import type Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import type { DashboardState } from '../types.js';

interface LegacyPortEntry {
  basePort: number;
  registered: string;
  lastUsed?: string;
  pid?: number;
}

interface LegacyPortRegistry {
  version?: number;
  entries?: Record<string, LegacyPortEntry>;
  // Legacy format (no version field) is just Record<string, LegacyPortEntry>
  [key: string]: unknown;
}

/**
 * Migrate local state from JSON to SQLite
 */
export function migrateLocalFromJson(db: Database.Database, jsonPath: string): void {
  const jsonContent = readFileSync(jsonPath, 'utf-8');
  const state: DashboardState = JSON.parse(jsonContent);

  // Wrap in transaction for atomicity
  const migrate = db.transaction(() => {
    // Migrate architect
    if (state.architect) {
      db.prepare(`
        INSERT INTO architect (id, pid, port, cmd, started_at, tmux_session)
        VALUES (1, @pid, @port, @cmd, @startedAt, @tmuxSession)
      `).run({
        pid: state.architect.pid,
        port: state.architect.port,
        cmd: state.architect.cmd,
        startedAt: state.architect.startedAt,
        tmuxSession: state.architect.tmuxSession ?? null,
      });
    }

    // Migrate builders
    for (const builder of state.builders || []) {
      db.prepare(`
        INSERT INTO builders (
          id, name, port, pid, status, phase, worktree, branch,
          tmux_session, type, task_text, protocol_name
        )
        VALUES (
          @id, @name, @port, @pid, @status, @phase, @worktree, @branch,
          @tmuxSession, @type, @taskText, @protocolName
        )
      `).run({
        id: builder.id,
        name: builder.name,
        port: builder.port,
        pid: builder.pid,
        status: builder.status,
        phase: builder.phase,
        worktree: builder.worktree,
        branch: builder.branch,
        tmuxSession: builder.tmuxSession ?? null,
        type: builder.type,
        taskText: builder.taskText ?? null,
        protocolName: builder.protocolName ?? null,
      });
    }

    // Migrate utils
    for (const util of state.utils || []) {
      db.prepare(`
        INSERT INTO utils (id, name, port, pid, tmux_session)
        VALUES (@id, @name, @port, @pid, @tmuxSession)
      `).run({
        id: util.id,
        name: util.name,
        port: util.port,
        pid: util.pid,
        tmuxSession: util.tmuxSession ?? null,
      });
    }

    // Migrate annotations
    for (const annotation of state.annotations || []) {
      db.prepare(`
        INSERT INTO annotations (id, file, port, pid, parent_type, parent_id)
        VALUES (@id, @file, @port, @pid, @parentType, @parentId)
      `).run({
        id: annotation.id,
        file: annotation.file,
        port: annotation.port,
        pid: annotation.pid,
        parentType: annotation.parent.type,
        parentId: annotation.parent.id ?? null,
      });
    }
  });

  try {
    migrate();
  } catch (err) {
    console.error('[error] Migration failed. JSON file preserved.');
    console.error('[error] Manual recovery: delete state.db and restart');
    throw err;
  }
}

/**
 * Migrate global port registry from JSON to SQLite
 */
export function migrateGlobalFromJson(db: Database.Database, jsonPath: string): void {
  const jsonContent = readFileSync(jsonPath, 'utf-8');
  const data: LegacyPortRegistry = JSON.parse(jsonContent);

  // Handle both formats: versioned ({ version, entries }) and legacy (direct entries)
  let entries: Record<string, LegacyPortEntry>;

  if (data.version && data.entries) {
    // New versioned format
    entries = data.entries;
  } else {
    // Legacy format - the object itself is the entries
    // Filter out any non-entry fields
    entries = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null && 'basePort' in value) {
        entries[key] = value as LegacyPortEntry;
      }
    }
  }

  // Wrap in transaction for atomicity
  const migrate = db.transaction(() => {
    for (const [projectPath, entry] of Object.entries(entries)) {
      db.prepare(`
        INSERT INTO port_allocations (project_path, base_port, pid, registered_at, last_used_at)
        VALUES (@projectPath, @basePort, @pid, @registeredAt, @lastUsedAt)
      `).run({
        projectPath,
        basePort: entry.basePort,
        pid: entry.pid ?? null,
        registeredAt: entry.registered,
        lastUsedAt: entry.lastUsed ?? entry.registered,
      });
    }
  });

  try {
    migrate();
  } catch (err) {
    console.error('[error] Port registry migration failed. JSON file preserved.');
    console.error('[error] Manual recovery: delete global.db and restart');
    throw err;
  }
}
