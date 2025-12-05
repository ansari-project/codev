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
 * Check if a worktree has uncommitted changes
 * Returns: dirty (has real changes), scaffoldOnly (only has .builder-* files)
 */
async function hasUncommittedChanges(worktreePath: string): Promise<{ dirty: boolean; scaffoldOnly: boolean; details: string }> {
  if (!existsSync(worktreePath)) {
    return { dirty: false, scaffoldOnly: false, details: '' };
  }

  try {
    // Check for uncommitted changes (staged and unstaged)
    const result = await run('git status --porcelain', { cwd: worktreePath });

    if (result.stdout.trim()) {
      // Count changed files, excluding builder scaffold files
      const scaffoldPattern = /^\?\? \.builder-/;
      const allLines = result.stdout.trim().split('\n').filter(Boolean);
      const nonScaffoldLines = allLines.filter((line) => !scaffoldPattern.test(line));

      if (nonScaffoldLines.length > 0) {
        return {
          dirty: true,
          scaffoldOnly: false,
          details: `${nonScaffoldLines.length} uncommitted file(s)`,
        };
      }

      // Only scaffold files present
      if (allLines.length > 0) {
        return { dirty: false, scaffoldOnly: true, details: '' };
      }
    }

    return { dirty: false, scaffoldOnly: false, details: '' };
  } catch {
    // If git status fails, assume dirty to be safe
    return { dirty: true, scaffoldOnly: false, details: 'Unable to check status' };
  }
}

/**
 * Cleanup a builder's worktree and branch
 */
export async function cleanup(options: CleanupOptions): Promise<void> {
  const config = getConfig();
  const projectId = options.project;

  // Load state to find the builder
  const state = loadState();
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
  const isShellMode = builder.type === 'shell';

  logger.header(`Cleaning up ${isShellMode ? 'Shell' : 'Builder'} ${builder.id}`);
  logger.kv('Name', builder.name);
  if (!isShellMode) {
    logger.kv('Worktree', builder.worktree);
    logger.kv('Branch', builder.branch);
  }

  // Check for uncommitted changes before cleanup (skip for shell mode - no worktree)
  let useForce = force || false;
  if (!isShellMode) {
    const { dirty, scaffoldOnly, details } = await hasUncommittedChanges(builder.worktree);
    if (dirty && !force) {
      logger.error(`Worktree has uncommitted changes: ${details}`);
      logger.error('Use --force to delete anyway (WARNING: changes will be lost!)');
      fatal('Cleanup aborted to prevent data loss.');
    }

    if (dirty && force) {
      logger.warn(`Worktree has uncommitted changes: ${details}`);
      logger.warn('Proceeding with --force (changes will be lost!)');
    }

    // Use force for git worktree if only scaffold files present (or explicit force)
    useForce = force || scaffoldOnly;
  }

  // Kill ttyd process if running
  if (builder.pid) {
    logger.info('Stopping builder terminal...');
    try {
      process.kill(builder.pid, 'SIGTERM');
    } catch {
      // Process may already be dead
    }
  }

  // Kill tmux session if exists (use stored session name for correct shell/builder naming)
  const sessionName = builder.tmuxSession || `builder-${builder.id}`;
  try {
    await run(`tmux kill-session -t "${sessionName}" 2>/dev/null`);
    logger.info('Killed tmux session');
  } catch {
    // Session may not exist
  }

  // Remove worktree (skip for shell mode - no worktree created)
  if (!isShellMode && existsSync(builder.worktree)) {
    logger.info('Removing worktree...');
    try {
      await run(`git worktree remove "${builder.worktree}"${useForce ? ' --force' : ''}`, {
        cwd: config.projectRoot,
      });
    } catch (error) {
      if (useForce) {
        // Force remove directory if git worktree remove fails
        await rm(builder.worktree, { recursive: true, force: true });
        await run('git worktree prune', { cwd: config.projectRoot });
      } else {
        fatal(`Failed to remove worktree: ${error}. Use --force to override.`);
      }
    }
  }

  // Delete branch (skip for shell mode)
  if (!isShellMode && builder.branch) {
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
  }

  // Remove from state
  removeBuilder(builder.id);

  logger.blank();
  logger.success(`Builder ${builder.id} cleaned up!`);
}
