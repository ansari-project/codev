/**
 * Annotate command - opens file annotation viewer
 *
 * When the dashboard is running, this creates a tab in the dashboard.
 * When the dashboard is not running, it opens the annotation viewer directly.
 */

import { resolve, basename } from 'node:path';
import { existsSync } from 'node:fs';
import type { Annotation } from '../types.js';
import { getConfig } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, findAvailablePort, openBrowser } from '../utils/shell.js';
import { addAnnotation, loadState } from '../state.js';

interface AnnotateOptions {
  file: string;
}

/**
 * Try to create a file tab via the dashboard API
 * Returns true if successful, false if dashboard not available
 */
async function tryDashboardApi(filePath: string): Promise<boolean> {
  const state = loadState();

  // Dashboard runs on dashboardPort (not architectPort + 1)
  if (!state.architect) {
    return false;
  }

  const config = getConfig();
  const dashboardPort = config.dashboardPort;

  try {
    const response = await fetch(`http://localhost:${dashboardPort}/api/tabs/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });

    if (response.ok) {
      const result = (await response.json()) as { existing?: boolean };
      logger.success(`Opened in dashboard tab`);
      logger.kv('File', filePath);
      if (result.existing) {
        logger.info('(File was already open)');
      }
      return true;
    }

    // Dashboard returned an error, fall through to direct open
    return false;
  } catch {
    // Dashboard not available
    return false;
  }
}

/**
 * Open file annotation viewer
 */
export async function annotate(options: AnnotateOptions): Promise<void> {
  const config = getConfig();

  // Resolve file path relative to current directory (works correctly in worktrees)
  let filePath: string;
  if (options.file.startsWith('/')) {
    filePath = options.file;
  } else {
    filePath = resolve(process.cwd(), options.file);
  }

  // Check file exists
  if (!existsSync(filePath)) {
    fatal(`File not found: ${filePath}`);
  }

  // Try to use dashboard API first (if dashboard is running)
  const dashboardOpened = await tryDashboardApi(filePath);
  if (dashboardOpened) {
    return;
  }

  // Fall back to direct open
  logger.header('Opening Annotation Viewer');
  logger.kv('File', filePath);

  // Generate ID
  const id = generateAnnotationId();

  // Find available port
  const port = await findAvailablePort(config.annotatePortRange[0]);

  logger.kv('Port', port);

  // Find annotation server script (compiled TypeScript)
  const serverScript = resolve(config.serversDir, 'annotate-server.js');

  if (!existsSync(serverScript)) {
    fatal(`Annotation server not found at ${serverScript}`);
  }

  // Start annotation server
  const serverProcess = spawnDetached('node', [serverScript, String(port), filePath], {
    cwd: config.projectRoot,
  });

  if (!serverProcess.pid) {
    fatal('Failed to start annotation server');
  }

  // Create annotation record
  const annotation: Annotation = {
    id,
    file: filePath,
    port,
    pid: serverProcess.pid,
    parent: {
      type: 'architect',
    },
  };

  addAnnotation(annotation);

  // Wait a moment for server to start
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Open in browser
  const url = `http://localhost:${port}`;
  await openBrowser(url);

  logger.blank();
  logger.success('Annotation viewer opened!');
  logger.kv('URL', url);
}

/**
 * Generate a unique annotation ID
 */
function generateAnnotationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `A${timestamp.slice(-3)}${random}`.toUpperCase();
}
