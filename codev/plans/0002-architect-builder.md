# Implementation Plan: Architect-Builder Pattern

**Plan ID**: 0002
**Spec**: [0002-architect-builder.md](../specs/0002-architect-builder.md)
**Date**: 2025-12-02

## Overview

This plan implements Phase 1 of the Architect-Builder pattern: a minimal viable implementation using git worktrees, ttyd web terminals, and simple shell scripting.

## Prerequisites

- **ttyd** installed (`brew install ttyd` on macOS)
- **git** with worktree support (2.5+)
- **gh** CLI for GitHub operations (optional, for `--issue` support)

## Implementation Phases

### Phase 1: Directory Structure & .gitignore

**Goal**: Set up the builder directory structure.

**Tasks**:
1. Create `.builders/` directory (gitignored)
2. Add `.builders/` to `.gitignore`
3. Create `codev/builders.md` template
4. Create `codev/templates/` directory for templates

**Files**:
```
.gitignore                    # Add .builders/
codev/
├── builders.md               # Active builder tracking
└── templates/
    ├── builder-prompt.md     # Standard builder instructions
    └── dashboard.html        # Web dashboard
```

**Acceptance criteria**:
- [ ] `.builders/` is gitignored
- [ ] `builders.md` template exists with example format
- [ ] Templates directory exists

---

### Phase 2: Builder Prompt Template

**Goal**: Create the standard instructions given to each builder.

**Tasks**:
1. Write `builder-prompt.md` template
2. Include SPIDER protocol reference
3. Include "proceed autonomously" instructions
4. Include self-rebase and PR creation instructions

**Template content** (codev/templates/builder-prompt.md):
```markdown
# Builder Instructions for Spec {{SPEC_ID}}

You are implementing:
- **Spec**: codev/specs/{{SPEC_ID}}-{{SPEC_NAME}}.md
- **Plan**: codev/plans/{{SPEC_ID}}-{{SPEC_NAME}}.md
- **Branch**: builder/{{SPEC_ID}}-{{SPEC_NAME}}

## Protocol

Follow SPIDER: Implement → Defend → Evaluate for each phase in the plan.

## Rules

1. **Proceed autonomously** - Do NOT ask "should I continue?" Just continue.
2. **Stop only for true blockers**:
   - Missing information not in spec/plan
   - Ambiguous requirements needing clarification
   - Architectural decisions outside your scope
3. **When blocked**: State clearly what you need and WAIT. The architect will respond here.
4. **Self-rebase**: Before creating PR, rebase on main if it has moved.
5. **Create PR when complete**: Use `gh pr create` with summary.

## Start

Read the spec and plan, then begin Phase 1.
```

**Acceptance criteria**:
- [ ] Template includes all required sections
- [ ] Placeholder syntax ({{VAR}}) is consistent

---

### Phase 3: builders.md Template

**Goal**: Create the human-readable status tracking file.

**Tasks**:
1. Create `codev/builders.md` with example format
2. Document the status values
3. Include instructions for manual updates

**Template content** (codev/builders.md):
```markdown
# Active Builders

Track active builder agents here. Update manually or via `architect status`.

## Status Values

- **spawning**: Worktree being created, ttyd starting
- **implementing**: Builder is working
- **blocked**: Builder waiting for architect input
- **pr-ready**: Builder has created a PR
- **reviewing**: Architect is reviewing the PR
- **complete**: PR merged, ready for cleanup

---

## Builders

<!-- Add builders below as they are spawned -->

<!-- Example:
## Builder 0003: Feature Name
- **Branch**: builder/0003-feature-name
- **Port**: 7681
- **Status**: implementing
- **Phase**: 2/4
- **Started**: 2025-12-02 11:30
- **PR**: (none yet)
-->

(No active builders)
```

**Acceptance criteria**:
- [ ] Status values documented
- [ ] Example format included
- [ ] File is git-tracked

---

### Phase 4: Dashboard HTML

**Goal**: Create a simple web dashboard showing all builder terminals.

**Tasks**:
1. Create `dashboard.html` with grid layout
2. Add JavaScript to parse `builders.md` (or hardcode for Phase 1)
3. Embed ttyd iframes for each builder
4. Style for readability

**Template content** (codev/templates/dashboard.html):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Architect Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; padding: 20px; background: #1a1a1a; color: #fff; }
    h1 { margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 15px; }
    .builder { background: #2a2a2a; border-radius: 8px; overflow: hidden; }
    .builder-header { padding: 10px 15px; background: #333; display: flex; justify-content: space-between; }
    .builder-header h3 { font-size: 14px; }
    .builder-status { font-size: 12px; padding: 2px 8px; border-radius: 4px; }
    .status-implementing { background: #3b82f6; }
    .status-blocked { background: #ef4444; }
    .status-pr-ready { background: #22c55e; }
    iframe { width: 100%; height: 450px; border: none; }
    .no-builders { text-align: center; padding: 40px; color: #666; }
    .instructions { margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px; font-size: 13px; }
    .instructions code { background: #333; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🏗️ Architect Dashboard</h1>

  <div class="grid" id="builders">
    <!-- Builders will be inserted here -->
  </div>

  <div class="instructions">
    <strong>Commands:</strong>
    <code>architect spawn --project XXXX</code> ·
    <code>architect status</code> ·
    <code>architect cleanup XXXX</code>
  </div>

  <script>
    // Configuration - update this when spawning builders
    const builders = [
      // { id: '0003', name: 'User Auth', port: 7681, status: 'implementing', phase: '2/4' },
      // { id: '0004', name: 'API Routes', port: 7682, status: 'blocked', phase: '1/3' },
    ];

    const grid = document.getElementById('builders');

    if (builders.length === 0) {
      grid.innerHTML = '<div class="no-builders">No active builders. Run <code>architect spawn --project XXXX</code> to start.</div>';
    } else {
      builders.forEach(b => {
        grid.innerHTML += `
          <div class="builder">
            <div class="builder-header">
              <h3>Builder ${b.id}: ${b.name}</h3>
              <span class="builder-status status-${b.status}">${b.status} (${b.phase})</span>
            </div>
            <iframe src="http://localhost:${b.port}"></iframe>
          </div>
        `;
      });
    }
  </script>
</body>
</html>
```

**Acceptance criteria**:
- [ ] Dashboard renders correctly
- [ ] Grid layout adapts to number of builders
- [ ] Status badges are color-coded
- [ ] Instructions shown at bottom

---

### Phase 5: Architect CLI Script

**Goal**: Create the main `architect` shell script with all commands.

**Tasks**:
1. Create `codev/bin/architect` script
2. Implement `spawn` command (worktree + ttyd)
3. Implement `status` command (show builders.md)
4. Implement `dashboard` command (open browser)
5. Implement `cleanup` command (remove worktree + kill ttyd)
6. Make script executable

**Script structure** (codev/bin/architect):
```bash
#!/bin/bash
set -e

CODEV_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ROOT="$(cd "$CODEV_DIR/.." && pwd)"
BUILDERS_DIR="$PROJECT_ROOT/.builders"
BUILDERS_MD="$CODEV_DIR/builders.md"
DASHBOARD_HTML="$CODEV_DIR/templates/dashboard.html"
PROMPT_TEMPLATE="$CODEV_DIR/templates/builder-prompt.md"
BASE_PORT=7681

# ... implementation of commands
```

**Commands**:

| Command | Description |
|---------|-------------|
| `spawn --project XXXX` | Create worktree, start ttyd, update builders.md |
| `spawn --issue NN` | Same but fetch spec from GitHub issue |
| `status` | Display builders.md |
| `dashboard` | Open dashboard.html in browser |
| `cleanup XXXX` | Kill ttyd, remove worktree, update builders.md |

**Acceptance criteria**:
- [ ] All commands work
- [ ] Port allocation finds next available port
- [ ] Worktrees created correctly
- [ ] ttyd processes tracked (PID file or port scanning)
- [ ] Cleanup removes all artifacts

---

### Phase 6: Integration & Documentation

**Goal**: Integrate into codev-skeleton and document usage.

**Tasks**:
1. Add architect-builder to codev-skeleton
2. Update CLAUDE.md/AGENTS.md with architect-builder reference
3. Create usage documentation
4. Test full workflow

**Files to update**:
- `codev-skeleton/builders.md` (template)
- `codev-skeleton/templates/builder-prompt.md`
- `codev-skeleton/templates/dashboard.html`
- `codev-skeleton/bin/architect`
- `CLAUDE.md` - add architect-builder section
- `AGENTS.md` - add architect-builder section

**Acceptance criteria**:
- [ ] Fresh codev install includes architect-builder
- [ ] Documentation explains full workflow
- [ ] End-to-end test: spawn → implement → PR → cleanup

---

## Testing Plan

### Manual Testing Checklist

1. **Spawn test**:
   ```bash
   architect spawn --project 0003
   # Verify: worktree exists, ttyd running, builders.md updated
   ```

2. **Dashboard test**:
   ```bash
   architect dashboard
   # Verify: browser opens, terminal visible, can type commands
   ```

3. **Multiple builders test**:
   ```bash
   architect spawn --project 0003
   architect spawn --project 0004
   architect spawn --project 0005
   # Verify: all on different ports, all visible in dashboard
   ```

4. **Cleanup test**:
   ```bash
   architect cleanup 0003
   # Verify: ttyd stopped, worktree removed, builders.md updated
   ```

5. **Full workflow test**:
   - Spawn builder for a real spec
   - Watch builder implement (or simulate)
   - Create PR
   - Review and merge
   - Cleanup

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ttyd not installed | Check on `spawn`, show install instructions |
| Port already in use | Scan for available port starting from BASE_PORT |
| Worktree already exists | Error with clear message |
| Orphaned ttyd processes | `cleanup` scans for processes matching pattern |
| Dashboard can't reach ttyd | Check ttyd is running, show troubleshooting |

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Directory structure | 15 min |
| Phase 2: Builder prompt | 15 min |
| Phase 3: builders.md | 10 min |
| Phase 4: Dashboard HTML | 30 min |
| Phase 5: Architect CLI | 1-2 hours |
| Phase 6: Integration & docs | 30 min |
| **Total** | ~3-4 hours |

---

## Dependencies

```
Phase 1 ─┬─► Phase 2
         ├─► Phase 3
         └─► Phase 4
              │
              ▼
         Phase 5 (needs 1-4)
              │
              ▼
         Phase 6 (needs 5)
```

Phases 2, 3, 4 can be done in parallel after Phase 1.
