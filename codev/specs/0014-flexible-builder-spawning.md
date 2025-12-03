# Specification: Flexible Builder Spawning

## Metadata
- **ID**: 0014-flexible-builder-spawning
- **Protocol**: SPIDER
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: high

## Problem Statement

Currently, `af spawn` is tightly coupled to project specs. It requires `--project XXXX` and expects a spec file at `codev/specs/XXXX-*.md`. This limits flexibility in several ways:

1. **Ad-hoc tasks**: Users can't spawn a builder for quick tasks without first creating a spec file
2. **Protocol invocation**: Users can't run a protocol (like CLEANUP) directly via spawn
3. **Exploratory sessions**: Users can't spawn a "blank" Claude session for investigation

The Architect should be able to delegate any work to a Builder, not just spec-defined projects.

## Current State

```bash
# This works (spec-based)
af spawn --project 0009

# These don't work
af spawn "Fix the bug in auth.ts"           # Natural language task
af spawn --protocol cleanup                  # Protocol invocation
af spawn                                     # Blank session
```

The current spawn implementation:
1. Requires `--project` flag
2. Searches for spec file matching project ID
3. Creates branch named `builder/XXXX-spec-name`
4. Creates worktree at `.builders/XXXX`
5. Starts Claude with prompt: "Implement the feature specified in codev/specs/..."

## Desired State

The `af spawn` command becomes flexible, supporting multiple invocation modes:

```bash
# Mode 1: Spec-based (existing behavior)
af spawn --project 0009                      # Spawn builder for spec
af spawn -p 0009                             # Short form

# Mode 2: Natural language task
af spawn "Fix the authentication bug"        # Positional argument
af spawn --task "Refactor the logging"      # Explicit flag
af spawn "Fix auth bug" --files src/auth.ts,src/login.ts  # With context

# Mode 3: Protocol invocation
af spawn --protocol cleanup                  # Run cleanup protocol
af spawn --protocol experiment --args '{"hypothesis": "Can we use Redis?"}'

# Mode 4: Blank session
af spawn --shell                             # Just a Claude session, no prompt
```

## Stakeholders
- **Primary Users**: Architects using agent-farm to delegate work
- **Secondary Users**: Solo developers using builders for parallel work
- **Technical Team**: Codev maintainers
- **Business Owners**: Project owner (Waleed)

## Success Criteria

- [ ] `af spawn "task"` starts a builder with the task as initial prompt
- [ ] `af spawn "task" --files a.ts,b.ts` provides file context to the builder
- [ ] `af spawn --protocol NAME` starts a builder with protocol role loaded
- [ ] `af spawn --protocol NAME --args '{...}'` passes arguments to protocol
- [ ] `af spawn --shell` starts a bare Claude session
- [ ] `af spawn --project XXXX` continues to work as before (backward compatible)
- [ ] All modes create proper worktrees and tmux sessions
- [ ] Builder IDs are unique (no collisions on repeated invocations)
- [ ] Builder state includes `type` field for UI grouping
- [ ] Dashboard correctly displays and groups all builder types
- [ ] `af spawn --help` documents all modes with examples
- [ ] Tests pass for all spawn modes
- [ ] CLI validates mutually exclusive flags and provides clear error messages

## Constraints

### Technical Constraints
- Must maintain backward compatibility with `--project` flag
- Must work with existing worktree and tmux infrastructure
- Builder IDs must be unique and filesystem-safe
- Must integrate with existing dashboard API

### Business Constraints
- Should be intuitive for Architect users
- Should not require changes to the Builder role definition

## Assumptions

- Protocols are defined in `codev/protocols/*/protocol.md`
- A "blank" session is useful for exploration/debugging
- Natural language tasks don't need spec files
- Branch naming can follow different conventions per mode

## Solution Approaches

### Approach 1: Mode-based Spawning

**Description**: Detect spawn mode from arguments and execute mode-specific logic.

```typescript
interface SpawnOptions {
  // Existing
  project?: string;
  noRole?: boolean;

  // New - mutually exclusive modes
  task?: string;           // Natural language task
  protocol?: string;       // Protocol to invoke
  shell?: boolean;         // Bare session

  // New - protocol-specific options
  protocolArgs?: Record<string, string>;  // e.g., --hypothesis for experiment
}
```

**Mode detection logic**:
1. If `--project`, use spec-based mode
2. If positional arg or `--task`, use task mode
3. If `--protocol`, use protocol mode
4. If `--shell`, use shell mode
5. If nothing, error with help

**Pros**:
- Clear separation of modes
- Easy to extend with new modes
- Backward compatible

**Cons**:
- More complex argument parsing
- Need to validate mutual exclusivity

**Estimated Complexity**: Medium
**Risk Level**: Low

### Approach 2: Unified Task Model

**Description**: Treat everything as a "task" with different sources.

```typescript
interface Task {
  type: 'spec' | 'adhoc' | 'protocol' | 'shell';
  source?: string;        // Spec file, protocol name, or task text
  options?: Record<string, string>;
}
```

All modes resolve to a Task, then a single spawn path executes it.

**Pros**:
- Simpler mental model
- Single code path for spawning

**Cons**:
- Task abstraction may be overfit
- May conflate different concerns

**Estimated Complexity**: Medium
**Risk Level**: Medium

### Recommended Approach

**Approach 1** (Mode-based Spawning) is recommended because:
- Clearer separation of concerns
- Easier to maintain and extend
- More explicit about what each mode does

## Technical Design

### Architecture: Mode-based CLI, Unified Internal Model

The CLI uses mode-based parsing (clearer UX), but internally normalizes to a unified `BuilderConfig` that the spawn logic consumes. This avoids duplicating git/tmux/ttyd logic across modes.

```typescript
interface BuilderConfig {
  type: 'spec' | 'task' | 'protocol' | 'shell';
  id: string;           // Unique builder ID
  branch: string;       // Git branch name
  worktree: string;     // Worktree path
  prompt?: string;      // Initial prompt (null for shell mode)
  role?: string;        // Role file path
  contextFiles?: string[]; // Files to mention in prompt (task mode)
  protocolArgs?: Record<string, unknown>; // Protocol arguments
}
```

### Builder ID Generation (Collision-Safe)

All IDs include randomness or timestamps to prevent collisions on repeated invocations:

| Mode | Builder ID | Branch Name | Example |
|------|-----------|-------------|---------|
| Spec | Project ID | `builder/{id}-{spec-name}` | `builder/0009-terminal-click` |
| Task | `task-{hash}-{rand4}` | `builder/task-{hash}-{rand4}` | `builder/task-a7f3-x9k2` |
| Protocol | `{name}-{timestamp}` | `builder/protocol-{name}-{ts}` | `builder/protocol-cleanup-1733250000` |
| Shell | `shell-{timestamp}-{rand4}` | `builder/shell-{ts}-{rand4}` | `builder/shell-1733250000-b4c1` |

**Notes:**
- `{hash}` = first 4 chars of SHA256 of task text (for human readability)
- `{rand4}` = 4-char random alphanumeric suffix
- `{timestamp}` = Unix epoch seconds
- Spec mode retains existing behavior (project ID is already unique)

### Prompt Construction

| Mode | Initial Prompt |
|------|---------------|
| Spec | "Implement the feature specified in {spec}. Follow the plan in {plan}." |
| Task | "{user's task text}\n\nRelevant files: {contextFiles}" (if provided) |
| Protocol | "You are running the {protocol} protocol.\n\nProtocol arguments:\n```json\n{args}\n```\n\nStart by reading codev/protocols/{name}/protocol.md" |
| Shell | (no prompt - interactive session) |

### Role Loading Strategy

Protocol roles take precedence when available:

| Mode | Role Resolution |
|------|----------------|
| Spec | `codev/roles/builder.md` |
| Task | `codev/roles/builder.md` |
| Protocol | `codev/protocols/{name}/role.md` → fallback to `codev/roles/builder.md` |
| Shell | None (unless `--role` specified) |

### Builder State Extension

Add `type` field to `Builder` interface for observability:

```typescript
interface Builder {
  // ... existing fields
  type: 'spec' | 'task' | 'protocol' | 'shell';
  taskText?: string;      // For task mode (for display in dashboard)
  protocolName?: string;  // For protocol mode
}
```

### CLI Validation Matrix

| Flag Combination | Result |
|-----------------|--------|
| `--project` alone | OK (spec mode) |
| Positional arg alone | OK (task mode) |
| `--task` alone | OK (task mode) |
| `--protocol` alone | OK (protocol mode) |
| `--shell` alone | OK (shell mode) |
| `--project` + positional | ERROR: "Cannot combine --project with task text" |
| `--project` + `--shell` | ERROR: "Flags are mutually exclusive" |
| `--protocol` + `--shell` | ERROR: "Flags are mutually exclusive" |
| Positional + `--protocol` | ERROR: "Cannot combine task text with --protocol" |
| `--files` without task | ERROR: "--files requires a task" |

## Open Questions

### Critical (Blocks Progress)
- [x] Should `--task` be required or allow positional arg? **Decision: Allow positional for convenience**
- [x] Should protocol mode load a protocol-specific role? **Decision: Yes, look for `protocols/{name}/role.md`, fallback to `builder.md`**
- [x] How to handle protocol arguments? **Decision: Use `--args '{json}'` flag, append to prompt as JSON block**

### Important (Affects Design)
- [x] How to prevent builder ID collisions? **Decision: Add timestamp/random suffixes to all non-spec modes**
- [ ] Should task mode support `--files` for context? **Tentative: Yes, add `--files` flag**

### Nice-to-Know (Optimization)
- [ ] Should we support spawning multiple tasks in parallel? (Deferred to future spec)
- [ ] Should there be a `--ephemeral` flag for auto-cleanup? (Deferred)

## Performance Requirements
- **Spawn time**: < 5 seconds to interactive prompt
- **Resource usage**: Same as current (one ttyd + tmux session per builder)

## Security Considerations
- Task text should be sanitized before shell execution
- No arbitrary code execution from task strings
- Protocol names should be validated against existing protocols

## Test Scenarios

### Functional Tests
1. `af spawn -p 0009` - Existing spec-based spawn works (backward compat)
2. `af spawn "Fix bug"` - Task mode creates builder with prompt
3. `af spawn "Fix bug" --files src/auth.ts` - Task mode with file context
4. `af spawn --task "Refactor"` - Explicit task flag works
5. `af spawn --protocol cleanup` - Protocol mode loads protocol
6. `af spawn --protocol experiment --args '{"hypothesis":"test"}'` - Protocol with args
7. `af spawn --shell` - Shell mode creates bare session
8. `af spawn --shell --role custom.md` - Shell with custom role
9. Mutual exclusivity: `af spawn -p 0009 --shell` returns error
10. Mutual exclusivity: `af spawn --protocol x "task text"` returns error
11. Builder ID uniqueness: spawn same task twice, get different IDs
12. Protocol role loading: creates role file at `protocols/x/role.md`, verify it's loaded
13. Missing protocol: `af spawn --protocol nonexistent` shows helpful error

### Non-Functional Tests
1. Spawn completes in < 5 seconds
2. Multiple concurrent spawns don't cause port conflicts
3. Dashboard displays all builder types with correct grouping
4. `af spawn --help` shows all modes with examples

## Dependencies
- **Internal Systems**: Existing spawn infrastructure, tmux, ttyd
- **Libraries**: Commander.js for argument parsing

## References
- `codev/resources/conceptual-model.md` - Defines protocols and roles
- `agent-farm/src/commands/spawn.ts` - Current implementation
- `codev/protocols/` - Available protocols

## Risks and Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Breaking existing `--project` mode | Low | High | Comprehensive test coverage |
| Confusing UX with multiple modes | Medium | Medium | Clear help text and examples |
| Shell injection in task text | Low | High | Sanitize user input, write to file not inline |
| Shell injection in protocol args | Low | High | Validate JSON, sanitize before prompt injection |
| Branch/worktree proliferation | High | Medium | Document cleanup procedures, consider `af prune` command |
| Port allocation race conditions | Low | Medium | Verify port still free after allocation |
| Dashboard incompatibility with new ID formats | Medium | Medium | Update dashboard UI to handle all builder types |
| Protocol file not found | Medium | Low | Clear error message with available protocols |
| Zombie builders from shell/task mode | High | Medium | Add `type` to state for grouping, easier cleanup |

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Sections Updated**:
- **Technical Design**: Added unified `BuilderConfig` interface per Gemini recommendation (mode-based CLI, unified internal model)
- **Builder ID Generation**: Added collision-safe IDs with timestamps/random suffixes per both models
- **Builder State**: Added `type` field for observability per Gemini
- **Role Loading**: Defined protocol role precedence strategy per Gemini (`protocols/{name}/role.md` → `builder.md`)
- **CLI Validation**: Added validation matrix for mutually exclusive flags per GPT-5
- **Success Criteria**: Added criteria for `--files`, `--args`, `--help`, and error messages per both models
- **Risks**: Added 6 additional risks (branch proliferation, port races, dashboard compat, zombie builders) per both models
- **Desired State**: Added `--files` and `--args` examples per Gemini
- **Open Questions**: Resolved protocol role and argument handling questions

Note: Both models agreed on the mode-based approach but emphasized the need for collision-safe IDs and better observability through the `type` field.

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
- [ ] Expert AI Consultation Complete

## Notes
This spec generalizes the spawn command to support the Architect's need for flexible delegation. It maintains backward compatibility while adding significant new capabilities. The key insight is that "spawning a builder" is fundamentally about delegating work, whether that work is defined in a spec file, as a natural language task, or as a protocol invocation.
