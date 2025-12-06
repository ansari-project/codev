/**
 * SQLite Database Module
 *
 * Provides singleton database access for both local state and global registry.
 * Uses better-sqlite3 for synchronous operations with proper concurrency handling.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { LOCAL_SCHEMA, GLOBAL_SCHEMA } from './schema.js';
import { migrateLocalFromJson, migrateGlobalFromJson } from './migrate.js';
import { getConfig } from '../utils/index.js';

// Singleton instances
let _localDb: Database.Database | null = null;
let _globalDb: Database.Database | null = null;

/**
 * Ensure a directory exists
 */
function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Configure database pragmas for optimal concurrency and durability
 */
function configurePragmas(db: Database.Database): void {
  // Enable WAL mode for better concurrency (readers don't block writers)
  const journalMode = db.pragma('journal_mode = WAL', { simple: true });
  if (journalMode !== 'wal') {
    console.warn('[warn] WAL mode unavailable, using DELETE mode (concurrency limited)');
  }

  // NORMAL synchronous mode balances safety and performance
  db.pragma('synchronous = NORMAL');

  // 5 second timeout when waiting for locks
  db.pragma('busy_timeout = 5000');

  // Enable foreign key constraints
  db.pragma('foreign_keys = ON');
}

/**
 * Get the local database instance (state.db)
 * Creates and initializes the database if it doesn't exist
 */
export function getDb(): Database.Database {
  if (!_localDb) {
    _localDb = ensureLocalDatabase();
  }
  return _localDb;
}

/**
 * Get the global database instance (global.db)
 * Creates and initializes the database if it doesn't exist
 */
export function getGlobalDb(): Database.Database {
  if (!_globalDb) {
    _globalDb = ensureGlobalDatabase();
  }
  return _globalDb;
}

/**
 * Close the local database connection
 */
export function closeDb(): void {
  if (_localDb) {
    _localDb.close();
    _localDb = null;
  }
}

/**
 * Close the global database connection
 */
export function closeGlobalDb(): void {
  if (_globalDb) {
    _globalDb.close();
    _globalDb = null;
  }
}

/**
 * Close all database connections
 */
export function closeAllDbs(): void {
  closeDb();
  closeGlobalDb();
}

/**
 * Get the path to the local database
 */
export function getDbPath(): string {
  const config = getConfig();
  return resolve(config.stateDir, 'state.db');
}

/**
 * Get the path to the global database
 */
export function getGlobalDbPath(): string {
  return resolve(homedir(), '.agent-farm', 'global.db');
}

/**
 * Initialize the local database (state.db)
 */
function ensureLocalDatabase(): Database.Database {
  const config = getConfig();
  const dbPath = resolve(config.stateDir, 'state.db');
  const jsonPath = resolve(config.stateDir, 'state.json');

  // Ensure directory exists
  ensureDir(config.stateDir);

  // Create/open database
  const db = new Database(dbPath);
  configurePragmas(db);

  // Run schema (creates tables if they don't exist)
  db.exec(LOCAL_SCHEMA);

  // Check if migration is needed
  const migrated = db.prepare('SELECT version FROM _migrations WHERE version = 1').get();

  if (!migrated && existsSync(jsonPath)) {
    // Migrate from JSON
    migrateLocalFromJson(db, jsonPath);

    // Record migration
    db.prepare('INSERT INTO _migrations (version) VALUES (1)').run();

    // Backup original JSON and remove it
    copyFileSync(jsonPath, jsonPath + '.bak');
    unlinkSync(jsonPath);

    console.log('[info] Migrated state.json to state.db (backup at state.json.bak)');
  } else if (!migrated) {
    // Fresh install, just mark migration as done
    db.prepare('INSERT OR IGNORE INTO _migrations (version) VALUES (1)').run();
    console.log('[info] Created new state.db at', dbPath);
  }

  return db;
}

/**
 * Initialize the global database (global.db)
 */
function ensureGlobalDatabase(): Database.Database {
  const globalDir = resolve(homedir(), '.agent-farm');
  const dbPath = resolve(globalDir, 'global.db');
  const jsonPath = resolve(globalDir, 'ports.json');

  // Ensure directory exists
  ensureDir(globalDir);

  // Create/open database
  const db = new Database(dbPath);
  configurePragmas(db);

  // Run schema (creates tables if they don't exist)
  db.exec(GLOBAL_SCHEMA);

  // Check if migration is needed
  const migrated = db.prepare('SELECT version FROM _migrations WHERE version = 1').get();

  if (!migrated && existsSync(jsonPath)) {
    // Migrate from JSON
    migrateGlobalFromJson(db, jsonPath);

    // Record migration
    db.prepare('INSERT INTO _migrations (version) VALUES (1)').run();

    // Backup original JSON and remove it
    copyFileSync(jsonPath, jsonPath + '.bak');
    unlinkSync(jsonPath);

    console.log('[info] Migrated ports.json to global.db (backup at ports.json.bak)');
  } else if (!migrated) {
    // Fresh install, just mark migration as done
    db.prepare('INSERT OR IGNORE INTO _migrations (version) VALUES (1)').run();
    console.log('[info] Created new global.db at', dbPath);
  }

  return db;
}

// Re-export types and utilities
export { LOCAL_SCHEMA, GLOBAL_SCHEMA } from './schema.js';
export { withRetry } from './errors.js';
export type {
  DbArchitect,
  DbBuilder,
  DbUtil,
  DbAnnotation,
  DbPortAllocation,
} from './types.js';
