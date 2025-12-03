#!/usr/bin/env node

/**
 * Dashboard server for Agent Farm.
 * Serves the split-pane dashboard UI and provides state/tab management APIs.
 *
 * Usage: node dashboard-server.js <port>
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DashboardState, Annotation, UtilTerminal, Builder } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const port = parseInt(process.argv[2] || '7681', 10);

// Find template (in dist/servers, template in templates/)
const templatePath = path.join(__dirname, '../../templates/dashboard-split.html');
const legacyTemplatePath = path.join(__dirname, '../../templates/dashboard.html');

// Find project root by looking for .agent-farm directory
function findProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.agent-farm'))) {
      return dir;
    }
    if (fs.existsSync(path.join(dir, 'codev'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

const projectRoot = findProjectRoot();
const stateFile = path.join(projectRoot, '.agent-farm', 'state.json');

// Load state
function loadState(): DashboardState {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading state:', (err as Error).message);
  }
  return { architect: null, builders: [], utils: [], annotations: [] };
}

// Save state
function saveState(state: DashboardState): void {
  try {
    const dir = path.dirname(stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error saving state:', (err as Error).message);
  }
}

// Generate unique ID
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 4);
  return `${prefix}${timestamp.slice(-3)}${random}`.toUpperCase();
}

// Find available port in range
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('node:net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Spawn detached process
function spawnDetached(command: string, args: string[], cwd: string): number | null {
  const { spawn } = require('node:child_process');

  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  return child.pid || null;
}

// Parse JSON body from request
function parseJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Find annotation server script
function getAnnotateServerPath(): string {
  return path.join(__dirname, 'annotate-server.js');
}

// Validate template exists (prefer split, fallback to legacy)
let finalTemplatePath = templatePath;
if (!fs.existsSync(templatePath)) {
  if (fs.existsSync(legacyTemplatePath)) {
    console.log('Using legacy dashboard template');
    finalTemplatePath = legacyTemplatePath;
  } else {
    console.error(`Template not found: ${templatePath}`);
    process.exit(1);
  }
}

// Create server
const server = http.createServer(async (req, res) => {
  // CORS headers - restrict to localhost only for security
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${port}`);

  try {
    // API: Get state
    if (req.method === 'GET' && url.pathname === '/api/state') {
      const state = loadState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }

    // API: Create file tab (annotation)
    if (req.method === 'POST' && url.pathname === '/api/tabs/file') {
      const body = await parseJsonBody(req);
      const filePath = body.path as string;

      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing path');
        return;
      }

      // Resolve path
      const fullPath = filePath.startsWith('/') ? filePath : path.join(projectRoot, filePath);

      // Check file exists
      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`File not found: ${fullPath}`);
        return;
      }

      // Check if already open
      const state = loadState();
      const existing = state.annotations.find((a) => a.file === fullPath);
      if (existing) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: existing.id, port: existing.port, existing: true }));
        return;
      }

      // Find available port
      const annotatePort = await findAvailablePort(8080);

      // Start annotation server
      const serverScript = getAnnotateServerPath();
      if (!fs.existsSync(serverScript)) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Annotation server not found');
        return;
      }

      const pid = spawnDetached('node', [serverScript, String(annotatePort), fullPath], projectRoot);

      if (!pid) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to start annotation server');
        return;
      }

      // Create annotation record
      const annotation: Annotation = {
        id: generateId('A'),
        file: fullPath,
        port: annotatePort,
        pid,
        parent: { type: 'architect' },
      };

      state.annotations.push(annotation);
      saveState(state);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: annotation.id, port: annotatePort }));
      return;
    }

    // API: Create builder tab
    if (req.method === 'POST' && url.pathname === '/api/tabs/builder') {
      const body = await parseJsonBody(req);
      const projectId = body.projectId as string;

      if (!projectId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing projectId');
        return;
      }

      // Check if builder already exists
      const state = loadState();
      const existing = state.builders.find((b) => b.id === projectId);
      if (existing) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: existing.id, port: existing.port, existing: true }));
        return;
      }

      // Note: Spawning a builder is complex (requires worktree setup)
      // For now, return an error directing to CLI
      res.writeHead(501, { 'Content-Type': 'text/plain' });
      res.end('Builder spawning from dashboard not yet implemented. Use: agent-farm spawn --project ' + projectId);
      return;
    }

    // API: Create shell tab
    if (req.method === 'POST' && url.pathname === '/api/tabs/shell') {
      const body = await parseJsonBody(req);
      const name = (body.name as string) || undefined;

      const state = loadState();

      // Generate ID and name
      const id = generateId('U');
      const utilName = name || `shell-${state.utils.length + 1}`;

      // Find available port
      const utilPort = await findAvailablePort(7700);

      // Get shell command
      const shell = process.env.SHELL || '/bin/bash';

      // Start ttyd
      const pid = spawnDetached(
        'ttyd',
        ['-p', String(utilPort), '-t', `titleFixed=${utilName}`, '-t', 'fontSize=14', shell],
        projectRoot
      );

      if (!pid) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to start shell');
        return;
      }

      // Create util record
      const util: UtilTerminal = {
        id,
        name: utilName,
        port: utilPort,
        pid,
      };

      state.utils.push(util);
      saveState(state);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id, port: utilPort, name: utilName }));
      return;
    }

    // API: Close tab
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/tabs/')) {
      const tabId = decodeURIComponent(url.pathname.replace('/api/tabs/', ''));
      const state = loadState();
      let found = false;

      // Check if it's a file tab
      if (tabId.startsWith('file-')) {
        const annotationId = tabId.replace('file-', '');
        const annotation = state.annotations.find((a) => a.id === annotationId);
        if (annotation) {
          // Kill the process
          try {
            process.kill(annotation.pid);
          } catch {
            // Process may already be dead
          }
          state.annotations = state.annotations.filter((a) => a.id !== annotationId);
          found = true;
        }
      }

      // Check if it's a builder tab
      if (tabId.startsWith('builder-')) {
        const builderId = tabId.replace('builder-', '');
        const builder = state.builders.find((b) => b.id === builderId);
        if (builder) {
          // Kill the process
          try {
            process.kill(builder.pid);
          } catch {
            // Process may already be dead
          }
          state.builders = state.builders.filter((b) => b.id !== builderId);
          found = true;
        }
      }

      // Check if it's a shell tab
      if (tabId.startsWith('shell-')) {
        const utilId = tabId.replace('shell-', '');
        const util = state.utils.find((u) => u.id === utilId);
        if (util) {
          // Kill the process
          try {
            process.kill(util.pid);
          } catch {
            // Process may already be dead
          }
          state.utils = state.utils.filter((u) => u.id !== utilId);
          found = true;
        }
      }

      if (found) {
        saveState(state);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Tab not found');
      }
      return;
    }

    // API: Stop all
    if (req.method === 'POST' && url.pathname === '/api/stop') {
      const state = loadState();

      // Kill all processes
      const pids: number[] = [];

      if (state.architect) {
        pids.push(state.architect.pid);
      }

      for (const builder of state.builders) {
        pids.push(builder.pid);
      }

      for (const util of state.utils) {
        pids.push(util.pid);
      }

      for (const annotation of state.annotations) {
        pids.push(annotation.pid);
      }

      for (const pid of pids) {
        try {
          process.kill(pid);
        } catch {
          // Process may already be dead
        }
      }

      // Clear state
      saveState({ architect: null, builders: [], utils: [], annotations: [] });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, killed: pids.length }));

      // Exit after a short delay
      setTimeout(() => process.exit(0), 500);
      return;
    }

    // Serve dashboard
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      try {
        let template = fs.readFileSync(finalTemplatePath, 'utf-8');
        const state = loadState();

        // Inject state into template
        const stateJson = JSON.stringify(state);
        template = template.replace(
          '// STATE_INJECTION_POINT',
          `window.INITIAL_STATE = ${stateJson};`
        );

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(template);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard: ' + (err as Error).message);
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
  console.log(`Dashboard: http://localhost:${port}`);
});
