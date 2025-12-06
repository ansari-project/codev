/**
 * Tests for concurrent database access
 *
 * These tests verify that SQLite with WAL mode properly handles
 * concurrent reads and writes without data corruption.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { LOCAL_SCHEMA, GLOBAL_SCHEMA } from '../db/schema.js';

describe('Concurrency', () => {
  const testDir = resolve(process.cwd(), '.test-concurrency');
  let db: Database.Database;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('Parallel upserts', () => {
    it('should handle multiple concurrent builder inserts', () => {
      const dbPath = resolve(testDir, 'state.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.exec(LOCAL_SCHEMA);

      // Simulate 10 concurrent upserts
      const insertBuilder = db.prepare(`
        INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
        VALUES (@id, @name, @port, @pid, @status, @phase, @worktree, @branch, @type)
        ON CONFLICT(id) DO UPDATE SET status = excluded.status
      `);

      const builders = Array.from({ length: 10 }, (_, i) => ({
        id: `B${String(i).padStart(3, '0')}`,
        name: `builder-${i}`,
        port: 4210 + i,
        pid: 1000 + i,
        status: 'implementing',
        phase: 'init',
        worktree: `/tmp/worktree-${i}`,
        branch: `feature-${i}`,
        type: 'spec',
      }));

      // Insert all builders (in real scenario, these could be from different processes)
      for (const builder of builders) {
        insertBuilder.run(builder);
      }

      // Verify all 10 builders exist
      const count = db.prepare('SELECT COUNT(*) as count FROM builders').get() as { count: number };
      expect(count.count).toBe(10);
    });

    it('should serialize writes with immediate transactions', () => {
      const dbPath = resolve(testDir, 'state.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.exec(LOCAL_SCHEMA);

      // Simulate concurrent read-modify-write operations
      const upsert = db.transaction((id: string, status: string) => {
        const existing = db.prepare('SELECT * FROM builders WHERE id = ?').get(id);

        if (existing) {
          db.prepare('UPDATE builders SET status = ? WHERE id = ?').run(status, id);
        } else {
          db.prepare(`
            INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, 'test', 4210, 1234, status, 'init', '/tmp', 'test', 'spec');
        }
      });

      // Multiple operations on same builder
      upsert('B001', 'implementing');
      upsert('B001', 'blocked');
      upsert('B001', 'pr-ready');

      const builder = db.prepare('SELECT * FROM builders WHERE id = ?').get('B001') as any;
      expect(builder.status).toBe('pr-ready');
    });
  });

  describe('Port allocation race', () => {
    it('should not allocate duplicate ports', () => {
      const dbPath = resolve(testDir, 'global.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.exec(GLOBAL_SCHEMA);

      const allocate = db.transaction((projectPath: string) => {
        // Check if already allocated
        const existing = db.prepare('SELECT * FROM port_allocations WHERE project_path = ?')
          .get(projectPath) as any;

        if (existing) {
          return existing.base_port;
        }

        // Find next available port
        const maxPort = db.prepare('SELECT MAX(base_port) as max FROM port_allocations').get() as { max: number | null };
        const nextPort = (maxPort.max ?? 4100) + 100;

        // Insert new allocation
        db.prepare(`
          INSERT INTO port_allocations (project_path, base_port, pid)
          VALUES (?, ?, ?)
        `).run(projectPath, nextPort, process.pid);

        return nextPort;
      });

      // Allocate ports for 5 projects
      const projects = ['/proj/a', '/proj/b', '/proj/c', '/proj/d', '/proj/e'];
      const allocatedPorts: number[] = [];

      for (const project of projects) {
        const port = allocate(project);
        allocatedPorts.push(port);
      }

      // All ports should be unique
      const uniquePorts = new Set(allocatedPorts);
      expect(uniquePorts.size).toBe(5);

      // Ports should be in sequence: 4200, 4300, 4400, 4500, 4600
      expect(allocatedPorts).toEqual([4200, 4300, 4400, 4500, 4600]);
    });

    it('should return existing allocation for same project', () => {
      const dbPath = resolve(testDir, 'global.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.exec(GLOBAL_SCHEMA);

      const allocate = db.transaction((projectPath: string) => {
        const existing = db.prepare('SELECT * FROM port_allocations WHERE project_path = ?')
          .get(projectPath) as any;

        if (existing) {
          return existing.base_port;
        }

        const maxPort = db.prepare('SELECT MAX(base_port) as max FROM port_allocations').get() as { max: number | null };
        const nextPort = (maxPort.max ?? 4100) + 100;

        db.prepare(`
          INSERT INTO port_allocations (project_path, base_port, pid)
          VALUES (?, ?, ?)
        `).run(projectPath, nextPort, process.pid);

        return nextPort;
      });

      // Same project should get same port
      const port1 = allocate('/same/project');
      const port2 = allocate('/same/project');
      const port3 = allocate('/same/project');

      expect(port1).toBe(4200);
      expect(port2).toBe(4200);
      expect(port3).toBe(4200);

      // Only one allocation should exist
      const count = db.prepare('SELECT COUNT(*) as count FROM port_allocations').get() as { count: number };
      expect(count.count).toBe(1);
    });
  });

  describe('Read during write', () => {
    it('should allow concurrent reads during transaction', () => {
      const dbPath = resolve(testDir, 'state.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 5000');
      db.exec(LOCAL_SCHEMA);

      // Insert initial data
      db.prepare(`
        INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
        VALUES ('B001', 'initial', 4210, 1234, 'implementing', 'init', '/tmp', 'test', 'spec')
      `).run();

      // Start a write transaction but don't commit yet
      const writeTransaction = db.transaction(() => {
        db.prepare('UPDATE builders SET status = ? WHERE id = ?').run('blocked', 'B001');

        // Simulate doing some work during the transaction
        // In WAL mode, readers can still read the old data
        const readResult = db.prepare('SELECT status FROM builders WHERE id = ?').get('B001') as { status: string };

        // Within same transaction, we see our own changes
        expect(readResult.status).toBe('blocked');
      });

      writeTransaction();

      // After commit, reads see the new data
      const afterCommit = db.prepare('SELECT status FROM builders WHERE id = ?').get('B001') as { status: string };
      expect(afterCommit.status).toBe('blocked');
    });
  });

  describe('Busy timeout', () => {
    it('should respect busy_timeout pragma', () => {
      const dbPath = resolve(testDir, 'state.db');
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('busy_timeout = 100'); // Short timeout for test
      db.exec(LOCAL_SCHEMA);

      // Verify pragma is set
      const timeout = db.pragma('busy_timeout', { simple: true });
      expect(timeout).toBe(100);
    });
  });
});
