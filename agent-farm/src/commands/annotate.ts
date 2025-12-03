/**
 * Annotate command - opens file annotation viewer
 */

import { resolve, basename } from 'node:path';
import { existsSync } from 'node:fs';
import type { Annotation } from '../types.js';
import { getConfig } from '../utils/index.js';
import { logger, fatal } from '../utils/logger.js';
import { spawnDetached, findAvailablePort, openBrowser } from '../utils/shell.js';
import { addAnnotation } from '../state.js';

interface AnnotateOptions {
  file: string;
}

/**
 * Open file annotation viewer
 */
export async function annotate(options: AnnotateOptions): Promise<void> {
  const config = getConfig();

  // Resolve file path
  let filePath: string;
  if (options.file.startsWith('/')) {
    filePath = options.file;
  } else {
    filePath = resolve(config.projectRoot, options.file);
  }

  // Check file exists
  if (!existsSync(filePath)) {
    fatal(`File not found: ${filePath}`);
  }

  // Generate ID
  const id = generateAnnotationId();

  // Find available port
  const port = await findAvailablePort(config.annotatePortRange[0]);

  logger.header('Opening Annotation Viewer');
  logger.kv('File', filePath);
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

  await addAnnotation(annotation);

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
