/**
 * Configuration management for Agent Farm
 */

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the project root by looking for codev/ directory
 */
function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = startDir;

  while (dir !== '/') {
    // Check for codev/ directory (indicates project using codev)
    if (existsSync(resolve(dir, 'codev'))) {
      return dir;
    }
    // Check for .git as fallback
    if (existsSync(resolve(dir, '.git'))) {
      return dir;
    }
    dir = dirname(dir);
  }

  // Default to current directory
  return startDir;
}

/**
 * Get the templates directory (bundled with package)
 */
function getTemplatesDir(): string {
  // In development, templates are in agent-farm/templates
  // In production (npm), they're in the package
  const devPath = resolve(__dirname, '../../templates');
  if (existsSync(devPath)) {
    return devPath;
  }

  // Fallback to package location
  return resolve(__dirname, '../templates');
}

/**
 * Get the servers directory (compiled TypeScript servers)
 */
function getServersDir(): string {
  // Servers are compiled to dist/servers/
  const devPath = resolve(__dirname, '../servers');
  if (existsSync(devPath)) {
    return devPath;
  }

  // In npm package, they're alongside other compiled files
  return resolve(__dirname, './servers');
}

/**
 * Get the bundled roles directory
 */
function getBundledRolesDir(): string {
  // In development, roles are in agent-farm/roles
  const devPath = resolve(__dirname, '../../roles');
  if (existsSync(devPath)) {
    return devPath;
  }

  // Fallback to package location
  return resolve(__dirname, '../roles');
}

/**
 * Build configuration for the current project
 */
export function getConfig(): Config {
  const projectRoot = findProjectRoot();
  const codevDir = resolve(projectRoot, 'codev');

  return {
    projectRoot,
    codevDir,
    buildersDir: resolve(projectRoot, '.builders'),
    stateDir: resolve(projectRoot, '.agent-farm'),
    templatesDir: getTemplatesDir(),
    serversDir: getServersDir(),
    bundledRolesDir: getBundledRolesDir(),
    // New port scheme (42xx range)
    dashboardPort: 4200,
    architectPort: 4201,
    builderPortRange: [4210, 4229] as [number, number],
    utilPortRange: [4230, 4249] as [number, number],
    annotatePortRange: [4250, 4269] as [number, number],
  };
}

/**
 * Ensure required directories exist
 */
export async function ensureDirectories(config: Config): Promise<void> {
  const { mkdir } = await import('node:fs/promises');

  const dirs = [
    config.buildersDir,
    config.stateDir,
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}
