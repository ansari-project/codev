/**
 * Start command - launches the architect dashboard
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { StartOptions, ArchitectState } from '../types.js';
import { getConfig, ensureDirectories } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, commandExists, findAvailablePort, openBrowser } from '../utils/shell.js';
import { loadState, setArchitect } from '../state.js';

const DEFAULT_CMD = 'claude';

/**
 * Start the architect dashboard
 */
export async function start(options: StartOptions = {}): Promise<void> {
  const config = getConfig();

  // Check if already running
  const state = await loadState();
  if (state.architect) {
    logger.warn(`Architect already running on port ${state.architect.port}`);
    logger.info(`Dashboard: http://localhost:${config.architectPort}`);
    return;
  }

  // Ensure directories exist
  await ensureDirectories(config);

  // Check for ttyd
  if (!(await commandExists('ttyd'))) {
    fatal('ttyd not found. Install with: brew install ttyd');
  }

  // Determine command to run
  const cmd = options.cmd || DEFAULT_CMD;

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
  const ttydArgs = [
    '-p', String(architectPort),
    '-t', 'titleFixed=Architect',
    '-t', 'fontSize=14',
    ...cmd.split(' '),
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

  // Start the dashboard server
  const dashboardPort = architectPort + 1; // Dashboard on next port
  await startDashboard(config.projectRoot, dashboardPort);

  logger.blank();
  logger.success('Agent Farm started!');
  logger.kv('Architect Terminal', `http://localhost:${architectPort}`);
  logger.kv('Dashboard', `http://localhost:${dashboardPort}`);

  // Open dashboard in browser
  await openBrowser(`http://localhost:${dashboardPort}`);
}

/**
 * Start the dashboard HTTP server
 */
async function startDashboard(projectRoot: string, port: number): Promise<void> {
  const config = getConfig();

  // Find dashboard server script (compiled TypeScript)
  const serverScript = resolve(config.serversDir, 'dashboard-server.js');

  if (!existsSync(serverScript)) {
    logger.warn(`Dashboard server not found at ${serverScript}, skipping dashboard`);
    return;
  }

  const serverProcess = spawnDetached('node', [serverScript, String(port)], {
    cwd: projectRoot,
  });

  if (!serverProcess.pid) {
    logger.warn('Failed to start dashboard server');
  }
}
