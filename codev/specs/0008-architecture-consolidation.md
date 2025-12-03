# Specification: Architecture Consolidation & Brittleness Elimination

## Metadata
- **ID**: 0008-architecture-consolidation
- **Status**: draft
- **Created**: 2024-12-02
- **Revised**: 2024-12-02 (Architect Review)

## Clarifying Questions Asked

1. **Q: Is npx complicating things?**
   A: Yes. We are **abandoning npx distribution** for now. The npm package must resolve templates/roles at runtime from its package location, which differs between development and installed modes. This causes path resolution bugs. We will make agent-farm part of the codev installation process and can separate it later.

2. **Q: Is the issue the install process?**
   A: Partially. INSTALL.md offers TWO ways to use architect-builder which creates confusion. We will standardize on a single approach: agent-farm as part of codev, invoked via a thin bash wrapper.

3. **Q: Is it that we're trying to self-host?**
   A: Yes, significantly. The project is named "codev" and uses codev methodology. However, this is a standard pattern (TypeScript is written in TypeScript). The issue isn't self-hosting—it's the triple implementation.

## Why Three Directories Exist

This repository has a dual nature that requires three distinct directories:

1. **`codev/`** - Our instance of Codev (the Dogfood Instance)
   - This is where WE (the Codev project) keep our specs, plans, reviews, and resources
   - Contains `codev/templates/` which is canonical for THIS project
   - When working on Codev features, you work in this directory

2. **`codev-skeleton/`** - Template for OTHER projects (the Distribution Template)
   - This is what gets copied to other projects when they install Codev
   - Contains `codev-skeleton/templates/` which is canonical for OTHER projects
   - Contains protocol definitions and agents
   - Does NOT contain specs/plans/reviews (those are created by users)

3. **`agent-farm/`** - The orchestration engine (TypeScript implementation)
   - THE canonical implementation of architect-builder functionality
   - References templates from `codev/templates/` at runtime (not bundled)
   - No duplicate templates—uses project's templates directory

**Mental Model:**
- **Modify `codev/`**: When implementing features for Codev (specs, plans, reviews, our architecture docs)
- **Modify `codev-skeleton/`**: When updating protocols, templates, or agents that other projects will use
- **Modify `agent-farm/`**: When updating the orchestration engine behavior

## Problem Statement

The codev architecture-builder system is **brittle** due to architectural fragmentation:

1. **Triple Implementation**: Same functionality exists in 3 places:
   - `codev/bin/architect` (bash, 713 lines) → **DELETE**
   - `codev-skeleton/bin/architect` (bash, duplicate) → **DELETE**
   - `agent-farm/src/` (TypeScript) → **CANONICAL**

2. **Triple Templates**: Templates duplicated across:
   - `codev/templates/` → **CANONICAL** for this project
   - `codev-skeleton/templates/` → **CANONICAL** for other projects
   - `agent-farm/templates/` → **DELETE** (use codev/templates/)

3. **Divergent Behavior**: Each implementation has different:
   - Port ranges (bash: 7680+, TypeScript: 4200+)
   - State files (bash: builders.md + HTML, TS: state.json)
   - Process management (bash: direct ttyd, TS: tmux + ttyd)

4. **State Race Conditions**: Multiple processes read/write `state.json` without locking

5. **Unsafe Process Management**: PIDs stored in files with no validation before kill

## Current State

### Directory Structure (Problematic)
```
ansari-project/codev/              ← Git repo
├── codev/                         ← Self-hosted instance
│   ├── bin/architect              ← Bash script (713 lines) [DELETE]
│   ├── templates/                 ← Templates [KEEP - canonical for project]
│   ├── builders.md                ← Bash state file [DELETE]
│   └── ...
├── codev-skeleton/                ← Template for other projects
│   ├── bin/architect              ← DUPLICATE bash script [DELETE]
│   ├── templates/                 ← [KEEP - canonical for skeleton]
│   └── ...
├── agent-farm/                    ← TypeScript implementation
│   ├── src/                       ← [KEEP - canonical implementation]
│   ├── templates/                 ← [DELETE - duplicate]
│   ├── roles/                     ← [MOVE to codev/]
│   └── package.json
└── .agent-farm/state.json         ← TypeScript state file
```

### Specific Problems

| Problem | Location | Impact |
|---------|----------|--------|
| Port collision | bash:17 vs config.ts:95 | Two builders can't coexist |
| State corruption | state.ts + dashboard-server.ts | Data loss on concurrent writes |
| Logic drift | bash vs TS implementations | Bugs fixed in one, remain in other |
| Template mismatch | 3 template directories | UI inconsistencies |
| Self-hosting confusion | codev/codev/ | Files in wrong location |

## Desired State

### Target Architecture

```
ansari-project/codev/              ← Git repo (Toolkit Source)
├── codev/                         ← Self-hosted instance (Dogfood Instance)
│   ├── specs/                     ← Our specs
│   ├── plans/                     ← Our plans
│   ├── reviews/                   ← Our reviews
│   ├── templates/                 ← CANONICAL templates for this project
│   ├── roles/                     ← CANONICAL roles for this project
│   ├── config.json                ← Shell command configuration
│   └── bin/agent-farm             ← Thin wrapper → node agent-farm
├── codev-skeleton/                ← Template for OTHER projects
│   ├── protocols/                 ← Protocol definitions
│   ├── agents/                    ← Agent definitions
│   ├── templates/                 ← Templates for other projects
│   └── bin/agent-farm             ← Thin wrapper → node agent-farm
├── agent-farm/                    ← The orchestration engine
│   ├── src/                       ← TypeScript implementation
│   ├── dist/                      ← Compiled JS
│   └── package.json               ← NOT published to npm (for now)
└── .agent-farm/state.json         ← Project-scoped state file
```

### Key Changes

1. **Single Implementation**: `agent-farm` TypeScript is THE tool
2. **Single Template Source per Context**:
   - `codev/templates/` for this project
   - `codev-skeleton/templates/` for other projects using codev
3. **No npm Distribution**: Abandoning npx for now—agent-farm is part of codev installation
4. **Thin Bash Wrapper**: One script `codev/bin/agent-farm` that calls `node agent-farm/dist/index.js "$@"`
5. **config.json Configuration**: Shell commands for architect, builder, and shell configurable via JSON
6. **Project-Scoped State**: State files namespaced to project directory (supports future multi-architect)
7. **State Locking**: Atomic file operations with advisory locks
8. **Validated Process Management**: Verify PID ownership before kill
9. **Clean Slate**: Nuke existing worktrees and state files—no migration needed

### config.json Structure

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

**Configuration Hierarchy**: CLI args > config.json > Defaults

**Features**:
- Commands can be strings OR arrays (arrays avoid shell-escaping issues)
- Environment variables expanded at runtime (e.g., `"architect": "claude --api-key ${ANTHROPIC_KEY}"`)
- CLI overrides: `--architect-cmd "..."` overrides config.json value
- Early validation: on startup, verify commands exist and directories resolve

This replaces the bash wrapper's ability to customize commands. Users can override which Claude model or shell to use without modifying scripts.

### Thin Wrapper Script

`codev/bin/agent-farm`:
```bash
#!/bin/bash
# Thin wrapper - forwards all commands to agent-farm TypeScript
# Uses readlink to handle symlinks (e.g., if symlinked to /usr/local/bin)
SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
exec node "$PROJECT_ROOT/agent-farm/dist/index.js" "$@"
```

### Multi-Architect Support (Design Consideration)

The architecture supports running multiple architects in different repositories simultaneously:

- State files are **project-scoped**: `.agent-farm/state.json` is relative to project root
- **Global port registry**: `~/.agent-farm/ports.json` tracks port blocks per repo
- tmux session names include deterministic project identifier (hash of project root)

**Port Allocation Strategy** (Architect Decision):
Use a global registry in `~/.agent-farm/` to assign deterministic port blocks per repository:

```
~/.agent-farm/ports.json
{
  "/Users/me/project-a": { "basePort": 4200 },
  "/Users/me/project-b": { "basePort": 4300 },
  "/Users/me/project-c": { "basePort": 4400 }
}
```

- First repo to register gets port block 4200-4299
- Second repo gets 4300-4399
- Etc.

This avoids cross-project port collisions while keeping port assignments stable and predictable. The global registry is minimal—just tracks which repo owns which port block.

## Stakeholders
- **Primary Users**: Developers using codev architect-builder pattern
- **Secondary Users**: Projects installing codev via INSTALL.md
- **Technical Team**: Codev maintainers
- **Business Owners**: Ansari Project

## Success Criteria
- [ ] Single implementation (agent-farm TypeScript) handles all orchestration
- [ ] Bash architect scripts DELETED (only thin wrapper remains)
- [ ] Templates exist in ONE location per context (codev/ for us, codev-skeleton/ for others)
- [ ] agent-farm/templates/ DELETED
- [ ] agent-farm reads templates from project's codev/templates/
- [ ] No state corruption under concurrent operations (verified by tests)
- [ ] Process kills validated before execution
- [ ] Port allocation centralized with no collisions
- [ ] config.json controls shell commands
- [ ] All existing functionality preserved
- [ ] Tests pass with >90% coverage
- [ ] INSTALL.md updated

## Constraints

### Technical Constraints
- NO backward compatibility with existing worktrees—nuke them all
- NO npm distribution for now—agent-farm is part of codev
- State files can be deleted and recreated from scratch
- Must work without ttyd/tmux installed (graceful degradation)

### Clean Slate Safety (from expert review)

**Worktree Deletion Safety**: "Nuke worktrees" must NOT silently delete uncommitted work:
```typescript
async function cleanupWorktree(worktreePath: string, force: boolean): Promise<void> {
  const isDirty = await hasUncommittedChanges(worktreePath);
  if (isDirty && !force) {
    throw new Error(`Worktree ${worktreePath} has uncommitted changes. Use --force-clean to delete.`);
  }
  await removeWorktree(worktreePath);
}
```

**Orphaned Process Handling**: On startup, query `tmux list-sessions` for sessions matching our naming convention. Either adopt or kill them—don't assume clean slate just because state.json is missing.

### Business Constraints
- Self-hosting must continue to work (codev developing codev)
- Installation process should remain simple
- No breaking changes to CLAUDE.md references

## Assumptions
- TypeScript/Node.js is acceptable as the single implementation language
- Users have Node.js 18+ installed
- tmux is preferred over direct ttyd (persistence across browser refresh)
- JSON state file is acceptable (vs SQLite)
- Nuking existing worktrees is acceptable (clean slate)
- Nuking existing state files is acceptable

## Solution: Approach 1 - Templates in codev/, agent-farm References Them

**Description**: Make `agent-farm` the canonical implementation. DELETE bash scripts. Templates stay in `codev/templates/` (and `codev-skeleton/templates/` for distribution). agent-farm references them at runtime.

**Architecture**:
```
codev/
├── templates/          ← Canonical templates for this project
├── roles/              ← Canonical roles for this project
├── config.json         ← Shell command configuration
└── bin/agent-farm      ← Thin wrapper

codev-skeleton/
├── templates/          ← Canonical templates for other projects
├── protocols/          ← Protocols (unchanged)
└── bin/agent-farm      ← Thin wrapper

agent-farm/
├── src/                ← Implementation
├── dist/               ← Compiled JS
└── package.json        ← NOT published to npm
```

**Template Resolution Strategy** (in config.ts):
```typescript
function getTemplatesDir(projectRoot: string): string {
  // 1. Check config.json override
  const config = loadConfig(projectRoot);
  if (config?.templates?.dir) {
    return resolve(projectRoot, config.templates.dir);
  }

  // 2. Default to codev/templates
  return resolve(projectRoot, 'codev/templates');
}
```

**Pros**:
- Single implementation to maintain
- Clear separation: codev = templates, agent-farm = behavior
- No template duplication in agent-farm
- Simple path resolution (always relative to project root)

**Cons**:
- Requires agent-farm to know about codev directory structure
- Not distributable via npm (acceptable for now)

**Estimated Complexity**: Low
**Risk Level**: Low

## Open Questions

### Resolved
- [x] Should bash scripts be completely removed or converted to wrappers? **Answer: DELETE all except thin wrapper `codev/bin/agent-farm` that calls node**
- [x] How should agent-farm find templates? **Answer: From `codev/templates/` at runtime, configurable via config.json**
- [x] What's the migration path for existing state files? **Answer: Nuke them. Clean slate.**
- [x] What's the migration path for existing worktrees? **Answer: Nuke them. Clean slate.**
- [x] Should we support npm distribution? **Answer: NO, abandon for now**
- [x] How to handle multiple architects? **Answer: Design consideration—state is project-scoped**

### Nice-to-Know (Optimization)
- [ ] Should we add SQLite option for state management?
- [ ] Should dashboard support multiple projects?

## Performance Requirements
- **Response Time**: CLI commands <500ms to start
- **Throughput**: N/A (single user tool)
- **Resource Usage**: <100MB memory for dashboard server
- **Availability**: N/A (local tool)

## Security Considerations
- PID validation before process termination (prevent killing system processes)
- Path traversal prevention in dashboard API (already implemented)
- No secrets in state.json
- Localhost-only binding for dashboard server

## Test Scenarios

### Functional Tests
1. Spawn builder, verify worktree created
2. Concurrent spawn + dashboard access, verify no state corruption
3. Cleanup builder with stale PID file, verify correct handling
4. Port collision detection and resolution
5. Template resolution from codev/templates/
6. config.json shell command customization

### Non-Functional Tests
1. State file locking under concurrent writes
2. Dashboard server handles 10 simultaneous builders
3. Graceful degradation without tmux installed

## Dependencies
- **External Services**: None
- **Internal Systems**:
  - git (worktree management)
  - tmux (session persistence)
  - ttyd (web terminal)
- **Libraries/Frameworks**:
  - commander.js (CLI)
  - proper-lockfile (state locking)
  - tree-kill (process cleanup)

## References
- [0002-architect-builder.md](0002-architect-builder.md) - Original architect-builder spec
- [0005-typescript-cli.md](0005-typescript-cli.md) - TypeScript migration spec
- [0007-split-pane-dashboard.md](0007-split-pane-dashboard.md) - Dashboard spec

## Risks and Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Breaking existing bash script users | High | Low | Clean break—document in CHANGELOG |
| Self-hosting breaks | Low | High | Test codev-on-codev workflow explicitly |
| Template path resolution bugs | Low | Medium | Simple resolution: always `codev/templates/`, fail fast if missing |
| Multi-architect port conflicts | Low | Low | Global port registry in `~/.agent-farm/ports.json` |
| Data loss from worktree deletion | Medium | High | Check for uncommitted changes, require `--force-clean` |
| Orphaned tmux sessions | Medium | Low | Query tmux on startup, adopt or kill matching sessions |
| Symlink resolution in wrapper | Low | Medium | Use `readlink -f` with fallbacks |

## Expert Consultation

### Initial Consultation (2024-12-02)
**Models Consulted**: Gemini Pro (gemini-3-pro-preview) and GPT-5 Codex

**Summary**: Both models recommended Approach 3 (embedded templates) with User Override pattern. Architect reviewed and decided on **Approach 1** instead, with additional simplifications:
- Abandon npx distribution
- DELETE bash scripts entirely
- Nuke existing worktrees and state
- Use config.json for shell command customization

### Post-Review Consultation (2024-12-02)
**Models Consulted**: Gemini Pro (gemini-3-pro-preview) and GPT-5 Codex

**Verdict**: Both models **approved** the architect's decisions with refinements.

**Gemini Pro Key Points**:
1. Approach 1 is sound given no npm distribution—benefits development velocity
2. config.json needs CLI argument overrides (hierarchy: CLI > config.json > defaults)
3. **CRITICAL**: Port allocation cannot rely on project-scoped state for cross-project collision detection. **Architect decision**: Use global registry `~/.agent-farm/ports.json` with deterministic port blocks (4200, 4300, etc.) per repo.
4. Clean slate risk: "Nuke worktrees" could delete uncommitted work—need dirty check or `--force-clean`
5. Bash wrapper needs `readlink -f` for symlink robustness
6. Zombie process handling: query tmux for orphaned sessions on startup

**GPT-5 Codex Key Points**:
1. Approach 1 practical—just need guardrails (validation, documentation)
2. config.json should support array-form commands to avoid shell escaping
3. Clean slate: need loud CHANGELOG, pre-flight checks for stale artifacts
4. Project-scoped state: use deterministic identifier (hash of project root) for tmux/ports

**Refinements Incorporated**:
- Enhanced config.json: CLI overrides, array-form commands, env var expansion
- Global port registry `~/.agent-farm/ports.json` with deterministic port blocks per repo
- Clean slate safety: dirty worktree check, orphaned process handling
- Symlink-safe bash wrapper

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
- [ ] Stakeholder Sign-off
- [x] Initial Expert AI Consultation Complete
- [x] Post-Review Expert AI Consultation Complete

## Notes

### Root Cause
The "brittleness" feeling comes from **architectural fragmentation** rather than any single bug. Fixing individual bugs provides temporary relief, but the root cause is having three implementations. The solution: DELETE the duplicates, keep only TypeScript.

### Self-Hosting Clarification
The `codev/codev/` directory structure is confusing but **not fundamentally problematic**. This is standard practice—TypeScript is written in TypeScript, Rust compiler is written in Rust.

### Key Decisions from Architect Review
1. **Approach 1** over Approach 3—templates in codev/, not bundled in agent-farm
2. **Abandon npx**—simplifies path resolution dramatically
3. **config.json**—replaces bash wrapper customization
4. **Clean slate**—no migration, just delete old state/worktrees
5. **Project-scoped state**—enables future multi-architect support

### Implementation Notes
*Phases belong in the plan document, not here. See `codev/plans/0008-architecture-consolidation.md` (to be created).*
