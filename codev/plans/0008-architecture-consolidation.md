# Plan: Architecture Consolidation & Brittleness Elimination

## Metadata
- **Spec**: [0008-architecture-consolidation.md](../specs/0008-architecture-consolidation.md)
- **Status**: draft
- **Created**: 2024-12-02

## Overview

This plan implements the architecture consolidation spec. The goal is to eliminate brittleness by:
1. Deleting duplicate bash scripts and templates
2. Making agent-farm the single source of truth
3. Adding config.json for customization
4. Implementing global port registry for multi-architect support
5. Adding safety checks for clean slate operations

## Phase 1: Delete Duplicates & Update Template Resolution

**Goal**: Single implementation, single template source

### Tasks

1. **Delete bash scripts**
   - [ ] Delete `codev/bin/architect` (713 lines)
   - [ ] Delete `codev-skeleton/bin/architect`
   - [ ] Delete `codev/builders.md` (old state file)

2. **Delete duplicate templates**
   - [ ] Delete `agent-farm/templates/` directory
   - [ ] Delete `agent-farm/roles/` directory (will use codev/roles/)

3. **Update template resolution in agent-farm**
   - [ ] Modify `agent-farm/src/utils/config.ts` to resolve templates from `codev/templates/`
   - [ ] Add config.json support for template directory override
   - [ ] Fail fast with helpful error if templates directory missing

4. **Move roles to codev/**
   - [ ] Move `agent-farm/roles/` contents to `codev/roles/`
   - [ ] Update any role resolution logic

### Exit Criteria
- `agent-farm/templates/` and `agent-farm/roles/` deleted
- All bash architect scripts deleted
- agent-farm reads templates from `codev/templates/`
- Tests pass

## Phase 2: Implement config.json

**Goal**: Replace bash wrapper customization with JSON config

### Tasks

1. **Create config.json schema**
   - [ ] Define TypeScript types for config structure
   - [ ] Support string and array command formats
   - [ ] Support environment variable expansion

2. **Implement config loader**
   - [ ] Create `loadConfig()` function in config.ts
   - [ ] Implement hierarchy: CLI args > config.json > defaults
   - [ ] Add early validation (verify commands exist, directories resolve)

3. **Add CLI overrides**
   - [ ] Add `--architect-cmd`, `--builder-cmd`, `--shell-cmd` flags
   - [ ] These override config.json values

4. **Create default config.json**
   - [ ] Create `codev/config.json` with sensible defaults
   - [ ] Add to `codev-skeleton/config.json` for new projects

### Config Structure
```json
{
  "shell": {
    "architect": "claude --model opus",
    "builder": ["claude", "--model", "sonnet"],
    "shell": "bash"
  },
  "templates": {
    "dir": "codev/templates"
  },
  "roles": {
    "dir": "codev/roles"
  }
}
```

### Exit Criteria
- config.json loaded and applied
- CLI overrides work
- Environment variables expanded
- Validation errors shown on startup

## Phase 3: Global Port Registry

**Goal**: Support multiple architects across different repos

### Tasks

1. **Create global registry module**
   - [ ] Create `~/.agent-farm/` directory on first use
   - [ ] Implement `ports.json` read/write with file locking

2. **Port block allocation**
   - [ ] First repo gets 4200-4299
   - [ ] Second repo gets 4300-4399
   - [ ] Etc. (100 ports per repo)

3. **Update port allocation logic**
   - [ ] Check global registry for existing allocation
   - [ ] If new repo, allocate next available block
   - [ ] Use ports within allocated block for dashboard, builders, etc.

4. **Cleanup stale entries**
   - [ ] On startup, verify registered repos still exist
   - [ ] Remove entries for deleted repos

### Registry Structure
```json
{
  "/Users/me/project-a": { "basePort": 4200, "registered": "2024-12-02T..." },
  "/Users/me/project-b": { "basePort": 4300, "registered": "2024-12-02T..." }
}
```

### Exit Criteria
- Multiple repos can run simultaneously without port conflicts
- Port assignments are stable across restarts
- Stale entries cleaned up

## Phase 4: Clean Slate Safety

**Goal**: Prevent accidental data loss

### Tasks

1. **Dirty worktree detection**
   - [ ] Implement `hasUncommittedChanges(worktreePath)` function
   - [ ] Check before any worktree deletion

2. **Force flag requirement**
   - [ ] Add `--force-clean` flag to cleanup commands
   - [ ] Refuse to delete dirty worktrees without flag
   - [ ] Show clear error message listing uncommitted changes

3. **Orphaned process handling**
   - [ ] On startup, query `tmux list-sessions`
   - [ ] Find sessions matching our naming pattern
   - [ ] Either adopt them into state or kill them
   - [ ] Log what was found and action taken

4. **Pre-flight checks**
   - [ ] Detect stale bash artifacts (builders.md, old state files)
   - [ ] Warn user and suggest cleanup

### Exit Criteria
- Cannot accidentally delete uncommitted work
- Orphaned tmux sessions handled gracefully
- Clear warnings for stale artifacts

## Phase 5: Thin Wrapper & Documentation

**Goal**: Simple invocation, clear documentation

### Tasks

1. **Create thin wrapper**
   - [ ] Create `codev/bin/agent-farm` (symlink-safe)
   - [ ] Create `codev-skeleton/bin/agent-farm`
   ```bash
   #!/bin/bash
   SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
   SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
   PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
   exec node "$PROJECT_ROOT/agent-farm/dist/index.js" "$@"
   ```

2. **Update INSTALL.md**
   - [ ] Remove references to npx
   - [ ] Document single invocation method
   - [ ] Document config.json customization

3. **Update CLAUDE.md / AGENTS.md**
   - [ ] Update CLI Commands section
   - [ ] Remove bash script references
   - [ ] Add config.json documentation

4. **Create CHANGELOG entry**
   - [ ] Document breaking changes
   - [ ] Document migration path (clean slate)

### Exit Criteria
- Wrapper script works (including symlinked)
- Documentation updated
- CHANGELOG documents breaking changes

## Phase 6: Testing & Verification

**Goal**: Ensure everything works

### Tasks

1. **Unit tests**
   - [ ] Test config.json loading and validation
   - [ ] Test port registry allocation
   - [ ] Test dirty worktree detection
   - [ ] Test template resolution

2. **Integration tests**
   - [ ] Spawn builder, verify worktree created
   - [ ] Run two repos simultaneously, verify no conflicts
   - [ ] Test cleanup with dirty worktree
   - [ ] Test orphaned session handling

3. **Self-hosting verification**
   - [ ] Run full workflow in codev repo
   - [ ] Verify codev-on-codev works

### Exit Criteria
- All tests pass
- >90% coverage on new code
- Self-hosting verified

## Dependencies

| Phase | Depends On |
|-------|-----------|
| Phase 1 | None |
| Phase 2 | Phase 1 (templates must resolve) |
| Phase 3 | Phase 1 (state structure must be stable) |
| Phase 4 | Phase 1 |
| Phase 5 | Phases 1-4 |
| Phase 6 | Phases 1-5 |

## Risks

| Risk | Mitigation |
|------|-----------|
| Breaking existing workflows | Clean break documented in CHANGELOG |
| Template resolution bugs | Fail fast with helpful errors |
| Port registry corruption | File locking, validation on read |
| Lost uncommitted work | Force flag required, clear warnings |

## Notes

- Phases 1-4 can be partially parallelized
- Phase 5 should wait until implementation stable
- Consider creating a migration script to help users clean up old artifacts
