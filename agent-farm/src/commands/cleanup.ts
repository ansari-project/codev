/**
 * Cleanup command - removes builder worktrees and branches
 */

import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import type { Builder } from '../types.js';
import { getConfig } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { run } from '../utils/shell.js';
import { loadState, removeBuilder } from '../state.js';

export interface CleanupOptions {
  project: string;
  force?: boolean;
}

/**
 * Cleanup a builder's worktree and branch
 */
export async function cleanup(options: CleanupOptions): Promise<void> {
  const config = getConfig();
  const projectId = options.project;

  // Load state to find the builder
  const state = await loadState();
  const builder = state.builders.find((b) => b.id === projectId);

  if (!builder) {
    // Try to find by name pattern
    const byName = state.builders.find((b) => b.name.includes(projectId));
    if (byName) {
      return cleanupBuilder(byName, options.force);
    }
    fatal(`Builder not found for project: ${projectId}`);
  }

  await cleanupBuilder(builder, options.force);
}

async function cleanupBuilder(builder: Builder, force?: boolean): Promise<void> {
  const config = getConfig();

  logger.header(`Cleaning up Builder ${builder.id}`);
  logger.kv('Name', builder.name);
  logger.kv('Worktree', builder.worktree);
  logger.kv('Branch', builder.branch);

  // Kill ttyd process if running
  if (builder.pid) {
    logger.info('Stopping builder terminal...');
    try {
      process.kill(builder.pid, 'SIGTERM');
    } catch {
      // Process may already be dead
    }
  }

  // Kill tmux session if exists
  const sessionName = `builder-${builder.id}`;
  try {
    await run(`tmux kill-session -t "${sessionName}" 2>/dev/null`);
    logger.info('Killed tmux session');
  } catch {
    // Session may not exist
  }

  // Remove worktree
  if (existsSync(builder.worktree)) {
    logger.info('Removing worktree...');
    try {
      await run(`git worktree remove "${builder.worktree}"${force ? ' --force' : ''}`, {
        cwd: config.projectRoot,
      });
    } catch (error) {
      if (force) {
        // Force remove directory if git worktree remove fails
        await rm(builder.worktree, { recursive: true, force: true });
        await run('git worktree prune', { cwd: config.projectRoot });
      } else {
        fatal(`Failed to remove worktree: ${error}. Use --force to override.`);
      }
    }
  }

  // Delete branch
  logger.info('Deleting branch...');
  try {
    // Try -d first (safe delete, only if merged)
    await run(`git branch -d "${builder.branch}"`, { cwd: config.projectRoot });
  } catch {
    if (force) {
      // Force delete with -D
      try {
        await run(`git branch -D "${builder.branch}"`, { cwd: config.projectRoot });
      } catch {
        logger.warn(`Could not delete branch ${builder.branch}`);
      }
    } else {
      logger.warn(`Branch ${builder.branch} not fully merged. Use --force to delete anyway.`);
    }
  }

  // Remove from state
  await removeBuilder(builder.id);

  logger.blank();
  logger.success(`Builder ${builder.id} cleaned up!`);
}
