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
import net from 'node:net';
import { spawn, execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { DashboardState, Annotation, UtilTerminal, Builder } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - new port scheme (42xx range)
const CONFIG = {
  dashboardPort: 4200,
  architectPort: 4201,
  builderPortStart: 4210,
  utilPortStart: 4230,
  annotatePortStart: 4250,
  maxTabs: 20, // DoS protection: max concurrent tabs
};

// Parse arguments (override default port if provided)
const port = parseInt(process.argv[2] || String(CONFIG.dashboardPort), 10);

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

// Find template (in codev/templates/)
const projectRoot = findProjectRoot();
const templatePath = path.join(projectRoot, 'codev/templates/dashboard-split.html');
const legacyTemplatePath = path.join(projectRoot, 'codev/templates/dashboard.html');
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

// Generate unique ID using crypto for collision resistance
function generateId(prefix: string): string {
  const uuid = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}${uuid}`;
}

// Find available port in range
async function findAvailablePort(startPort: number): Promise<number> {
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

// Kill tmux session
function killTmuxSession(sessionName: string): void {
  try {
    execSync(`tmux kill-session -t "${sessionName}" 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // Session may not exist
  }
}

// Graceful process termination with two-phase shutdown
async function killProcessGracefully(pid: number, tmuxSession?: string): Promise<void> {
  // First kill tmux session if provided
  if (tmuxSession) {
    killTmuxSession(tmuxSession);
  }

  try {
    // First try SIGTERM
    process.kill(pid, 'SIGTERM');

    // Wait up to 500ms for process to exit
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        try {
          // Signal 0 checks if process exists
          process.kill(pid, 0);
          if (attempts >= 5) {
            // Process still alive after 500ms, use SIGKILL
            clearInterval(checkInterval);
            try {
              process.kill(pid, 'SIGKILL');
            } catch {
              // Already dead
            }
            resolve();
          }
        } catch {
          // Process is dead
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  } catch {
    // Process may already be dead
  }
}

// Spawn detached process with error handling
function spawnDetached(command: string, args: string[], cwd: string): number | null {
  try {
    const child = spawn(command, args, {
      cwd,
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      console.error(`Failed to spawn ${command}:`, err.message);
    });

    child.unref();
    return child.pid || null;
  } catch (err) {
    console.error(`Failed to spawn ${command}:`, (err as Error).message);
    return null;
  }
}

// Check if tmux session exists
function tmuxSessionExists(sessionName: string): boolean {
  try {
    execSync(`tmux has-session -t "${sessionName}" 2>/dev/null`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Create a persistent tmux session and attach ttyd to it
// Idempotent: if session exists, just spawn ttyd to attach to it
function spawnTmuxWithTtyd(
  sessionName: string,
  shellCommand: string,
  ttydPort: number,
  cwd: string
): number | null {
  try {
    // Only create session if it doesn't exist (idempotent)
    if (!tmuxSessionExists(sessionName)) {
      // Create tmux session with the shell command
      execSync(
        `tmux new-session -d -s "${sessionName}" -x 200 -y 50 "${shellCommand}"`,
        { cwd, stdio: 'ignore' }
      );

      // Enable mouse support in the session
      execSync(`tmux set-option -t "${sessionName}" -g mouse on`, { stdio: 'ignore' });
    }

    // Start ttyd to attach to the tmux session
    // Using simple theme arg to avoid shell escaping issues
    // Use custom index.html for file path click-to-open functionality
    const customIndexPath = path.join(projectRoot, 'codev/templates/ttyd-index.html');
    const ttydArgs = [
      '-W',
      '-p', String(ttydPort),
      '-t', 'theme={"background":"#000000"}',
      '-t', 'fontSize=14',
    ];

    // Add custom index if it exists
    if (fs.existsSync(customIndexPath)) {
      ttydArgs.push('-I', customIndexPath);
    }

    ttydArgs.push('tmux', 'attach-session', '-t', sessionName);

    const pid = spawnDetached('ttyd', ttydArgs, cwd);
    return pid;
  } catch (err) {
    console.error(`Failed to create tmux session ${sessionName}:`, (err as Error).message);
    // Cleanup any partial session
    killTmuxSession(sessionName);
    return null;
  }
}

// Parse JSON body from request with size limit
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

// Validate path is within project root (prevent path traversal)
// Handles URL-encoded dots (%2e) and other encodings
function validatePathWithinProject(filePath: string): string | null {
  // First decode any URL encoding to catch %2e%2e (encoded ..)
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(filePath);
  } catch {
    // Invalid encoding
    return null;
  }

  // Resolve to absolute path
  const resolvedPath = decodedPath.startsWith('/')
    ? path.resolve(decodedPath)
    : path.resolve(projectRoot, decodedPath);

  // Normalize to remove any .. or . segments
  const normalizedPath = path.normalize(resolvedPath);

  // Check if path starts with project root
  if (!normalizedPath.startsWith(projectRoot + path.sep) && normalizedPath !== projectRoot) {
    return null; // Path escapes project root
  }

  return normalizedPath;
}

// Count total tabs for DoS protection
function countTotalTabs(state: DashboardState): number {
  return state.builders.length + state.utils.length + state.annotations.length;
}

// Find annotation server script (prefer .ts for dev, .js for compiled)
function getAnnotateServerPath(): { script: string; useTsx: boolean } {
  const tsPath = path.join(__dirname, 'annotate-server.ts');
  const jsPath = path.join(__dirname, 'annotate-server.js');

  if (fs.existsSync(tsPath)) {
    return { script: tsPath, useTsx: true };
  }
  return { script: jsPath, useTsx: false };
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

// Security: Validate request origin
function isRequestAllowed(req: http.IncomingMessage): boolean {
  const host = req.headers.host;
  const origin = req.headers.origin;

  // Host check (prevent DNS rebinding attacks)
  if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return false;
  }

  // Origin check (prevent CSRF from external sites)
  // Note: CLI tools/curl might not send Origin, so we only block if Origin is present and invalid
  if (origin && !origin.startsWith('http://localhost') && !origin.startsWith('http://127.0.0.1')) {
    return false;
  }

  return true;
}

// Create server
const server = http.createServer(async (req, res) => {
  // Security: Validate Host and Origin headers
  if (!isRequestAllowed(req)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // CORS headers - restrict to localhost only for security
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Prevent caching of API responses
  res.setHeader('Cache-Control', 'no-store');

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

      // Validate path is within project root (prevent path traversal)
      const fullPath = validatePathWithinProject(filePath);
      if (!fullPath) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Path must be within project directory');
        return;
      }

      // Check file exists
      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`File not found: ${filePath}`);
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

      // DoS protection: check tab limit
      if (countTotalTabs(state) >= CONFIG.maxTabs) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end(`Tab limit reached (max ${CONFIG.maxTabs}). Close some tabs first.`);
        return;
      }

      // Find available port
      const annotatePort = await findAvailablePort(CONFIG.annotatePortStart);

      // Start annotation server
      const { script: serverScript, useTsx } = getAnnotateServerPath();
      if (!fs.existsSync(serverScript)) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Annotation server not found');
        return;
      }

      // Use tsx for TypeScript files, node for compiled JavaScript
      const cmd = useTsx ? 'npx' : 'node';
      const args = useTsx
        ? ['tsx', serverScript, String(annotatePort), fullPath]
        : [serverScript, String(annotatePort), fullPath];
      const pid = spawnDetached(cmd, args, projectRoot);

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

      // Validate projectId is alphanumeric (prevent command injection)
      if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid projectId format');
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

      // DoS protection: check tab limit
      if (countTotalTabs(state) >= CONFIG.maxTabs) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end(`Tab limit reached (max ${CONFIG.maxTabs}). Close some tabs first.`);
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

      // Validate name if provided (prevent command injection)
      if (name && !/^[a-zA-Z0-9_-]+$/.test(name)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid name format');
        return;
      }

      const state = loadState();

      // DoS protection: check tab limit
      if (countTotalTabs(state) >= CONFIG.maxTabs) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end(`Tab limit reached (max ${CONFIG.maxTabs}). Close some tabs first.`);
        return;
      }

      // Generate ID and name
      const id = generateId('U');
      const utilName = name || `shell-${state.utils.length + 1}`;
      const sessionName = `af-shell-${id}`;

      // Find available port
      const utilPort = await findAvailablePort(CONFIG.utilPortStart);

      // Get shell command
      const shell = process.env.SHELL || '/bin/bash';

      // Start tmux session with ttyd attached
      const pid = spawnTmuxWithTtyd(sessionName, shell, utilPort, projectRoot);

      if (!pid) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to start shell');
        return;
      }

      // Wait for ttyd to be ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create util record
      const util: UtilTerminal = {
        id,
        name: utilName,
        port: utilPort,
        pid,
        tmuxSession: sessionName,
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
          await killProcessGracefully(annotation.pid);
          state.annotations = state.annotations.filter((a) => a.id !== annotationId);
          found = true;
        }
      }

      // Check if it's a builder tab
      if (tabId.startsWith('builder-')) {
        const builderId = tabId.replace('builder-', '');
        const builder = state.builders.find((b) => b.id === builderId);
        if (builder) {
          await killProcessGracefully(builder.pid);
          state.builders = state.builders.filter((b) => b.id !== builderId);
          found = true;
        }
      }

      // Check if it's a shell tab
      if (tabId.startsWith('shell-')) {
        const utilId = tabId.replace('shell-', '');
        const util = state.utils.find((u) => u.id === utilId);
        if (util) {
          await killProcessGracefully(util.pid, util.tmuxSession);
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

      // Kill all tmux sessions first
      for (const util of state.utils) {
        if (util.tmuxSession) {
          killTmuxSession(util.tmuxSession);
        }
      }

      if (state.architect?.tmuxSession) {
        killTmuxSession(state.architect.tmuxSession);
      }

      // Kill all processes gracefully
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

      // Kill all processes in parallel
      await Promise.all(pids.map((pid) => killProcessGracefully(pid)));

      // Clear state
      saveState({ architect: null, builders: [], utils: [], annotations: [] });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, killed: pids.length }));

      // Exit after a short delay
      setTimeout(() => process.exit(0), 500);
      return;
    }

    // Open file route - handles file clicks from terminal
    // Returns a small HTML page that messages the dashboard via BroadcastChannel
    if (req.method === 'GET' && url.pathname === '/open-file') {
      const filePath = url.searchParams.get('path');
      const line = url.searchParams.get('line');

      if (!filePath) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing path parameter');
        return;
      }

      // Validate path is within project
      const fullPath = validatePathWithinProject(filePath);
      if (!fullPath) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Path must be within project directory');
        return;
      }

      // Check file exists
      if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`File not found: ${filePath}`);
        return;
      }

      // Serve a small HTML page that communicates back to dashboard
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Opening file...</title>
  <style>
    body {
      font-family: system-ui;
      background: #1a1a1a;
      color: #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .message { text-align: center; }
    .path { color: #3b82f6; font-family: monospace; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="message">
    <p>Opening file...</p>
    <p class="path">${filePath}${line ? ':' + line : ''}</p>
  </div>
  <script>
    (async function() {
      const path = ${JSON.stringify(fullPath)};
      const line = ${line ? parseInt(line, 10) : 'null'};

      // Use BroadcastChannel to message the dashboard
      const channel = new BroadcastChannel('agent-farm');
      channel.postMessage({
        type: 'openFile',
        path: path,
        line: line
      });

      // Also call the API to ensure file tab is created
      try {
        await fetch('/api/tabs/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: path })
        });
      } catch (e) {
        console.error('Failed to open file via API:', e);
      }

      // Close this window/tab after a short delay
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work (wasn't opened by script),
        // show success message
        document.body.innerHTML = '<div class="message"><p>File opened in dashboard</p><p class="path">You can close this tab</p></div>';
      }, 500);
    })();
  </script>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
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
