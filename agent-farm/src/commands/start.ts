/**
 * Start command - launches the architect dashboard
 */

import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { StartOptions, ArchitectState } from '../types.js';
import { getConfig, ensureDirectories } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, commandExists, findAvailablePort, openBrowser } from '../utils/shell.js';
import { loadState, setArchitect } from '../state.js';

const DEFAULT_CMD = 'claude';

/**
 * Find and load a role file - tries local codev/roles/ first, falls back to bundled
 */
function loadRolePrompt(config: { codevDir: string; bundledRolesDir: string }, roleName: string): { content: string; source: string } | null {
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
 * Start the architect dashboard
 */
export async function start(options: StartOptions = {}): Promise<void> {
  const config = getConfig();

  // Check if already running
  const state = await loadState();
  if (state.architect) {
    logger.warn(`Architect already running on port ${state.architect.port}`);
    logger.info(`Dashboard: http://localhost:${config.dashboardPort}`);
    return;
  }

  // Ensure directories exist
  await ensureDirectories(config);

  // Check for ttyd
  if (!(await commandExists('ttyd'))) {
    fatal('ttyd not found. Install with: brew install ttyd');
  }

  // Determine base command to run (CLI option > env var > default)
  let cmd = options.cmd || process.env.AGENT_FARM_CMD || DEFAULT_CMD;

  // Load architect role if available and not disabled
  if (!options.noRole) {
    const role = loadRolePrompt(config, 'architect');
    if (role) {
      // Escape the prompt for shell and append to command
      const escapedPrompt = role.content.replace(/'/g, "'\\''");
      cmd = `${cmd} --append-system-prompt '${escapedPrompt}'`;
      logger.info(`Loaded architect role (${role.source})`);
    }
  }

  // Check if command exists
  const cmdName = cmd.split(' ')[0];
  if (!(await commandExists(cmdName))) {
    fatal(`Command not found: ${cmdName}`);
  }

  // Find available port for architect terminal
  let architectPort = config.architectPort;
  if (options.port !== undefined) {
    const parsedPort = Number(options.port);
    if (!Number.isFinite(parsedPort) || parsedPort < 1024 || parsedPort > 65535) {
      fatal(`Invalid port: ${options.port}. Must be a number between 1024-65535`);
    }
    architectPort = parsedPort;
  }

  logger.header('Starting Agent Farm');
  logger.kv('Project', config.projectRoot);
  logger.kv('Command', cmd);
  logger.kv('Port', architectPort);

  // Start ttyd for architect terminal
  // -W = writable mode (allows input)
  // Use bash -c to properly handle commands with quoted arguments
  const ttydArgs = [
    '-W',
    '-p', String(architectPort),
    '-t', 'titleFixed=Architect',
    '-t', 'fontSize=14',
    'bash', '-c', cmd,
  ];

  const ttydProcess = spawnDetached('ttyd', ttydArgs, {
    cwd: config.projectRoot,
  });

  if (!ttydProcess.pid) {
    fatal('Failed to start ttyd process');
  }

  // Save architect state
  const architectState: ArchitectState = {
    port: architectPort,
    pid: ttydProcess.pid,
    cmd,
    startedAt: new Date().toISOString(),
  };

  await setArchitect(architectState);

  // Wait a moment for ttyd to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Start the dashboard server on the main port
  const dashboardPort = config.dashboardPort;
  await startDashboard(config.projectRoot, dashboardPort, architectPort);

  logger.blank();
  logger.success('Agent Farm started!');
  logger.kv('Dashboard', `http://localhost:${dashboardPort}`);

  // Open dashboard in browser
  await openBrowser(`http://localhost:${dashboardPort}`);
}

/**
 * Start the dashboard HTTP server
 */
async function startDashboard(projectRoot: string, port: number, _architectPort: number): Promise<void> {
  const config = getConfig();

  // Try TypeScript source first (dev mode), then compiled JS
  const tsScript = resolve(config.serversDir, 'dashboard-server.ts');
  const jsScript = resolve(config.serversDir, 'dashboard-server.js');

  let command: string;
  let args: string[];

  if (existsSync(tsScript)) {
    // Dev mode: run with tsx
    command = 'npx';
    args = ['tsx', tsScript, String(port)];
  } else if (existsSync(jsScript)) {
    // Prod mode: run compiled JS
    command = 'node';
    args = [jsScript, String(port)];
  } else {
    logger.warn('Dashboard server not found, skipping dashboard');
    return;
  }

  const serverProcess = spawnDetached(command, args, {
    cwd: projectRoot,
  });

  if (!serverProcess.pid) {
    logger.warn('Failed to start dashboard server');
  }
}
