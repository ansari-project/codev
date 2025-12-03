#!/usr/bin/env node

/**
 * Dashboard server for Agent Farm.
 * Serves the dashboard UI and provides state via API.
 *
 * Usage: node dashboard-server.js <port>
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DashboardState } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const port = parseInt(process.argv[2] || '7681', 10);

// Find template (in dist/servers, template in templates/)
const templatePath = path.join(__dirname, '../../templates/dashboard.html');

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

// Validate template exists
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

// Create server
const server = http.createServer((req, res) => {
  // CORS headers - restrict to localhost only for security
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Get state
  if (req.method === 'GET' && req.url === '/api/state') {
    const state = loadState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  // Serve dashboard
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      let template = fs.readFileSync(templatePath, 'utf-8');
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
});

server.listen(port, () => {
  console.log(`Dashboard: http://localhost:${port}`);
});
