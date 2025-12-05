/**
 * Tower command - launches the tower dashboard showing all instances
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, openBrowser } from '../utils/shell.js';
import { getConfig } from '../utils/config.js';
import { execSync } from 'node:child_process';

// Default port for tower dashboard
const DEFAULT_TOWER_PORT = 4100;

export interface TowerStartOptions {
  port?: number;
}

export interface TowerStopOptions {
  port?: number;
}

/**
 * Check if a port is already in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Get all PIDs of processes listening on a port
 */
function getProcessesOnPort(port: number): number[] {
  try {
    const result = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf-8' });
    return result
      .trim()
      .split('\n')
      .map((line) => parseInt(line, 10))
      .filter((pid) => !isNaN(pid));
  } catch {
    return [];
  }
}

/**
 * Start the tower dashboard
 */
export async function towerStart(options: TowerStartOptions = {}): Promise<void> {
  const port = options.port || DEFAULT_TOWER_PORT;

  // Check if already running
  if (await isPortInUse(port)) {
    const dashboardUrl = `http://localhost:${port}`;
    logger.info(`Tower already running at ${dashboardUrl}`);
    await openBrowser(dashboardUrl);
    return;
  }

  const config = getConfig();

  // Find tower server script
  const tsScript = resolve(config.serversDir, 'tower-server.ts');
  const jsScript = resolve(config.serversDir, 'tower-server.js');

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
    fatal('Tower server not found');
  }

  logger.header('Starting Tower');
  logger.kv('Port', port);

  // Start tower server
  const serverProcess = spawnDetached(command, args, {
    cwd: process.cwd(),
  });

  if (!serverProcess.pid) {
    fatal('Failed to start tower server');
  }

  // Wait a moment for server to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dashboardUrl = `http://localhost:${port}`;

  logger.blank();
  logger.success('Tower started!');
  logger.kv('Dashboard', dashboardUrl);

  // Open in browser
  await openBrowser(dashboardUrl);
}

/**
 * Stop the tower dashboard
 */
export async function towerStop(options: TowerStopOptions = {}): Promise<void> {
  const port = options.port || DEFAULT_TOWER_PORT;

  logger.header('Stopping Tower');

  const pids = getProcessesOnPort(port);

  if (pids.length === 0) {
    logger.info('Tower is not running');
    return;
  }

  let stopped = 0;
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
      stopped++;
    } catch {
      // Process may have already exited
    }
  }

  if (stopped > 0) {
    logger.success(`Tower stopped (${stopped} process${stopped > 1 ? 'es' : ''}: PIDs ${pids.join(', ')})`);
  }
}

// Legacy export for backward compatibility
export const tower = towerStart;
