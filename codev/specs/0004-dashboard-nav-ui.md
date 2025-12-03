# Specification: Dashboard Navigation UI

**Spec ID**: 0004
**Title**: Left Navigation Bar for Architect Dashboard
**Status**: Draft
**Author**: Claude (with human guidance)
**Date**: 2025-12-02

## Overview

Redesign the architect dashboard from the current side-by-side grid layout to a left navigation bar with a main content area. This provides better scalability as the number of terminals grows and adds a new "Util" terminal type for ad-hoc tasks.

## Problem Statement

The current dashboard layout:
- Shows architect and builders side-by-side in a grid
- Doesn't scale well with many builders (terminals get small)
- No way to run quick utility commands without using a builder slot
- Can't easily switch focus between terminals

## Goals

1. Left navigation bar listing all active terminals
2. Main content area showing the selected terminal (full width)
3. Three terminal types: Architect, Builder, Util
4. Quick switching between terminals via nav clicks
5. Visual indicators for terminal status in nav
6. Annotation viewers appear as sub-items under the terminal that opened them

## Non-Goals

1. Drag-and-drop reordering of nav items
2. Split-view showing multiple terminals simultaneously (Phase 1)
3. Terminal tabs within the main area
4. Persistent terminal sessions across page reloads

## Design

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Architect Dashboard                            [Refresh]   │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  ARCHITECT │                                                │
│  ● Active  │                                                │
│    📄 spec │   ← annotation sub-item                        │
│            │         Selected Terminal/Annotation           │
│  BUILDERS  │         (full width iframe)                    │
│  ○ 0003    │                                                │
│    📄 plan │   ← annotation opened from builder 0003        │
│  ● 0004    │                                                │
│            │                                                │
│  UTILS     │                                                │
│  + New     │                                                │
│            │                                                │
├────────────┴────────────────────────────────────────────────┤
│  Commands: architect spawn --project XXXX | architect stop  │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Bar

**Width**: 200px fixed

**Sections**:

1. **ARCHITECT** (always first)
   - Single item: "Architect"
   - Status indicator: ● active (green) or ○ inactive (gray)
   - Click to view architect terminal

2. **BUILDERS** (middle section)
   - Lists all active builders by ID
   - Format: "0003: feature-name" (truncated if long)
   - Status indicators:
     - ● implementing (blue)
     - ● blocked (red)
     - ● pr-ready (green)
   - Click to view that builder's terminal

3. **UTILS** (bottom section)
   - Lists utility terminals (util-1, util-2, etc.)
   - Each util has a small rename button (pencil icon) on hover
   - Click rename → inline edit field → save custom name
   - "+ New Util" button to spawn a new utility terminal
   - Click item to view util terminal
   - No limit on number of utils

4. **ANNOTATIONS** (as sub-items)
   - Appear indented under the terminal that opened them
   - Show abbreviated filename (e.g., "📄 0003-spec.md")
   - Click to view annotation in main area
   - Small × button to close annotation
   - Can have multiple annotations per terminal

### Terminal Types

| Type | Purpose | Port Range | Spawned By |
|------|---------|------------|------------|
| Architect | Main Claude session | 7680 | `architect start` |
| Builder | Spec implementation | 7681-7699 | `architect spawn --project XXXX` |
| Util | Ad-hoc commands | 7700-7719 | `architect util` or dashboard button |
| Annotation | File review/comments | 8080-8099 | `architect annotate path/to/file` |

### Utility Terminals

New terminal type for quick tasks:
- Running tests
- Checking git status
- Quick file edits
- Any shell command

**Spawning**:
```bash
# From CLI
architect util

# From dashboard
Click "+ New Util" in nav
```

**Characteristics**:
- Starts bash (not Claude) by default
- No git worktree (uses main project directory)
- Lightweight - just a shell
- Auto-cleanup option after idle timeout (future)

### Annotation Viewers

File review interface for specs, plans, and code:

**Spawning**:
```bash
# From any terminal
architect annotate codev/specs/0003-dashboard-nav-ui.md
architect annotate src/components/Button.tsx
```

**Characteristics**:
- Works on ANY file in the project (no builder ID required)
- Opens annotation viewer in browser
- Tracks which terminal opened it (for nav placement)
- Supports inline REVIEW comments (saved to file)
- Multiple annotations can be open simultaneously

**How terminal association works**:
- When `architect annotate` runs, it detects the current terminal context
- If run from architect terminal → annotation appears under ARCHITECT
- If run from builder 0003 → annotation appears under that builder
- If run from util → annotation appears under that util
- Falls back to a standalone ANNOTATIONS section if context unknown

### Visual Design

**Nav Bar**:
```css
.nav {
  width: 200px;
  background: #252525;
  border-right: 1px solid #333;
  padding: 15px 0;
}

.nav-section {
  padding: 10px 15px;
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item:hover {
  background: #2a2a2a;
}

.nav-item.active {
  background: #333;
  border-left: 2px solid #3b82f6;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
```

**Status Colors**:
- Architect active: `#8b5cf6` (purple)
- Implementing: `#3b82f6` (blue)
- Blocked: `#ef4444` (red)
- PR Ready: `#22c55e` (green)
- Util: `#6b7280` (gray)
- Inactive: `#374151` (dark gray)

### State Management

Dashboard JavaScript maintains:
```javascript
const state = {
  architectPort: 7680,
  builders: [
    { id: '0003', name: 'user-auth', port: 7681, status: 'implementing' },
    { id: '0004', name: 'api-routes', port: 7682, status: 'blocked' }
  ],
  utils: [
    { id: 'util-1', name: 'util-1', port: 7700 },  // name can be customized
    { id: 'util-2', name: 'test-runner', port: 7701 }  // renamed by user
  ],
  annotations: [
    { id: 'annot-1', file: 'codev/specs/0003-dashboard-nav-ui.md', port: 8080, parent: { type: 'architect' } },
    { id: 'annot-2', file: 'codev/plans/0003-dashboard-nav-ui.md', port: 8081, parent: { type: 'builder', id: '0003' } }
  ],
  selectedTerminal: { type: 'architect', id: null }
};
```

**Util names persisted** via localStorage or a simple JSON file (`.utils.json`).

### CLI Changes

**New commands**:
```bash
architect util          # Spawn a new utility terminal
architect util stop N   # Stop utility terminal N
architect annotate FILE # Open any file in annotation viewer (no builder ID required)
```

**Configurable architect command**:
```bash
# Set custom command for architect console
architect start --cmd "claude --dangerously-skip-permissions"
architect start --cmd "bash"  # Just a shell, no Claude

# Or via environment variable
ARCHITECT_CMD="claude --dangerously-skip-permissions" architect start
```

**Updated `update_dashboard`**:
- Include utils array in dashboard state
- Include annotations array in dashboard state
- Track util ports and PIDs
- Track annotation ports and parent terminal associations

## Success Criteria

1. **Nav displays all terminals**: Architect, all builders, all utils visible
2. **Single-click switching**: Click nav item → terminal loads in main area
3. **Status visible at glance**: Can see which builders are blocked without clicking
4. **Util terminals work**: Can spawn/use/stop utility terminals
5. **Responsive**: Nav collapses or scrolls gracefully if many items
6. **Annotations work**: Can annotate any file, shows as sub-item under parent terminal
7. **Configurable command**: Can customize the command run in architect console

## Implementation Notes

### Phase 1: Basic Nav UI
- Refactor dashboard.html with nav + main layout
- Click to switch terminals
- Add `--cmd` flag support to `architect start`

### Phase 2: Utility Terminals
- Add `architect util` command
- Track utils in state
- "+ New Util" button in dashboard

### Phase 3: Annotations Integration
- Update `architect annotate` to work on any file (no builder ID)
- Track annotations in dashboard state
- Show annotations as sub-items under parent terminal
- Detect terminal context for parent association

### Phase 4: Polish
- Keyboard shortcuts (1-9 to switch terminals)
- Auto-refresh terminal list
- Collapse/expand nav sections

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Max utils? | **No limit** - spawn as many as needed |
| Util naming? | **Auto-increment + rename** - starts as util-1, util-2; rename button allows custom names |
| Nav position? | **Left nav** - not top tabs |
| Annotation placement? | **Sub-items** - appear indented under the terminal that opened them |
| Annotation file scope? | **Any file** - no builder ID required, works on any project file |
| Architect command? | **Configurable** - via `--cmd` flag or `ARCHITECT_CMD` env var |

## References

- Current dashboard: `codev/templates/dashboard.html`
- Architect CLI: `codev/bin/architect`
- Annotation viewer: `codev/templates/annotate.html`
- Annotation server: `codev/bin/annotate-server.js`
- Spec 0002: Architect-Builder Pattern
