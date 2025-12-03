/**
 * Util command - spawns a utility terminal
 */

import type { UtilTerminal } from '../types.js';
import { getConfig } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, commandExists, findAvailablePort } from '../utils/shell.js';
import { loadState, addUtil } from '../state.js';

interface UtilOptions {
  name?: string;
}

/**
 * Spawn a utility terminal
 */
export async function util(options: UtilOptions = {}): Promise<void> {
  const config = getConfig();

  // Check for ttyd
  if (!(await commandExists('ttyd'))) {
    fatal('ttyd not found. Install with: brew install ttyd');
  }

  // Generate ID and name
  const id = generateUtilId();
  const name = options.name || `util-${id}`;

  // Find available port
  const port = await findAvailablePort(config.utilPortRange[0]);

  // Get shell command
  const shell = process.env.SHELL || '/bin/bash';

  logger.header(`Spawning Utility Terminal`);
  logger.kv('ID', id);
  logger.kv('Name', name);
  logger.kv('Port', port);

  // Start ttyd
  const ttydArgs = [
    '-p', String(port),
    '-t', `titleFixed=${name}`,
    '-t', 'fontSize=14',
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

  await addUtil(utilTerminal);

  logger.blank();
  logger.success(`Utility terminal spawned!`);
  logger.kv('Terminal', `http://localhost:${port}`);
}

/**
 * Generate a unique utility ID
 */
function generateUtilId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `U${timestamp.slice(-3)}${random}`.toUpperCase();
}
