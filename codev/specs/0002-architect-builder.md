# Specification: Architect-Builder Pattern

**Spec ID**: 0002
**Title**: Architect-Builder Pattern for Parallel AI Development
**Status**: Draft
**Author**: Claude (with human guidance)
**Date**: 2025-12-02

## Overview

Implement the Architect-Builder pattern within the Codev framework to enable parallel AI-assisted development. This pattern separates concerns between an "Architect" (human + primary AI agent holding overall context) and multiple "Builders" (autonomous AI agents executing discrete specs).

## Problem Statement

Current AI-assisted development is typically single-threaded or uses ad-hoc multi-agent coordination. When projects mature and have parallelizable components, developers need a structured way to:

1. **Delegate discrete work** to multiple AI agents running in parallel
2. **Coordinate via specifications** rather than real-time communication
3. **Track builder progress** without constant manual oversight
4. **Review and integrate** builder output systematically

## Goals

1. Enable running multiple builder agents in parallel on separate specs (no fixed limit)
2. Use git as the coordination backbone (fits existing Codev workflow)
3. Provide simple tooling for spawning and monitoring builders
4. Integrate with existing Codev protocols (SPIDER, TICK)

## Non-Goals

1. Full automation of builder spawning (Phase 1 is manual/CLI-assisted)
2. Real-time communication between architect and builders
3. Complex orchestration infrastructure (no separate servers/databases)
4. Replacing the existing spec/plan/review workflow (enhances it)

## Architecture

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARCHITECT                                 │
│  (Human + Claude Code Desktop)                                   │
│                                                                  │
│  Responsibilities:                                               │
│  • Create specs and plans (codev/specs/, codev/plans/)          │
│  • Spawn and monitor builders via web dashboard                  │
│  • Answer blocking questions (poll terminals directly)           │
│  • Review PRs and integrate work                                 │
│  • Update projectlist.md                                         │
└─────────────────────────────────────────────────────────────────┘
              │
              │ Git (specs, plans) + Web Dashboard (terminals)
              ▼
┌──────────────┐  ┌──────────────┐       ┌──────────────┐
│  BUILDER     │  │  BUILDER     │  ...  │  BUILDER     │
│  Port 7681   │  │  Port 7682   │       │  Port 768N   │
│              │  │              │       │              │
│ Spec: 0003   │  │ Spec: 0004   │       │ Spec: XXXX   │
│ Branch:      │  │ Branch:      │       │ Branch:      │
│ builder/0003 │  │ builder/0004 │       │ builder/XXXX │
│              │  │              │       │              │
│ Worktree:    │  │ Worktree:    │       │ Worktree:    │
│ .builders/   │  │ .builders/   │       │ .builders/   │
│  0003/       │  │  0004/       │       │  XXXX/       │
└──────────────┘  └──────────────┘       └──────────────┘
       │                │                       │
       └────────────────┴───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  ttyd instances   │
                    │  (web terminals)  │
                    │  (no fixed limit) │
                    └───────────────────┘
```

### Key Design Decisions

#### 1. Git Worktrees for Isolation

Each builder operates in its own git worktree, providing:
- **Filesystem isolation**: No conflicts between builders modifying files
- **Shared git history**: Instant rebases and merges (same .git database)
- **Clean separation**: Each builder sees only its branch

```bash
# Architect spawns builder with worktree
git worktree add -b builder/0003-auth .builders/0003 main
```

#### 2. Web-Based Terminals via ttyd

Use [ttyd](https://github.com/tsl0922/ttyd) to serve terminals in the browser:

- **One ttyd process per builder** on dynamically assigned ports
- **No fixed limit** - spawn as many builders as your machine can handle
- **Simple HTML dashboard** shows all builders in one view
- **No tmux/screen complexity** - browser handles tabs/windows
- **Easy to monitor** - just refresh the page

**Port allocation**: Starting from 7681, assign next available port. The `architect` script tracks which ports are in use.

```bash
# Start a builder terminal (port assigned automatically)
ttyd -p 7681 -W bash -c "cd .builders/0003 && claude"
ttyd -p 7682 -W bash -c "cd .builders/0004 && claude"
# ... as many as needed
```

**Practical limits**:
- Each builder uses ~500MB-1GB RAM (Claude + terminal)
- Human attention typically caps at 6-8 concurrent builders
- No technical limit on ttyd instances

#### 3. Human-Readable Status via builders.md

Track builder status in a git-tracked markdown file (like projectlist.md):

```markdown
# Active Builders

## Builder 0003: User Authentication
- **Branch**: builder/0003-user-auth
- **Port**: 7681
- **Status**: implementing
- **Phase**: 2/4
- **Started**: 2025-12-02 11:30

## Builder 0004: API Routes
- **Branch**: builder/0004-api-routes
- **Port**: 7682
- **Status**: blocked
- **Phase**: 1/3
- **Started**: 2025-12-02 11:35
- **Blocker**: Needs clarification on rate limiting strategy
```

**Why git-tracked?**
- Human readable (no JSON parsing)
- History of builder activity
- Architect can update via normal editing
- Consistent with projectlist.md pattern

#### 4. Simple Blocking Question Handling

**No complex inbox protocol.** When a builder gets stuck:

1. Builder stops and waits (visible in terminal)
2. Architect polls dashboard, sees builder waiting
3. Architect types response directly in the terminal
4. Builder continues

The `builders.md` file can note blockers for visibility, but resolution happens in the terminal.

#### 5. File Review Tool

The architect needs to review builder work without switching directories or interrupting workflow. Simple CLI commands provide quick access to builder file state:

```bash
# List files changed by a builder (vs main)
architect files 0003
# Output: M src/auth/login.ts, A src/auth/types.ts, ...

# Show diff of builder's changes
architect diff 0003
# Output: unified diff of all changes

# View a specific file in builder's worktree
architect cat 0003 src/auth/login.ts
# Output: file contents with line numbers

# Quick review summary (files + stats)
architect review 0003
# Output: file list, lines added/removed, branch info
```

**Why CLI (not web)?**
- Faster for quick checks than navigating dashboard
- Pipe-able output for scripts
- Works in architect's existing terminal
- No context switch from Claude Code session

**Builders can also use these** to review files in main (though they typically just use git directly in their worktree).

#### 6. Builder Prompt Template

Standard instructions given to each builder when spawned:

```markdown
# Builder Instructions

You are implementing spec XXXX. Read:
- codev/specs/XXXX-name.md (what to build)
- codev/plans/XXXX-name.md (how to build it)

## Rules

1. **Follow SPIDER protocol** - Implement → Defend → Evaluate for each phase
2. **Proceed autonomously** - Don't ask "should I continue?" Just continue.
3. **Stop only for true blockers** - Missing information, ambiguous requirements, architectural decisions
4. **Self-rebase if needed** - If main has moved, rebase your branch before PR
5. **Create PR when complete** - Use `gh pr create` with summary of changes

## Your Branch
builder/XXXX-name

## When Blocked
State clearly what you need and wait. The architect will respond in this terminal.
```

## Implementation

### Directory Structure

```
project-root/
├── .builders/                 # Builder worktrees (gitignored)
│   ├── 0003/                  # Git worktree for spec 0003
│   ├── 0004/
│   └── ...
├── codev/
│   ├── bin/
│   │   └── architect         # Main CLI tool
│   ├── templates/
│   │   ├── builder-prompt.md # Standard builder instructions
│   │   └── dashboard.html    # Simple web dashboard
│   ├── builders.md           # Active builder status (git-tracked)
│   ├── specs/
│   ├── plans/
│   ├── reviews/
│   └── projectlist.md
└── .gitignore                 # Includes .builders/
```

### CLI Interface

```bash
# Spawn a new builder for a project (spec)
architect spawn --project 0003

# Spawn a builder for a GitHub issue
architect spawn --issue 42

# Check status of all builders (reads builders.md)
architect status

# Open the web dashboard
architect dashboard
# Opens browser to localhost with all builder terminals

# Review builder work (without switching context)
architect files 0003      # List changed files
architect diff 0003       # Show unified diff vs main
architect cat 0003 FILE   # View specific file
architect review 0003     # Summary: files, stats, branch info

# Clean up a completed builder (removes worktree, stops ttyd)
architect cleanup 0003
```

**Who calls these commands?** The human user, from their main terminal. The architect AI may suggest commands but doesn't execute them directly.

### Web Dashboard

Simple HTML file served locally:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Builder Dashboard</title>
  <style>
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .builder { border: 1px solid #ccc; padding: 10px; }
    .builder h3 { margin: 0 0 5px 0; }
    .status { font-size: 12px; color: #666; }
    iframe { width: 100%; height: 400px; border: none; }
  </style>
</head>
<body>
  <h1>Builder Dashboard</h1>
  <div class="grid" id="builders">
    <!-- Populated dynamically from builders.md -->
  </div>
  <script>
    // Simple script to load builders.md and render iframes
  </script>
</body>
</html>
```

### Workflow Integration with SPIDER

The Architect-Builder pattern sits on top of SPIDER:

| SPIDER Phase | Who Does It |
|--------------|-------------|
| **Specify** | Architect (human + AI) |
| **Plan** | Architect (human + AI) |
| **Implement** | Builder (autonomous) |
| **Defend** | Builder (autonomous) |
| **Evaluate** | Builder (autonomous) |
| **Review** | Architect reviews builder's PR |

The builder executes the IDE loop (Implement → Defend → Evaluate) autonomously, producing a PR. The architect handles specification, planning, and final review/integration.

See: `codev-skeleton/protocols/spider/protocol.md`

### Integration with projectlist.md

When spawning a builder, the project status updates:

```yaml
- id: "0003"
  title: "User Authentication"
  status: implementing  # Updated from "planned"
```

When builder completes (PR merged):

```yaml
- id: "0003"
  title: "User Authentication"
  status: committed
```

## Success Criteria

1. **Parallel Execution**: Can run multiple builders simultaneously without conflicts
2. **Status Visibility**: Dashboard shows all builder terminals at a glance
3. **Simple Blocking**: Can respond to stuck builders by typing in terminal
4. **Quick File Review**: Can inspect builder changes without leaving main terminal
5. **Clean Integration**: Builder PRs merge cleanly after architect review
6. **Minimal Tooling**: Works with just ttyd + a shell script + HTML file

## Phase 1 Deliverables

- [ ] `.builders/` directory structure with .gitignore entry
- [ ] `architect` shell script with spawn/status/dashboard/cleanup commands
- [ ] File review commands: `files`, `diff`, `cat`, `review`
- [ ] Git worktree-based isolation
- [ ] `builders.md` template and status tracking
- [ ] `builder-prompt.md` template
- [ ] `dashboard.html` for viewing all terminals
- [ ] ttyd integration for web-based terminals
- [ ] Documentation in codev-skeleton

## Future Phases (Out of Scope)

### Phase 2: Enhanced Integration
- `/builder` slash command for Claude Code
- Subagent for PR review assistance
- Automatic projectlist.md updates
- Richer dashboard with status parsing

### Phase 3: Full Automation
- Custom Next.js + xterm.js dashboard
- Auto-spawn builders when spec is committed
- Python orchestrator using Claude Agent SDK

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Web vs tmux for terminals? | **Web (ttyd)** - richer interaction, easier monitoring |
| JSON vs markdown for status? | **Markdown (builders.md)** - human readable, git-tracked |
| Complex inbox protocol? | **No** - architect polls terminals directly |
| claude.ai/code support? | **No** - focus on local ttyd terminals |
| Conflict resolution? | **Builders self-rebase** before creating PR |
| Standard builder prompt? | **Yes** - template enforces SPIDER + autonomous execution |

## References

- [Architect-Builder Pattern Article](/Users/mwk/Development/writing/articles/medium/architecture-builder/article.md)
- [ttyd - Terminal in browser](https://github.com/tsl0922/ttyd)
- [SPIDER Protocol](codev-skeleton/protocols/spider/protocol.md)

## Appendix: Why These Choices?

### Why Git Worktrees (Not Clones)?

Git worktrees provide isolation without the overhead of full clones:
- Same .git database = fast rebases/merges
- Separate working directories = no file conflicts
- Built into git (no external tools needed)
- Easy cleanup with `git worktree remove`

### Why ttyd (Not tmux)?

- **Browser-based** = richer interaction (copy/paste, scrollback)
- **Visual dashboard** = see all builders at once
- **No terminal multiplexer learning curve**
- **Easy to add status/controls** around terminals later

### Why builders.md (Not JSON)?

- **Human readable** without parsing
- **Editable** with any text editor
- **Git history** shows builder activity over time
- **Consistent** with projectlist.md pattern
