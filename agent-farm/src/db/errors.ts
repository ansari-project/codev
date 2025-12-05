/**
 * Database Error Handling Utilities
 *
 * Provides retry logic for SQLITE_BUSY errors and clear error messages
 */

/**
 * SQLite error with code property
 */
interface SqliteError extends Error {
  code?: string;
}

/**
 * Execute a function with retry logic for SQLITE_BUSY errors
 *
 * The busy_timeout pragma handles most cases, but this provides an additional
 * layer of retry logic for extreme contention scenarios.
 */
export function withRetry<T>(fn: () => T, maxRetries = 3): T {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (err: unknown) {
      const sqliteErr = err as SqliteError;
      if (sqliteErr.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
        console.warn(`[warn] Database busy, retrying (${i + 1}/${maxRetries})...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Unreachable');
}

/**
 * Check if better-sqlite3 is available and provide helpful error messages
 */
export function checkDatabaseAvailability(): void {
  try {
    require('better-sqlite3');
  } catch (err: unknown) {
    const loadErr = err as Error;
    console.error('[error] better-sqlite3 failed to load. Native compilation may have failed.');
    console.error('[error] Error:', loadErr.message);
    console.error('[error] Try the following:');
    console.error('[error]   1. npm rebuild better-sqlite3');
    console.error('[error]   2. npm install better-sqlite3 --build-from-source');
    console.error('[error]   3. Ensure build tools are installed (Xcode on macOS, build-essential on Linux)');
    process.exit(1);
  }
}
