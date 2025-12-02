# Specification: Dashboard Navigation UI

**Spec ID**: 0003
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
│            │         Selected Terminal                      │
│  BUILDERS  │         (full width iframe)                    │
│  ○ 0003    │                                                │
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

### Terminal Types

| Type | Purpose | Port Range | Spawned By |
|------|---------|------------|------------|
| Architect | Main Claude session | 7680 | `architect start` |
| Builder | Spec implementation | 7681-7699 | `architect spawn --project XXXX` |
| Util | Ad-hoc commands | 7700-7719 | `architect util` or dashboard button |

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
  selectedTerminal: { type: 'architect', id: null }
};
```

**Util names persisted** via localStorage or a simple JSON file (`.utils.json`).

### CLI Changes

**New command**:
```bash
architect util          # Spawn a new utility terminal
architect util stop N   # Stop utility terminal N
```

**Updated `update_dashboard`**:
- Include utils array in dashboard state
- Track util ports and PIDs

## Success Criteria

1. **Nav displays all terminals**: Architect, all builders, all utils visible
2. **Single-click switching**: Click nav item → terminal loads in main area
3. **Status visible at glance**: Can see which builders are blocked without clicking
4. **Util terminals work**: Can spawn/use/stop utility terminals
5. **Responsive**: Nav collapses or scrolls gracefully if many items

## Implementation Notes

### Phase 1: Basic Nav UI
- Refactor dashboard.html with nav + main layout
- Click to switch terminals
- No util support yet

### Phase 2: Utility Terminals
- Add `architect util` command
- Track utils in state
- "+ New Util" button in dashboard

### Phase 3: Polish
- Keyboard shortcuts (1-9 to switch terminals)
- Auto-refresh terminal list
- Collapse/expand nav sections

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Max utils? | **No limit** - spawn as many as needed |
| Util naming? | **Auto-increment + rename** - starts as util-1, util-2; rename button allows custom names |
| Nav position? | **Left nav** - not top tabs |

## References

- Current dashboard: `codev/templates/dashboard.html`
- Architect CLI: `codev/bin/architect`
- Spec 0002: Architect-Builder Pattern
