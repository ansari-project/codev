# Implementation Plan: Agent Farm CLI

**Spec ID**: 0005
**Plan Version**: 1.0
**Date**: 2025-12-02

## Overview

This plan details the implementation of the Agent Farm TypeScript CLI, migrating from the existing bash implementation to a type-safe, npm-distributable package.

## Implementation Phases

### Phase 1: Project Setup and Core Infrastructure

**Files to create:**
- `agent-farm/package.json` - Package configuration with dependencies
- `agent-farm/tsconfig.json` - TypeScript configuration for ES2022/NodeNext
- `agent-farm/src/types.ts` - Core TypeScript interfaces
- `agent-farm/src/utils/config.ts` - Configuration and path management
- `agent-farm/src/utils/logger.ts` - Colored console output
- `agent-farm/src/utils/shell.ts` - Shell command execution utilities
- `agent-farm/src/utils/index.ts` - Barrel export

**Key decisions:**
- Use ES modules (`"type": "module"`)
- Target Node.js 18+
- Use Commander.js for CLI parsing
- Use Chalk for colored output

### Phase 2: State Management

**Files to create:**
- `agent-farm/src/state.ts` - State persistence (load/save)

**State structure:**
```typescript
interface DashboardState {
  architect: ArchitectState | null;
  builders: Builder[];
  utils: UtilTerminal[];
  annotations: Annotation[];
}
```

**Storage:** JSON file at `.agent-farm/state.json`

### Phase 3: Core Commands

**Files to create:**
- `agent-farm/src/index.ts` - CLI entry point
- `agent-farm/src/commands/start.ts` - Start architect dashboard
- `agent-farm/src/commands/stop.ts` - Stop all processes
- `agent-farm/src/commands/status.ts` - Show status of all agents
- `agent-farm/src/commands/index.ts` - Command exports

**Command implementations:**
1. `start` - Launch ttyd for architect, start dashboard server
2. `stop` - Kill all tracked processes, clear state
3. `status` - Display formatted status table

### Phase 4: Builder and Utility Commands

**Files to create:**
- `agent-farm/src/commands/spawn.ts` - Spawn new builder
- `agent-farm/src/commands/util.ts` - Spawn utility terminal
- `agent-farm/src/commands/annotate.ts` - Open annotation viewer

**Key operations:**
- `spawn`: Create git worktree, start ttyd, track builder
- `util`: Start ttyd shell, track terminal
- `annotate`: Start annotation server, open browser

### Phase 5: Server Components (TypeScript)

**Files to create:**
- `agent-farm/src/servers/dashboard-server.ts` - Dashboard HTTP server
- `agent-farm/src/servers/annotate-server.ts` - Annotation HTTP server

**Note:** These compile to JS and run as separate Node processes.

### Phase 6: Templates

**Files to create:**
- `agent-farm/templates/dashboard.html` - Dashboard UI (left nav layout)
- `agent-farm/templates/annotate.html` - Annotation viewer UI

**Dashboard features:**
- Left navigation panel
- Architect, builders, utils sections
- Annotations as sub-items under parent terminals
- Real-time state polling

## Architecture Decisions

### 1. Separate Server Processes
- Dashboard and annotation servers run as detached Node processes
- Allows independent lifecycle from main CLI
- Simplifies port management

### 2. State File vs In-Memory
- Use JSON file for persistence across CLI invocations
- State survives terminal close
- Easy debugging (human-readable)

### 3. Templates Location
- Ship templates in npm package (`files: ["templates/"]`)
- Servers reference templates relative to compiled code
- Path resolution handles both dev and production

### 4. Port Allocation
- Architect: 7680 (configurable)
- Dashboard: 7681 (architect + 1)
- Builders: 7682-7699
- Utils: 7700-7719
- Annotations: 8080-8099

## Testing Strategy

### Unit Tests
- Config resolution
- State management (load/save/update)
- Port finding
- Command argument parsing

### Integration Tests
- Full CLI command execution
- Process spawning and cleanup
- State persistence

### Manual Testing
- Dashboard UI functionality
- Annotation viewer functionality
- ttyd integration

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ttyd not installed | Check on startup, provide install instructions |
| Port conflicts | Dynamic port finding with range fallback |
| Zombie processes | Track PIDs, cleanup on stop, handle SIGTERM |
| Template not found | Clear error messages, check paths at startup |

## Dependencies

**Runtime:**
- commander ^12.1.0 - CLI parsing
- chalk ^5.3.0 - Colored output
- open ^10.1.0 - Open browser
- tree-kill ^1.2.2 - Kill process trees

**Development:**
- typescript ^5.7.2
- @types/node ^22.10.1
- vitest ^2.1.6
- tsx ^4.19.2 (for dev mode)

## Success Metrics

1. All commands execute without errors
2. State persists correctly between invocations
3. Processes start and stop cleanly
4. Dashboard displays correct state
5. Annotation viewer works for all file types
6. `npx agent-farm` works from any directory

## Deviations from Spec

| Spec Says | Implementation | Reason |
|-----------|----------------|--------|
| `services/` directory | Combined into `commands/` + `servers/` | Simpler structure |
| `cleanup` command | Not implemented | Can be added later if needed |
| `dashboard` command | Integrated into `start` | Dashboard starts with architect |

## Open Items

1. Windows support (deferred)
2. Tutorial command (spec 0006)
3. Builder prompt template usage
