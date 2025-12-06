/**
 * Tests for clipboard functionality in dashboard terminals
 * Ensures iframes have clipboard permissions and ttyd has rightClickSelectsWord
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Find project root by looking for codev directory
function findProjectRoot(): string {
  let dir = process.cwd();
  while (dir !== '/') {
    if (existsSync(resolve(dir, 'codev'))) {
      return dir;
    }
    dir = resolve(dir, '..');
  }
  return process.cwd();
}

const projectRoot = findProjectRoot();

describe('Dashboard clipboard permissions', () => {
  const templates = [
    'agent-farm/templates/dashboard-split.html',
    'agent-farm/templates/dashboard.html',
  ];

  templates.forEach((templatePath) => {
    it(`${templatePath} includes clipboard permissions on iframes`, () => {
      const fullPath = resolve(projectRoot, templatePath);

      if (!existsSync(fullPath)) {
        // Skip if template doesn't exist (might be in a worktree without skeleton)
        return;
      }

      const content = readFileSync(fullPath, 'utf-8');

      // Find all iframe tags
      const iframeRegex = /<iframe[^>]*>/g;
      const iframes = content.match(iframeRegex) || [];

      expect(iframes.length).toBeGreaterThan(0);

      // Each iframe should have clipboard permissions
      iframes.forEach((iframe) => {
        expect(iframe).toMatch(/allow="[^"]*clipboard-read[^"]*"/);
        expect(iframe).toMatch(/allow="[^"]*clipboard-write[^"]*"/);
      });
    });
  });
});

describe('ttyd rightClickSelectsWord option', () => {
  const sourceFiles = [
    'agent-farm/src/commands/start.ts',
    'agent-farm/src/commands/util.ts',
    'agent-farm/src/commands/spawn.ts',
    'agent-farm/src/servers/dashboard-server.ts',
  ];

  sourceFiles.forEach((filePath) => {
    it(`${filePath} includes rightClickSelectsWord in ttyd args`, () => {
      const fullPath = resolve(projectRoot, filePath);

      if (!existsSync(fullPath)) {
        return;
      }

      const content = readFileSync(fullPath, 'utf-8');

      // Check if file spawns ttyd (has ttydArgs)
      if (content.includes('ttydArgs')) {
        expect(content).toMatch(/rightClickSelectsWord['"=]?.*true/);
      }
    });
  });

  it('spawn.ts has rightClickSelectsWord in all ttyd spawn locations', () => {
    const spawnPath = resolve(projectRoot, 'agent-farm/src/commands/spawn.ts');

    if (!existsSync(spawnPath)) {
      return;
    }

    const content = readFileSync(spawnPath, 'utf-8');

    // Count ttydArgs definitions
    const ttydArgsCount = (content.match(/const ttydArgs = \[/g) || []).length;

    // Count rightClickSelectsWord occurrences
    const rightClickCount = (content.match(/rightClickSelectsWord/g) || []).length;

    // Each ttydArgs should have rightClickSelectsWord
    expect(rightClickCount).toBeGreaterThanOrEqual(ttydArgsCount);
  });
});
