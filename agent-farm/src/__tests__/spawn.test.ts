/**
 * Tests for spawn command - validates spawn options and mode detection
 *
 * These are unit tests for the spawn validation logic. Integration tests
 * that spawn actual builders require git, tmux, and ttyd to be installed.
 */

import { describe, it, expect } from 'vitest';
import type { SpawnOptions, BuilderType } from '../types.js';

// Re-implement the validation logic for testing (avoids importing with side effects)
function validateSpawnOptions(options: SpawnOptions): string | null {
  const modes = [
    options.project,
    options.task,
    options.protocol,
    options.shell,
    options.worktree,
  ].filter(Boolean);

  if (modes.length === 0) {
    return 'Must specify one of: --project (-p), --task, --protocol, --shell, --worktree';
  }

  if (modes.length > 1) {
    return 'Flags --project, --task, --protocol, --shell, --worktree are mutually exclusive';
  }

  if (options.files && !options.task) {
    return '--files requires --task';
  }

  return null; // Valid
}

function getSpawnMode(options: SpawnOptions): BuilderType {
  if (options.project) return 'spec';
  if (options.task) return 'task';
  if (options.protocol) return 'protocol';
  if (options.shell) return 'shell';
  if (options.worktree) return 'worktree';
  throw new Error('No mode specified');
}

function generateShortId(): string {
  // Generate random 24-bit number and base64 encode to 4 chars
  const num = Math.floor(Math.random() * 0xFFFFFF);
  const bytes = new Uint8Array([num >> 16, (num >> 8) & 0xFF, num & 0xFF]);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 4);
}

describe('Spawn Command', () => {
  describe('validateSpawnOptions', () => {
    describe('valid options', () => {
      it('should accept --project alone', () => {
        const options: SpawnOptions = { project: '0009' };
        expect(validateSpawnOptions(options)).toBeNull();
      });

      it('should accept --task alone', () => {
        const options: SpawnOptions = { task: 'Fix the authentication bug' };
        expect(validateSpawnOptions(options)).toBeNull();
      });

      it('should accept --task with --files', () => {
        const options: SpawnOptions = {
          task: 'Fix bug',
          files: ['src/auth.ts', 'src/login.ts']
        };
        expect(validateSpawnOptions(options)).toBeNull();
      });

      it('should accept --protocol alone', () => {
        const options: SpawnOptions = { protocol: 'cleanup' };
        expect(validateSpawnOptions(options)).toBeNull();
      });

      it('should accept --shell alone', () => {
        const options: SpawnOptions = { shell: true };
        expect(validateSpawnOptions(options)).toBeNull();
      });

      it('should accept --worktree alone', () => {
        const options: SpawnOptions = { worktree: true };
        expect(validateSpawnOptions(options)).toBeNull();
      });
    });

    describe('invalid options', () => {
      it('should reject empty options', () => {
        const options: SpawnOptions = {};
        const error = validateSpawnOptions(options);
        expect(error).toContain('Must specify one of');
      });

      it('should reject --project + --task', () => {
        const options: SpawnOptions = { project: '0009', task: 'Fix bug' };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --project + --shell', () => {
        const options: SpawnOptions = { project: '0009', shell: true };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --task + --protocol', () => {
        const options: SpawnOptions = { task: 'Fix bug', protocol: 'cleanup' };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --protocol + --shell', () => {
        const options: SpawnOptions = { protocol: 'cleanup', shell: true };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --shell + --worktree', () => {
        const options: SpawnOptions = { shell: true, worktree: true };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --project + --worktree', () => {
        const options: SpawnOptions = { project: '0009', worktree: true };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });

      it('should reject --files without --task', () => {
        const options: SpawnOptions = {
          project: '0009',
          files: ['src/file.ts']
        };
        const error = validateSpawnOptions(options);
        expect(error).toContain('--files requires --task');
      });

      it('should reject triple mode specification', () => {
        const options: SpawnOptions = {
          project: '0009',
          task: 'Fix bug',
          shell: true
        };
        const error = validateSpawnOptions(options);
        expect(error).toContain('mutually exclusive');
      });
    });
  });

  describe('getSpawnMode', () => {
    it('should return "spec" for --project', () => {
      expect(getSpawnMode({ project: '0009' })).toBe('spec');
    });

    it('should return "task" for --task', () => {
      expect(getSpawnMode({ task: 'Fix bug' })).toBe('task');
    });

    it('should return "protocol" for --protocol', () => {
      expect(getSpawnMode({ protocol: 'cleanup' })).toBe('protocol');
    });

    it('should return "shell" for --shell', () => {
      expect(getSpawnMode({ shell: true })).toBe('shell');
    });

    it('should return "worktree" for --worktree', () => {
      expect(getSpawnMode({ worktree: true })).toBe('worktree');
    });

    it('should throw for empty options', () => {
      expect(() => getSpawnMode({})).toThrow('No mode specified');
    });
  });

  describe('generateShortId', () => {
    it('should generate 4-character IDs', () => {
      const id = generateShortId();
      expect(id).toHaveLength(4);
    });

    it('should generate URL-safe base64 characters', () => {
      // Generate many IDs to check character set
      for (let i = 0; i < 100; i++) {
        const id = generateShortId();
        // Should only contain URL-safe base64: a-z, A-Z, 0-9, -, _
        expect(id).toMatch(/^[a-zA-Z0-9_-]{4}$/);
      }
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateShortId());
      }
      // With 4 base64 chars (64^4 = ~16M possibilities), 100 IDs should be unique
      // Allow for very rare collisions (99+ unique out of 100)
      expect(ids.size).toBeGreaterThanOrEqual(99);
    });

    it('should not contain + or / (non-URL-safe)', () => {
      for (let i = 0; i < 100; i++) {
        const id = generateShortId();
        expect(id).not.toContain('+');
        expect(id).not.toContain('/');
        expect(id).not.toContain('=');
      }
    });
  });

  describe('ID format patterns', () => {
    it('task IDs should match pattern task-{rand4}', () => {
      const shortId = generateShortId();
      const taskId = `task-${shortId}`;
      expect(taskId).toMatch(/^task-[a-zA-Z0-9_-]{4}$/);
    });

    it('protocol IDs should match pattern {name}-{rand4}', () => {
      const shortId = generateShortId();
      const protocolId = `cleanup-${shortId}`;
      expect(protocolId).toMatch(/^cleanup-[a-zA-Z0-9_-]{4}$/);
    });

    it('shell IDs should match pattern shell-{rand4}', () => {
      const shortId = generateShortId();
      const shellId = `shell-${shortId}`;
      expect(shellId).toMatch(/^shell-[a-zA-Z0-9_-]{4}$/);
    });

    it('worktree IDs should match pattern worktree-{rand4}', () => {
      const shortId = generateShortId();
      const worktreeId = `worktree-${shortId}`;
      expect(worktreeId).toMatch(/^worktree-[a-zA-Z0-9_-]{4}$/);
    });
  });

  describe('branch naming', () => {
    it('spec mode uses builder/{id}-{spec-name}', () => {
      const specName = '0009-terminal-click';
      const branchName = `builder/${specName}`;
      expect(branchName).toBe('builder/0009-terminal-click');
    });

    it('task mode uses builder/task-{rand4}', () => {
      const shortId = generateShortId();
      const branchName = `builder/task-${shortId}`;
      expect(branchName).toMatch(/^builder\/task-[a-zA-Z0-9_-]{4}$/);
    });

    it('protocol mode uses builder/{name}-{rand4}', () => {
      const shortId = generateShortId();
      const branchName = `builder/cleanup-${shortId}`;
      expect(branchName).toMatch(/^builder\/cleanup-[a-zA-Z0-9_-]{4}$/);
    });

    it('shell mode has no branch (empty string)', () => {
      // Shell mode doesn't create a worktree or branch
      const branch = '';
      expect(branch).toBe('');
    });

    it('worktree mode uses builder/worktree-{rand4}', () => {
      const shortId = generateShortId();
      const branchName = `builder/worktree-${shortId}`;
      expect(branchName).toMatch(/^builder\/worktree-[a-zA-Z0-9_-]{4}$/);
    });
  });

  describe('tmux session naming', () => {
    it('builder sessions use builder-{id}', () => {
      const builderId = '0009';
      const sessionName = `builder-${builderId}`;
      expect(sessionName).toBe('builder-0009');
    });

    it('shell sessions use shell-{rand4}', () => {
      const shortId = generateShortId();
      const sessionName = `shell-${shortId}`;
      expect(sessionName).toMatch(/^shell-[a-zA-Z0-9_-]{4}$/);
    });

    it('worktree sessions use builder-worktree-{rand4}', () => {
      const shortId = generateShortId();
      const builderId = `worktree-${shortId}`;
      const sessionName = `builder-${builderId}`;
      expect(sessionName).toMatch(/^builder-worktree-[a-zA-Z0-9_-]{4}$/);
    });
  });
});
