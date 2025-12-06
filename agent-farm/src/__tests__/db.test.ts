/**
 * Tests for database layer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { LOCAL_SCHEMA, GLOBAL_SCHEMA } from '../db/schema.js';

describe('Database Schema', () => {
  const testDir = resolve(process.cwd(), '.test-db');
  let db: Database.Database;

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create test database
    db = new Database(resolve(testDir, 'test.db'));
    db.pragma('journal_mode = WAL');
  });

  afterEach(() => {
    db.close();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('LOCAL_SCHEMA', () => {
    beforeEach(() => {
      db.exec(LOCAL_SCHEMA);
    });

    it('should create all required tables', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all() as Array<{ name: string }>;

      const tableNames = tables.map(t => t.name).sort();
      expect(tableNames).toContain('_migrations');
      expect(tableNames).toContain('architect');
      expect(tableNames).toContain('builders');
      expect(tableNames).toContain('utils');
      expect(tableNames).toContain('annotations');
    });

    it('should enforce architect singleton constraint', () => {
      // Insert first architect
      db.prepare(`
        INSERT INTO architect (id, pid, port, cmd, started_at)
        VALUES (1, 1234, 4201, 'claude', datetime('now'))
      `).run();

      // Attempting to insert a second architect with different id should fail
      expect(() => {
        db.prepare(`
          INSERT INTO architect (id, pid, port, cmd, started_at)
          VALUES (2, 5678, 4201, 'claude', datetime('now'))
        `).run();
      }).toThrow();
    });

    it('should enforce builder status CHECK constraint', () => {
      // Valid status should work
      db.prepare(`
        INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
        VALUES ('B001', 'test', 4210, 1234, 'implementing', 'init', '/tmp', 'test', 'spec')
      `).run();

      // Invalid status should fail
      expect(() => {
        db.prepare(`
          INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
          VALUES ('B002', 'test2', 4211, 5678, 'invalid_status', 'init', '/tmp', 'test', 'spec')
        `).run();
      }).toThrow();
    });

    it('should enforce unique port constraint on builders', () => {
      db.prepare(`
        INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
        VALUES ('B001', 'test1', 4210, 1234, 'implementing', 'init', '/tmp', 'test1', 'spec')
      `).run();

      // Same port should fail
      expect(() => {
        db.prepare(`
          INSERT INTO builders (id, name, port, pid, status, phase, worktree, branch, type)
          VALUES ('B002', 'test2', 4210, 5678, 'implementing', 'init', '/tmp', 'test2', 'spec')
        `).run();
      }).toThrow();
    });

    it('should create indexes', () => {
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `).all() as Array<{ name: string }>;

      const indexNames = indexes.map(i => i.name);
      expect(indexNames).toContain('idx_builders_status');
      expect(indexNames).toContain('idx_builders_port');
    });
  });

  describe('GLOBAL_SCHEMA', () => {
    beforeEach(() => {
      db.exec(GLOBAL_SCHEMA);
    });

    it('should create port_allocations table', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all() as Array<{ name: string }>;

      expect(tables.map(t => t.name)).toContain('port_allocations');
    });

    it('should enforce base_port constraint', () => {
      // Valid port (4200, divisible by 100)
      db.prepare(`
        INSERT INTO port_allocations (project_path, base_port, pid)
        VALUES ('/test/project', 4200, 1234)
      `).run();

      // Invalid port (4250, not divisible by 100)
      expect(() => {
        db.prepare(`
          INSERT INTO port_allocations (project_path, base_port, pid)
          VALUES ('/test/project2', 4250, 5678)
        `).run();
      }).toThrow();

      // Invalid port (too low)
      expect(() => {
        db.prepare(`
          INSERT INTO port_allocations (project_path, base_port, pid)
          VALUES ('/test/project3', 4100, 5678)
        `).run();
      }).toThrow();
    });

    it('should enforce unique base_port', () => {
      db.prepare(`
        INSERT INTO port_allocations (project_path, base_port, pid)
        VALUES ('/test/project1', 4200, 1234)
      `).run();

      expect(() => {
        db.prepare(`
          INSERT INTO port_allocations (project_path, base_port, pid)
          VALUES ('/test/project2', 4200, 5678)
        `).run();
      }).toThrow();
    });
  });
});
