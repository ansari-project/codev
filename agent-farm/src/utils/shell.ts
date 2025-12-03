/**
 * Shell command utilities for Agent Farm
 */

import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Execute a shell command and return output
 */
export async function run(
  command: string,
  options: { cwd?: string; silent?: boolean } = {}
): Promise<ExecResult> {
  try {
    const result = await execAsync(command, {
      cwd: options.cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    const execError = error as Error & { stdout?: string; stderr?: string };
    throw new Error(
      `Command failed: ${command}\n${execError.stderr || execError.message}`
    );
  }
}

/**
 * Spawn a detached process that continues after parent exits
 */
export function spawnDetached(
  command: string,
  args: string[],
  options: { cwd?: string; logFile?: string } = {}
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    detached: true,
    stdio: options.logFile ? ['ignore', 'pipe', 'pipe'] : 'ignore',
  });

  child.unref();
  return child;
}

/**
 * Check if a command exists
 * Uses spawn to avoid shell injection
 */
export async function commandExists(command: string): Promise<boolean> {
  // Sanitize: only allow alphanumeric, dash, underscore
  const sanitized = command.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitized !== command) {
    return false; // Command name contains invalid characters
  }

  return new Promise((resolve) => {
    const child = spawn('which', [command], { stdio: 'ignore' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/**
 * Find an available port starting from the given port
 * Uses native Node socket binding instead of lsof for cross-platform support
 */
export async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('node:net');

  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '127.0.0.1');
    });
  };

  let port = startPort;
  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Check if a process is running
 */
export async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Kill a process tree
 */
export async function killProcess(pid: number): Promise<void> {
  const treeKill = (await import('tree-kill')).default;

  return new Promise((resolve, reject) => {
    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        // Try SIGKILL if SIGTERM fails
        treeKill(pid, 'SIGKILL', (err2) => {
          if (err2) reject(err2);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * Open a URL in the default browser
 */
export async function openBrowser(url: string): Promise<void> {
  const open = (await import('open')).default;
  await open(url);
}
