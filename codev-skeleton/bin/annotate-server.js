#!/usr/bin/env node

/**
 * Simple annotation server for the Architect-Builder pattern.
 * Serves the annotation viewer and handles file saves.
 *
 * Usage: node annotate-server.js --builder XXXX --file path/to/file.ts --port 8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf('--' + name);
  return idx !== -1 ? args[idx + 1] : null;
};

const builderId = getArg('builder');
const filePath = getArg('file');
const port = parseInt(getArg('port') || '8080', 10);

if (!builderId || !filePath) {
  console.error('Usage: annotate-server.js --builder XXXX --file path/to/file.ts [--port 8080]');
  process.exit(1);
}

// Paths
const projectRoot = process.cwd();
const buildersDir = path.join(projectRoot, '.builders');
const builderDir = path.join(buildersDir, builderId);
const fullFilePath = path.join(builderDir, filePath);
const templatePath = path.join(projectRoot, 'codev', 'templates', 'annotate.html');

// Validate builder exists
if (!fs.existsSync(builderDir)) {
  console.error(`Builder directory not found: ${builderDir}`);
  process.exit(1);
}

// Validate file exists
if (!fs.existsSync(fullFilePath)) {
  console.error(`File not found: ${fullFilePath}`);
  process.exit(1);
}

// Get language from extension
const ext = path.extname(filePath).slice(1).toLowerCase();
const langMap = {
  js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  py: 'python', sh: 'bash', bash: 'bash',
  md: 'markdown', html: 'markup', css: 'css',
  json: 'json', yaml: 'yaml', yml: 'yaml'
};
const lang = langMap[ext] || ext;

// Create server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve annotation viewer
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    try {
      let template = fs.readFileSync(templatePath, 'utf-8');
      const fileContent = fs.readFileSync(fullFilePath, 'utf-8');

      // Replace placeholders
      template = template.replace(/\{\{BUILDER_ID\}\}/g, builderId);
      template = template.replace(/\{\{FILE_PATH\}\}/g, filePath);
      template = template.replace(/\{\{FILE\}\}/g, path.basename(filePath));
      template = template.replace(/\{\{LANG\}\}/g, lang);

      // Inject file content
      const escapedContent = JSON.stringify(fileContent);
      template = template.replace(
        '// FILE_CONTENT will be injected by the server',
        `init(${escapedContent});`
      );

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(template);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading viewer: ' + err.message);
    }
    return;
  }

  // Handle file save
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { file, content } = JSON.parse(body);

        // Security: only allow saving the opened file
        if (file !== filePath) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Cannot save to different file');
          return;
        }

        fs.writeFileSync(fullFilePath, content, 'utf-8');
        console.log(`Saved: ${fullFilePath}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error saving file: ' + err.message);
      }
    });
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`\nAnnotation Viewer`);
  console.log(`================`);
  console.log(`Builder: ${builderId}`);
  console.log(`File:    ${filePath}`);
  console.log(`\nOpen in browser: http://localhost:${port}`);
  console.log(`\nPress Ctrl+C to stop the server`);
});
