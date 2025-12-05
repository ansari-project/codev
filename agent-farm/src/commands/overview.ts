/**
 * Overview command - launches the overview dashboard showing all instances
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, openBrowser } from '../utils/shell.js';
import { getConfig } from '../utils/config.js';

// Default port for overview dashboard
const DEFAULT_OVERVIEW_PORT = 4100;

export interface OverviewOptions {
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
 * Start the overview dashboard
 */
export async function overview(options: OverviewOptions = {}): Promise<void> {
  const port = options.port || DEFAULT_OVERVIEW_PORT;

  // Check if port is available
  if (await isPortInUse(port)) {
    fatal(`Port ${port} already in use. Try: af overview --port <other>`);
  }

  const config = getConfig();

  // Find overview server script
  const tsScript = resolve(config.serversDir, 'overview-server.ts');
  const jsScript = resolve(config.serversDir, 'overview-server.js');

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
    fatal('Overview server not found');
  }

  logger.header('Starting Overview Dashboard');
  logger.kv('Port', port);

  // Start overview server
  const serverProcess = spawnDetached(command, args, {
    cwd: process.cwd(),
  });

  if (!serverProcess.pid) {
    fatal('Failed to start overview server');
  }

  // Wait a moment for server to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dashboardUrl = `http://localhost:${port}`;

  logger.blank();
  logger.success('Overview dashboard started!');
  logger.kv('Dashboard', dashboardUrl);

  // Open in browser
  await openBrowser(dashboardUrl);
}
