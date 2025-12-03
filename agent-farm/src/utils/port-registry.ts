/**
 * Global Port Registry
 *
 * Manages port block allocation across multiple repositories to prevent
 * port conflicts when running multiple architect sessions simultaneously.
 *
 * Registry location: ~/.agent-farm/ports.json
 * Each repository gets a 100-port block (e.g., 4200-4299, 4300-4399, etc.)
 *
 * Uses file locking to prevent race conditions during concurrent access.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, unlinkSync, openSync, closeSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Base port for first allocation
const BASE_PORT = 4200;
// Ports per project
const PORT_BLOCK_SIZE = 100;
// Maximum allocations (4200-9999 = ~58 projects)
const MAX_ALLOCATIONS = 58;

interface PortEntry {
  basePort: number;
  registered: string;
  lastUsed?: string;
  pid?: number;  // PID of the process that owns this allocation
}

interface PortRegistry {
  version: number;  // Schema version for future compatibility
  entries: {
    [projectPath: string]: PortEntry;
  };
}

// Current schema version
const REGISTRY_VERSION = 1;

/**
 * Get the global registry directory path
 */
function getRegistryDir(): string {
  return resolve(homedir(), '.agent-farm');
}

/**
 * Get the registry file path
 */
function getRegistryPath(): string {
  return resolve(getRegistryDir(), 'ports.json');
}

/**
 * Ensure the registry directory exists with proper permissions
 */
function ensureRegistryDir(): void {
  const dir = getRegistryDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Simple file lock using a .lock file
 * Returns unlock function
 */
async function acquireLock(timeout = 5000): Promise<() => void> {
  const lockPath = resolve(getRegistryDir(), 'ports.lock');
  const startTime = Date.now();

  ensureRegistryDir();

  while (Date.now() - startTime < timeout) {
    try {
      // Try to create lock file exclusively
      const fd = openSync(lockPath, 'wx');
      closeSync(fd);

      // Return unlock function
      return () => {
        try {
          unlinkSync(lockPath);
        } catch {
          // Lock file may already be removed
        }
      };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        // Lock exists, check if it's stale (older than 30 seconds)
        try {
          const stats = statSync(lockPath);
          if (Date.now() - stats.mtimeMs > 30000) {
            // Stale lock, remove it
            unlinkSync(lockPath);
            continue;
          }
        } catch {
          // File might have been removed, retry
        }
        // Wait and retry
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to acquire port registry lock (timeout)');
}

/**
 * Load the port registry from disk
 */
function loadRegistry(): PortRegistry {
  const path = getRegistryPath();
  if (!existsSync(path)) {
    return { version: REGISTRY_VERSION, entries: {} };
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);

    // Handle legacy format (no version field)
    if (!data.version) {
      // Migrate from old format
      return {
        version: REGISTRY_VERSION,
        entries: data as { [key: string]: PortEntry },
      };
    }

    return data as PortRegistry;
  } catch {
    // If registry is corrupted, start fresh
    return { version: REGISTRY_VERSION, entries: {} };
  }
}

/**
 * Save the port registry to disk
 */
function saveRegistry(registry: PortRegistry): void {
  ensureRegistryDir();
  const path = getRegistryPath();
  writeFileSync(path, JSON.stringify(registry, null, 2), { mode: 0o600 });
}

/**
 * Check if a process is still running
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find the next available port block
 */
function findNextAvailableBlock(registry: PortRegistry): number {
  const usedBlocks = new Set<number>();

  for (const entry of Object.values(registry.entries)) {
    usedBlocks.add(entry.basePort);
  }

  for (let i = 0; i < MAX_ALLOCATIONS; i++) {
    const port = BASE_PORT + (i * PORT_BLOCK_SIZE);
    if (!usedBlocks.has(port)) {
      return port;
    }
  }

  throw new Error('No available port blocks. Maximum allocations reached.');
}

/**
 * Check if a project path still exists on disk
 */
function projectExists(projectPath: string): boolean {
  return existsSync(projectPath);
}

/**
 * Clean up stale registry entries (projects that no longer exist or have dead PIDs)
 */
export async function cleanupStaleEntries(): Promise<{ removed: string[]; remaining: number }> {
  const unlock = await acquireLock();

  try {
    const registry = loadRegistry();
    const removed: string[] = [];

    for (const projectPath of Object.keys(registry.entries)) {
      const entry = registry.entries[projectPath];

      // Remove if project doesn't exist
      if (!projectExists(projectPath)) {
        removed.push(projectPath);
        delete registry.entries[projectPath];
        continue;
      }

      // Remove if PID is stale (process no longer running)
      if (entry.pid && !isProcessAlive(entry.pid)) {
        // Don't remove the entry, just clear the PID
        // The project still exists and may be restarted
        entry.pid = undefined;
      }
    }

    if (removed.length > 0) {
      saveRegistry(registry);
    }

    return {
      removed,
      remaining: Object.keys(registry.entries).length,
    };
  } finally {
    unlock();
  }
}

/**
 * Get or allocate a port block for a project
 * Returns the base port for the project's block
 */
export async function getPortBlock(projectRoot: string): Promise<number> {
  // Normalize path for consistent keys
  const normalizedPath = resolve(projectRoot);

  const unlock = await acquireLock();

  try {
    const registry = loadRegistry();

    // Check if project already has an allocation
    if (registry.entries[normalizedPath]) {
      // Update last used timestamp and PID
      registry.entries[normalizedPath].lastUsed = new Date().toISOString();
      registry.entries[normalizedPath].pid = process.pid;
      saveRegistry(registry);
      return registry.entries[normalizedPath].basePort;
    }

    // Allocate new block
    const basePort = findNextAvailableBlock(registry);
    registry.entries[normalizedPath] = {
      basePort,
      registered: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      pid: process.pid,
    };
    saveRegistry(registry);

    return basePort;
  } finally {
    unlock();
  }
}

/**
 * Get port configuration for a project
 * Returns all port assignments based on the project's base port
 */
export interface ProjectPorts {
  basePort: number;
  dashboardPort: number;
  architectPort: number;
  builderPortRange: [number, number];
  utilPortRange: [number, number];
  annotatePortRange: [number, number];
}

export async function getProjectPorts(projectRoot: string): Promise<ProjectPorts> {
  const basePort = await getPortBlock(projectRoot);

  return {
    basePort,
    dashboardPort: basePort,           // 4200
    architectPort: basePort + 1,        // 4201
    builderPortRange: [basePort + 10, basePort + 29] as [number, number],  // 4210-4229
    utilPortRange: [basePort + 30, basePort + 49] as [number, number],     // 4230-4249
    annotatePortRange: [basePort + 50, basePort + 69] as [number, number], // 4250-4269
  };
}

/**
 * List all registered projects and their port blocks
 */
export function listAllocations(): Array<{ path: string; basePort: number; registered: string; lastUsed?: string; exists: boolean; pid?: number; pidAlive?: boolean }> {
  const registry = loadRegistry();

  return Object.entries(registry.entries).map(([path, entry]) => ({
    path,
    basePort: entry.basePort,
    registered: entry.registered,
    lastUsed: entry.lastUsed,
    exists: projectExists(path),
    pid: entry.pid,
    pidAlive: entry.pid ? isProcessAlive(entry.pid) : undefined,
  }));
}

/**
 * Remove a project's port allocation
 */
export async function removeAllocation(projectRoot: string): Promise<boolean> {
  const normalizedPath = resolve(projectRoot);
  const unlock = await acquireLock();

  try {
    const registry = loadRegistry();

    if (registry.entries[normalizedPath]) {
      delete registry.entries[normalizedPath];
      saveRegistry(registry);
      return true;
    }

    return false;
  } finally {
    unlock();
  }
}
