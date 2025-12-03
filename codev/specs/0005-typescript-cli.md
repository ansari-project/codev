# Specification: Agent Farm CLI

**Spec ID**: 0005
**Title**: Agent Farm - TypeScript CLI with npx Support
**Status**: Draft
**Author**: Claude (with human guidance)
**Date**: 2025-12-02

## Overview

Migrate the architect CLI from bash to TypeScript for better maintainability, type safety, and distribution. Enable installation via a single `npx` command.

## Problem Statement

The current bash implementation:
- Is becoming complex (~650+ lines) and hard to maintain
- Lacks type safety and IDE support
- Has platform-specific quirks (BSD vs GNU sed, etc.)
- Cannot be easily distributed via npm
- Requires manual installation and PATH setup

## Goals

1. Rewrite architect CLI in TypeScript
2. Distribute via npm for `npx codev-architect` usage
3. Maintain all existing functionality
4. Improve error handling and user feedback
5. Enable easier testing and maintenance

## Non-Goals

1. Change the core architecture or workflow
2. Add new features (beyond what's in other specs)
3. Support Windows (initially - focus on macOS/Linux)

## Design

### Package Structure

```
agent-farm/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Entry point, CLI parsing
│   ├── commands/
│   │   ├── start.ts       # agent-farm start
│   │   ├── stop.ts        # agent-farm stop
│   │   ├── spawn.ts       # agent-farm spawn
│   │   ├── status.ts      # agent-farm status
│   │   ├── dashboard.ts   # agent-farm dashboard
│   │   ├── util.ts        # agent-farm util
│   │   ├── annotate.ts    # agent-farm annotate
│   │   └── cleanup.ts     # agent-farm cleanup
│   ├── services/
│   │   ├── terminal.ts    # ttyd management
│   │   ├── worktree.ts    # git worktree operations
│   │   ├── dashboard.ts   # dashboard state management
│   │   ├── annotate-server.ts  # Built-in HTTP server for annotations
│   │   └── process.ts     # process management (PIDs, ports)
│   └── utils/
│       ├── config.ts      # paths, ports, configuration
│       ├── logger.ts      # colored output
│       └── shell.ts       # shell command execution
├── templates/             # Shipped with npm package
│   ├── dashboard.html
│   ├── annotate.html
│   └── builder-prompt.md
└── dist/                  # Compiled output
```

### CLI Framework

Use **Commander.js** for CLI parsing:

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('architect')
  .description('Codev Architect CLI - Manage builder agents')
  .version('1.0.0');

program
  .command('start')
  .description('Start the architect console')
  .option('--cmd <command>', 'Custom command to run', 'claude')
  .option('--port <port>', 'Port for architect console', '7680')
  .action(startCommand);

program
  .command('spawn')
  .description('Spawn a new builder agent')
  .requiredOption('--project <id>', 'Project/spec ID (e.g., 0003)')
  .action(spawnCommand);

// ... etc
```

### npx Usage

```bash
# Run directly without installation
npx agent-farm start
npx agent-farm spawn --project 0003
npx agent-farm status

# Or install globally
npm install -g agent-farm
agent-farm start
```

### Package.json

```json
{
  "name": "agent-farm",
  "version": "1.0.0",
  "description": "Agent Farm - Multi-agent development orchestration",
  "bin": {
    "agent-farm": "./dist/index.js"
  },
  "files": [
    "dist/",
    "templates/"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "open": "^10.0.0",
    "tree-kill": "^1.2.2"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0",
    "vitest": "^2.0.0"
  }
}
```

### Key TypeScript Interfaces

```typescript
// src/types.ts

export interface Builder {
  id: string;
  name: string;
  port: number;
  pid: number;
  status: 'spawning' | 'implementing' | 'blocked' | 'pr-ready' | 'complete';
  phase: string;
  worktree: string;
  branch: string;
}

export interface UtilTerminal {
  id: string;
  name: string;
  port: number;
  pid: number;
}

export interface Annotation {
  id: string;
  file: string;
  port: number;
  pid: number;
  parent: {
    type: 'architect' | 'builder' | 'util';
    id?: string;
  };
}

export interface DashboardState {
  architectPort: number;
  architectPid: number | null;
  builders: Builder[];
  utils: UtilTerminal[];
  annotations: Annotation[];
}

export interface Config {
  projectRoot: string;
  codevDir: string;
  buildersDir: string;
  architectPort: number;
  builderPortRange: [number, number];
  utilPortRange: [number, number];
  annotatePortRange: [number, number];
}
```

### Service Examples

**Terminal Service** (ttyd management):

```typescript
// src/services/terminal.ts

import { spawn, ChildProcess } from 'child_process';
import { findAvailablePort } from '../utils/ports';

export class TerminalService {
  async startArchitect(cmd: string, port?: number): Promise<{ port: number; pid: number }> {
    const actualPort = port || await findAvailablePort(7680);

    const proc = spawn('ttyd', [
      '-p', String(actualPort),
      '-W',
      'bash', '-c', `echo '=== Architect Console ===' && exec ${cmd}`
    ], {
      detached: true,
      stdio: 'ignore',
      cwd: this.config.projectRoot
    });

    proc.unref();

    return { port: actualPort, pid: proc.pid! };
  }

  async startBuilder(id: string, port: number): Promise<number> {
    // Similar to architect but in worktree directory
  }

  async stopProcess(pid: number): Promise<void> {
    const treeKill = await import('tree-kill');
    return new Promise((resolve, reject) => {
      treeKill.default(pid, 'SIGTERM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
```

**Worktree Service** (git operations):

```typescript
// src/services/worktree.ts

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class WorktreeService {
  async create(id: string, branch: string): Promise<string> {
    const worktreePath = path.join(this.config.buildersDir, id);

    await execAsync(`git worktree add -b ${branch} ${worktreePath} main`, {
      cwd: this.config.projectRoot
    });

    return worktreePath;
  }

  async remove(id: string): Promise<void> {
    const worktreePath = path.join(this.config.buildersDir, id);
    await execAsync(`git worktree remove ${worktreePath} --force`, {
      cwd: this.config.projectRoot
    });
  }

  async list(): Promise<string[]> {
    const { stdout } = await execAsync('git worktree list --porcelain', {
      cwd: this.config.projectRoot
    });
    // Parse output
  }
}
```

### Migration Path

1. **Phase 1**: Core infrastructure
   - Set up TypeScript project
   - Implement config, logger, shell utils
   - Implement `start`, `stop`, `status` commands

2. **Phase 2**: Builder management
   - Implement `spawn`, `cleanup` commands
   - Worktree and dashboard services

3. **Phase 3**: Additional features
   - Implement `util`, `annotate` commands
   - Annotation server (keep as JS or convert)

4. **Phase 4**: Distribution
   - Package for npm
   - Test npx installation
   - Documentation

### Compatibility

- Keep bash script as fallback during transition
- Same state files (`.builders.json`, `.utils.json`, etc.)
- Same template files (dashboard.html, annotate.html)
- Same port assignments

## Success Criteria

1. **Feature parity**: All bash commands work identically in TypeScript
2. **npx works**: `npx codev-architect start` launches architect
3. **Type safety**: Full TypeScript types for all interfaces
4. **Tests**: >80% test coverage for core functionality
5. **Cross-platform**: Works on macOS and Linux

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Package name? | **`agent-farm`** - generic, memorable, captures multi-agent concept |
| Annotation server? | **Integrated** - built into main CLI binary, not separate |
| Templates? | **Ship with package** - include in npm `files`, access from `node_modules` |

## Dependencies

- ttyd (external, user must install)
- Node.js 18+ (for npx)
- git (for worktrees)

## References

- Current bash script: `codev/bin/architect`
- Commander.js: https://github.com/tj/commander.js
- Chalk: https://github.com/chalk/chalk
- Similar CLIs: create-react-app, vite, turbo
