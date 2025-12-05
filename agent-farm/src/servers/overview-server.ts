#!/usr/bin/env node

/**
 * Overview server for Agent Farm.
 * Provides a centralized view of all agent-farm instances across projects.
 *
 * Usage: node overview-server.js <port>
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default port for overview dashboard
const DEFAULT_PORT = 4100;

// Parse arguments
const port = parseInt(process.argv[2] || String(DEFAULT_PORT), 10);

// Port registry location
const REGISTRY_PATH = path.join(homedir(), '.agent-farm', 'ports.json');

// Interface for port registry entries
interface PortEntry {
  basePort: number;
  registered: string;
  lastUsed?: string;
  pid?: number;
}

interface PortRegistry {
  version: number;
  entries: {
    [projectPath: string]: PortEntry;
  };
}

// Interface for instance status returned to UI
interface InstanceStatus {
  projectPath: string;
  projectName: string;
  basePort: number;
  dashboardPort: number;
  architectPort: number;
  registered: string;
  lastUsed?: string;
  running: boolean;
  ports: {
    type: string;
    port: number;
    url: string;
    active: boolean;
  }[];
}

/**
 * Load port registry from disk
 */
function loadRegistry(): PortRegistry {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
      const data = JSON.parse(content);

      // Handle legacy format (no version field)
      if (!data.version) {
        return {
          version: 1,
          entries: data as { [key: string]: PortEntry },
        };
      }

      return data as PortRegistry;
    }
  } catch (err) {
    console.error('Error loading registry:', (err as Error).message);
  }
  return { version: 1, entries: {} };
}

/**
 * Check if a port is listening
 */
async function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Get project name from path
 */
function getProjectName(projectPath: string): string {
  return path.basename(projectPath);
}

/**
 * Get all instances with their status
 */
async function getInstances(): Promise<InstanceStatus[]> {
  const registry = loadRegistry();
  const instances: InstanceStatus[] = [];

  for (const [projectPath, entry] of Object.entries(registry.entries)) {
    const basePort = entry.basePort;
    const dashboardPort = basePort;
    const architectPort = basePort + 1;

    // Check if dashboard is running (main indicator of running instance)
    const dashboardActive = await isPortListening(dashboardPort);

    // Only check architect port if dashboard is active (to avoid unnecessary probing)
    const architectActive = dashboardActive ? await isPortListening(architectPort) : false;

    const ports = [
      {
        type: 'Dashboard',
        port: dashboardPort,
        url: `http://localhost:${dashboardPort}`,
        active: dashboardActive,
      },
      {
        type: 'Architect',
        port: architectPort,
        url: `http://localhost:${architectPort}`,
        active: architectActive,
      },
    ];

    instances.push({
      projectPath,
      projectName: getProjectName(projectPath),
      basePort,
      dashboardPort,
      architectPort,
      registered: entry.registered,
      lastUsed: entry.lastUsed,
      running: dashboardActive,
      ports,
    });
  }

  // Sort by running status first (running at top), then by last used
  instances.sort((a, b) => {
    if (a.running !== b.running) {
      return a.running ? -1 : 1;
    }
    // Sort by lastUsed if both have same running status
    const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return bTime - aTime;
  });

  return instances;
}

/**
 * Launch a new agent-farm instance
 */
async function launchInstance(projectPath: string): Promise<{ success: boolean; error?: string }> {
  // Validate path exists
  if (!fs.existsSync(projectPath)) {
    return { success: false, error: `Path does not exist: ${projectPath}` };
  }

  // Check if it's a codev project
  const codevDir = path.join(projectPath, 'codev');
  if (!fs.existsSync(codevDir)) {
    return { success: false, error: 'Not a codev project (missing codev/ directory)' };
  }

  // Check for agent-farm script
  const agentFarmScript = path.join(projectPath, 'codev', 'bin', 'agent-farm');
  if (!fs.existsSync(agentFarmScript)) {
    return { success: false, error: 'agent-farm CLI not found in project' };
  }

  // Spawn detached process
  try {
    const child = spawn('bash', ['-c', `cd "${projectPath}" && ./codev/bin/agent-farm start`], {
      detached: true,
      stdio: 'ignore',
      cwd: projectPath,
    });
    child.unref();

    return { success: true };
  } catch (err) {
    return { success: false, error: `Failed to launch: ${(err as Error).message}` };
  }
}

/**
 * Find the overview template
 */
function findTemplatePath(): string | null {
  // Try relative to this file first (when running from agent-farm/src/servers)
  const relativePath = path.resolve(__dirname, '../../../codev/templates/overview.html');
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }

  // Try current working directory (for installed projects)
  const cwdPath = path.join(process.cwd(), 'codev/templates/overview.html');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }

  return null;
}

/**
 * HTML-escape a string to prevent XSS
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse JSON body from request
 */
function parseJsonBody(req: http.IncomingMessage, maxSize = 1024 * 1024): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Security: Validate request origin
 */
function isRequestAllowed(req: http.IncomingMessage): boolean {
  const host = req.headers.host;
  const origin = req.headers.origin;

  // Host check (prevent DNS rebinding attacks)
  if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return false;
  }

  // Origin check for CORS requests
  if (origin && !origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1')) {
    return false;
  }

  return true;
}

// Find template path
const templatePath = findTemplatePath();

// Create server
const server = http.createServer(async (req, res) => {
  // Security: Validate Host and Origin headers
  if (!isRequestAllowed(req)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // CORS headers
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${port}`);

  try {
    // API: Get status of all instances
    if (req.method === 'GET' && url.pathname === '/api/status') {
      const instances = await getInstances();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ instances }));
      return;
    }

    // API: Launch new instance
    if (req.method === 'POST' && url.pathname === '/api/launch') {
      const body = await parseJsonBody(req);
      const projectPath = body.projectPath as string;

      if (!projectPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing projectPath' }));
        return;
      }

      const result = await launchInstance(projectPath);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Serve dashboard
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      if (!templatePath) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Template not found. Make sure overview.html exists in codev/templates/');
        return;
      }

      try {
        const template = fs.readFileSync(templatePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(template);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading template: ' + (err as Error).message);
      }
      return;
    }

    // 404 for everything else
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error('Request error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error: ' + (err as Error).message);
  }
});

server.listen(port, () => {
  console.log(`Overview dashboard: http://localhost:${port}`);
});
