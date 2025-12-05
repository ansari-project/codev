/**
 * Util command - spawns a utility terminal
 *
 * When the dashboard is running, this creates a tab in the dashboard.
 * When the dashboard is not running, it spawns the terminal directly.
 */

import type { UtilTerminal } from '../types.js';
import { getConfig, getResolvedCommands } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, commandExists, findAvailablePort, openBrowser } from '../utils/shell.js';
import { loadState, addUtil } from '../state.js';

interface UtilOptions {
  name?: string;
}

/**
 * Try to create a shell tab via the dashboard API
 * Returns true if successful, false if dashboard not available
 */
async function tryDashboardApi(name?: string): Promise<boolean> {
  const state = loadState();

  // Dashboard runs on architectPort + 1
  if (!state.architect) {
    return false;
  }

  const config = getConfig();
  const dashboardPort = config.architectPort + 1;

  try {
    const response = await fetch(`http://localhost:${dashboardPort}/api/tabs/shell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const result = await response.json() as { name: string; port: number };
      logger.success(`Shell opened in dashboard tab`);
      logger.kv('Name', result.name);
      return true;
    }

    // Dashboard returned an error, fall through to direct spawn
    return false;
  } catch {
    // Dashboard not available
    return false;
  }
}

/**
 * Spawn a utility terminal
 */
export async function util(options: UtilOptions = {}): Promise<void> {
  const config = getConfig();

  // Try to use dashboard API first (if dashboard is running)
  const dashboardOpened = await tryDashboardApi(options.name);
  if (dashboardOpened) {
    return;
  }

  // Fall back to direct spawn
  // Check for ttyd
  if (!(await commandExists('ttyd'))) {
    fatal('ttyd not found. Install with: brew install ttyd');
  }

  // Generate ID and name
  const id = generateUtilId();
  const name = options.name || `util-${id}`;

  // Find available port
  const port = await findAvailablePort(config.utilPortRange[0]);

  // Get shell command from config (hierarchy: CLI > config.json > default)
  const commands = getResolvedCommands();
  const shell = commands.shell;

  logger.header(`Spawning Utility Terminal`);
  logger.kv('ID', id);
  logger.kv('Name', name);
  logger.kv('Port', port);

  // Start ttyd
  const ttydArgs = [
    '-W',
    '-p', String(port),
    '-t', `titleFixed=${name}`,
    '-t', 'fontSize=14',
    '-t', 'rightClickSelectsWord=true',  // Enable word selection on right-click for better UX
    shell,
  ];

  const ttydProcess = spawnDetached('ttyd', ttydArgs, {
    cwd: config.projectRoot,
  });

  if (!ttydProcess.pid) {
    fatal('Failed to start ttyd process for utility terminal');
  }

  // Create util record
  const utilTerminal: UtilTerminal = {
    id,
    name,
    port,
    pid: ttydProcess.pid,
  };

  addUtil(utilTerminal);

  logger.blank();
  logger.success(`Utility terminal spawned!`);
  logger.kv('Terminal', `http://localhost:${port}`);

  // Open in browser if not using dashboard
  const url = `http://localhost:${port}`;
  await openBrowser(url);
}

/**
 * Generate a unique utility ID
 */
function generateUtilId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `U${timestamp.slice(-3)}${random}`.toUpperCase();
}
