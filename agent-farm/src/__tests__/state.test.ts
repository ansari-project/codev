/**
 * Tests for state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// We need to mock getConfig before importing state
vi.mock('../utils/config.js', async () => {
  const testDir = resolve(process.cwd(), '.test-state');
  return {
    getConfig: () => ({
      projectRoot: process.cwd(),
      codevDir: resolve(process.cwd(), 'codev'),
      buildersDir: resolve(testDir, 'builders'),
      stateDir: testDir,
      templatesDir: resolve(process.cwd(), 'templates'),
      serversDir: resolve(process.cwd(), 'dist/servers'),
      architectPort: 7680,
      builderPortRange: [7681, 7699] as [number, number],
      utilPortRange: [7700, 7719] as [number, number],
      annotatePortRange: [8080, 8099] as [number, number],
    }),
    ensureDirectories: async () => {
      await mkdir(testDir, { recursive: true });
    },
  };
});

// Import after mocking
const { loadState, saveState, setArchitect, clearState } = await import('../state.js');

describe('State Management', () => {
  const testDir = resolve(process.cwd(), '.test-state');
  const stateFile = resolve(testDir, 'state.json');

  beforeEach(async () => {
    // Clean up before each test
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after each test
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  describe('loadState', () => {
    it('should return default state when no file exists', async () => {
      const state = await loadState();

      expect(state).toEqual({
        architect: null,
        builders: [],
        utils: [],
        annotations: [],
      });
    });

    it('should load state from file', async () => {
      const testState = {
        architect: { port: 7680, pid: 1234, cmd: 'claude', startedAt: '2024-01-01' },
        builders: [],
        utils: [],
        annotations: [],
      };

      await writeFile(stateFile, JSON.stringify(testState));

      const state = await loadState();
      expect(state.architect).toEqual(testState.architect);
    });
  });

  describe('saveState', () => {
    it('should save state to file', async () => {
      const testState = {
        architect: { port: 7680, pid: 1234, cmd: 'claude', startedAt: '2024-01-01' },
        builders: [],
        utils: [],
        annotations: [],
      };

      await saveState(testState);

      const content = await readFile(stateFile, 'utf-8');
      const savedState = JSON.parse(content);
      expect(savedState.architect).toEqual(testState.architect);
    });
  });

  describe('setArchitect', () => {
    it('should set architect state', async () => {
      const architect = {
        port: 7680,
        pid: 5678,
        cmd: 'claude --dangerously-skip-permissions',
        startedAt: new Date().toISOString(),
      };

      await setArchitect(architect);

      const state = await loadState();
      expect(state.architect).toEqual(architect);
    });

    it('should clear architect when set to null', async () => {
      // Set architect first
      await setArchitect({
        port: 7680,
        pid: 5678,
        cmd: 'claude',
        startedAt: new Date().toISOString(),
      });

      // Then clear it
      await setArchitect(null);

      const state = await loadState();
      expect(state.architect).toBeNull();
    });
  });

  describe('clearState', () => {
    it('should reset state to defaults', async () => {
      // Set some state
      await saveState({
        architect: { port: 7680, pid: 1234, cmd: 'claude', startedAt: '2024-01-01' },
        builders: [{ id: 'B001', name: 'test', port: 7681, pid: 2345, status: 'implementing', phase: 'init', worktree: '/tmp', branch: 'test' }],
        utils: [],
        annotations: [],
      });

      // Clear it
      await clearState();

      const state = await loadState();
      expect(state).toEqual({
        architect: null,
        builders: [],
        utils: [],
        annotations: [],
      });
    });
  });
});
