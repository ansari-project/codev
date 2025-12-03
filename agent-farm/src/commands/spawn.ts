/**
 * Spawn command - creates a new builder for a project
 */

import { resolve, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import type { SpawnOptions, Builder } from '../types.js';
import { getConfig, ensureDirectories } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { run, spawnDetached, commandExists, findAvailablePort } from '../utils/shell.js';
import { loadState, upsertBuilder } from '../state.js';

/**
 * Spawn a new builder for a project
 */
export async function spawn(options: SpawnOptions): Promise<void> {
  const config = getConfig();
  const projectId = options.project;

  // Find the spec file
  const specFile = await findSpecFile(config.codevDir, projectId);
  if (!specFile) {
    fatal(`Spec not found for project: ${projectId}`);
  }

  const specName = basename(specFile, '.md');
  const builderId = generateBuilderId();
  // Sanitize spec name for git branch (allow only alphanumeric, dash, underscore)
  const safeName = specName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  const branchName = `builder/${builderId}-${safeName}`;
  const worktreePath = resolve(config.buildersDir, builderId);

  logger.header(`Spawning Builder ${builderId}`);
  logger.kv('Spec', specFile);
  logger.kv('Branch', branchName);
  logger.kv('Worktree', worktreePath);

  // Ensure directories exist
  await ensureDirectories(config);

  // Check for git
  if (!(await commandExists('git'))) {
    fatal('git not found');
  }

  // Check for ttyd
  if (!(await commandExists('ttyd'))) {
    fatal('ttyd not found. Install with: brew install ttyd');
  }

  // Create branch
  logger.info('Creating branch...');
  try {
    await run(`git branch ${branchName}`, { cwd: config.projectRoot });
  } catch (error) {
    // Branch might already exist, that's OK
    logger.debug(`Branch creation: ${error}`);
  }

  // Create worktree
  logger.info('Creating worktree...');
  try {
    await run(`git worktree add "${worktreePath}" ${branchName}`, { cwd: config.projectRoot });
  } catch (error) {
    fatal(`Failed to create worktree: ${error}`);
  }

  // Find available port
  const port = await findAvailablePort(config.builderPortRange[0]);

  // Get architect command from state
  const state = await loadState();
  const cmd = state.architect?.cmd || 'claude';

  // Start ttyd for builder
  logger.info('Starting builder terminal...');
  const ttydArgs = [
    '-p', String(port),
    '-t', `titleFixed=Builder ${builderId}`,
    '-t', 'fontSize=14',
    ...cmd.split(' '),
  ];

  const ttydProcess = spawnDetached('ttyd', ttydArgs, {
    cwd: worktreePath,
  });

  if (!ttydProcess.pid) {
    fatal('Failed to start ttyd process for builder');
  }

  // Create builder record
  const builder: Builder = {
    id: builderId,
    name: specName,
    port,
    pid: ttydProcess.pid,
    status: 'spawning',
    phase: 'init',
    worktree: worktreePath,
    branch: branchName,
  };

  await upsertBuilder(builder);

  logger.blank();
  logger.success(`Builder ${builderId} spawned!`);
  logger.kv('Terminal', `http://localhost:${port}`);
  logger.blank();
  logger.info('Builder prompt:');
  logger.info(`  You are a Builder working on spec: ${specFile}`);
  logger.info(`  Your worktree is at: ${worktreePath}`);
  logger.info(`  Your branch is: ${branchName}`);
}

/**
 * Find a spec file by project ID
 */
async function findSpecFile(codevDir: string, projectId: string): Promise<string | null> {
  const specsDir = resolve(codevDir, 'specs');

  if (!existsSync(specsDir)) {
    return null;
  }

  const files = await readdir(specsDir);

  // Try exact match first (e.g., "0001-feature.md")
  for (const file of files) {
    if (file.startsWith(projectId) && file.endsWith('.md')) {
      return resolve(specsDir, file);
    }
  }

  // Try partial match (e.g., just "0001")
  for (const file of files) {
    if (file.startsWith(projectId + '-') && file.endsWith('.md')) {
      return resolve(specsDir, file);
    }
  }

  return null;
}

/**
 * Generate a unique builder ID
 */
function generateBuilderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp.slice(-4)}${random}`.toUpperCase();
}
