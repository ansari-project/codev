/**
 * Spawn command - creates a new builder for a project
 */

import { resolve, basename } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import type { SpawnOptions, Builder, Config } from '../types.js';
import { getConfig, ensureDirectories, getResolvedCommands } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { run, spawnDetached, commandExists, findAvailablePort } from '../utils/shell.js';
import { loadState, upsertBuilder } from '../state.js';

/**
 * Find and load a role file - tries local codev/roles/ first, falls back to bundled
 */
function loadRolePrompt(config: Config, roleName: string): { content: string; source: string } | null {
  // Try local project first
  const localPath = resolve(config.codevDir, 'roles', `${roleName}.md`);
  if (existsSync(localPath)) {
    return { content: readFileSync(localPath, 'utf-8'), source: 'local' };
  }

  // Fall back to bundled
  const bundledPath = resolve(config.bundledRolesDir, `${roleName}.md`);
  if (existsSync(bundledPath)) {
    return { content: readFileSync(bundledPath, 'utf-8'), source: 'bundled' };
  }

  return null;
}

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
  // Use the project ID as the builder ID for clarity (e.g., "0007" instead of "VEFV6JJD")
  const builderId = projectId;
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

  // Get builder command from config (hierarchy: CLI > config.json > default)
  const commands = getResolvedCommands();
  const baseCmd = commands.builder;

  // Build the command with builder role
  // Create tmux session for persistence through browser reloads
  const sessionName = `builder-${builderId}`;
  logger.info('Creating tmux session...');

  try {
    const { writeFileSync, chmodSync } = await import('node:fs');

    // Write role to a file to avoid shell escaping issues
    let roleFile: string | null = null;
    if (!options.noRole) {
      const role = loadRolePrompt(config, 'builder');
      if (role) {
        roleFile = resolve(worktreePath, '.builder-role.md');
        writeFileSync(roleFile, role.content);
        logger.info(`Loaded builder role (${role.source})`);
      }
    }

    // Build the start script
    const scriptPath = resolve(worktreePath, '.builder-start.sh');
    const roleArg = roleFile ? `--append-system-prompt "$(cat '${roleFile}')"` : '';
    writeFileSync(scriptPath, `#!/bin/bash\nexec ${baseCmd} ${roleArg}\n`);
    chmodSync(scriptPath, '755');

    // Create tmux session running the script
    await run(`tmux new-session -d -s "${sessionName}" -x 200 -y 50 -c "${worktreePath}" "${scriptPath}"`);
  } catch (error) {
    fatal(`Failed to create tmux session: ${error}`);
  }

  // Enable mouse scrolling in tmux
  await run('tmux set -g mouse on');

  // Start ttyd connecting to the tmux session
  // -W = writable mode (allows input)
  logger.info('Starting builder terminal...');
  const ttydArgs = [
    '-W',
    '-p', String(port),
    '-t', 'theme={"background":"#000000"}',
    'tmux', 'attach-session', '-t', sessionName,
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
    tmuxSession: sessionName,
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

