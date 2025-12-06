/**
 * Orphan Handler
 *
 * Detects and handles orphaned tmux sessions from previous agent-farm runs.
 * This prevents resource leaks and ensures clean startup.
 *
 * IMPORTANT: Only cleans up sessions for THIS project (based on port).
 * Sessions from other projects are left alone.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from './logger.js';
import { run } from './shell.js';
import { getConfig } from './config.js';

interface OrphanedSession {
  name: string;
  type: 'architect' | 'builder' | 'util';
}

/**
 * Find tmux sessions that match THIS project's agent-farm patterns
 * Only matches sessions with this project's port to avoid killing other projects
 */
async function findOrphanedSessions(): Promise<OrphanedSession[]> {
  const config = getConfig();
  const architectPort = config.architectPort;

  // Project-specific patterns - only match THIS project's sessions
  const projectPatterns = [
    new RegExp(`^af-architect-${architectPort}$`),  // Only this project's architect
    /^builder-\d+$/,  // Builder sessions (already unique per spec)
    /^util-[A-Z0-9]+$/,  // Util sessions (already unique)
    /^af-architect$/,  // Legacy pattern (no port) - safe to clean
  ];

  try {
    const result = await run('tmux list-sessions -F "#{session_name}" 2>/dev/null');
    const sessions = result.stdout.trim().split('\n').filter(Boolean);
    const orphans: OrphanedSession[] = [];

    for (const name of sessions) {
      if (projectPatterns[0].test(name) || projectPatterns[3].test(name)) {
        orphans.push({ name, type: 'architect' });
      } else if (projectPatterns[1].test(name)) {
        orphans.push({ name, type: 'builder' });
      } else if (projectPatterns[2].test(name)) {
        orphans.push({ name, type: 'util' });
      }
    }

    return orphans;
  } catch {
    // tmux not available or no sessions
    return [];
  }
}

/**
 * Kill an orphaned tmux session
 */
async function killSession(name: string): Promise<boolean> {
  try {
    await run(`tmux kill-session -t "${name}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for and handle orphaned sessions on startup
 *
 * Returns the number of sessions that were cleaned up.
 */
export async function handleOrphanedSessions(options: {
  kill?: boolean;
  silent?: boolean;
} = {}): Promise<number> {
  const orphans = await findOrphanedSessions();

  if (orphans.length === 0) {
    return 0;
  }

  if (!options.silent) {
    logger.warn(`Found ${orphans.length} orphaned tmux session(s) from previous run:`);
    for (const orphan of orphans) {
      logger.info(`  - ${orphan.name} (${orphan.type})`);
    }
  }

  if (options.kill) {
    let killed = 0;
    for (const orphan of orphans) {
      if (await killSession(orphan.name)) {
        killed++;
        if (!options.silent) {
          logger.debug(`  Killed: ${orphan.name}`);
        }
      }
    }

    if (!options.silent) {
      logger.info(`Cleaned up ${killed} orphaned session(s)`);
    }

    return killed;
  }

  return 0;
}

/**
 * Check for stale artifacts from bash script era
 */
export function checkStaleArtifacts(codevDir: string): string[] {
  const staleFiles = [
    'builders.md',  // Old bash state file
    '.architect.pid',
    '.architect.log',
  ];

  const found: string[] = [];
  for (const file of staleFiles) {
    const path = resolve(codevDir, file);
    if (existsSync(path)) {
      found.push(file);
    }
  }

  return found;
}

/**
 * Warn about stale artifacts if found
 */
export function warnAboutStaleArtifacts(codevDir: string): void {
  const stale = checkStaleArtifacts(codevDir);

  if (stale.length > 0) {
    logger.warn('Found stale artifacts from previous bash-based architect:');
    for (const file of stale) {
      logger.info(`  - ${file}`);
    }
    logger.info('These can be safely deleted. The new TypeScript implementation uses .agent-farm/');
  }
}
