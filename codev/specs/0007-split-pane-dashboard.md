# Specification: Split-Pane Dashboard with Tabbed Interface

**Spec ID**: 0007
**Title**: Split-Pane Dashboard with Tabbed Right Panel
**Status**: Draft
**Author**: Claude (with human guidance)
**Date**: 2025-12-02

## Overview

Redesign the agent-farm dashboard to a fixed split-pane layout: Architect terminal always visible on the left half, with a tabbed interface on the right half for files, builders, and shells.

## Problem Statement

The current left-nav dashboard design (spec 0004):
- Requires clicking to switch between architect and other terminals
- Architect is hidden when viewing builders/files
- Context-switching interrupts workflow
- Single-pane layout means losing sight of primary terminal

## Goals

1. **Architect always visible** on the left 50% of the screen
2. **Tabbed right panel** with three tab types: Files, Builders, Shells
3. **Persistent context** - see architect while working with builders/files
4. **Two creation methods** for new tabs:
   - Manual: User clicks "+ File", "+ Builder", or "+ Shell" buttons
   - Agent-driven: Claude calls `agent-farm` commands to spawn tabs
5. **Icon + name** for each tab for quick identification

## Non-Goals

1. Resizable panes (fixed 50/50 split) - Phase 1 only; consider adding resize handle later
2. Multiple architect terminals
3. Drag-and-drop tab reordering (Phase 1)
4. Tab persistence across page reloads (Phase 1)
5. Full file editing in annotation viewer (read-only in Phase 1)

## Design

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Agent Farm Dashboard                                              [Stop]  │
├──────────────────────────────┬─────────────────────────────────────────────┤
│                              │ [📄 spec-0003] [📄 plan-0003] [🔨 0003] [>_shell-1] [+📄] [+🔨] [+>_] │
│                              ├─────────────────────────────────────────────┤
│                              │                                             │
│                              │                                             │
│      ARCHITECT TERMINAL      │         SELECTED TAB CONTENT                │
│      (always visible)        │         (file viewer / builder / shell)     │
│                              │                                             │
│                              │                                             │
│                              │                                             │
│                              │                                             │
├──────────────────────────────┴─────────────────────────────────────────────┤
│  Status: Architect running • 2 builders • 1 shell                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Left Pane: Architect Terminal

**Width**: 50% of viewport (fixed)

**Content**:
- Full ttyd terminal iframe showing the architect Claude session
- Always visible, never hidden
- Port: 7680 (standard architect port)

**When architect not running**:
- Show "Start Architect" button
- Display command hint: `agent-farm start`

### Right Pane: Tabbed Interface

**Width**: 50% of viewport (fixed)

**Tab Bar**:
- Horizontal scrollable tab bar at the top
- Each tab shows: `[icon] name [×]`
- Active tab highlighted
- Tabs ordered by creation time (newest rightmost)
- Tab bar scrolls horizontally when many tabs

**Tab Types**:

| Type | Icon | Name Format | Content | Spawned By |
|------|------|-------------|---------|------------|
| File | 📄 | filename (e.g., "spec-0003") | Annotation viewer | `agent-farm annotate FILE` or "+ File" button |
| Builder | 🔨 | project ID (e.g., "0003") | Builder terminal | `agent-farm spawn --project ID` or "+ Builder" button |
| Shell | >_ | shell name (e.g., "shell-1") | Utility shell | `agent-farm shell` or "+ Shell" button |

**Add Buttons** (right end of tab bar):
```
[+ 📄] [+ 🔨] [+ >_]
```
- `+ 📄` → Opens file picker dialog, then creates annotation tab
- `+ 🔨` → Opens project ID input, then spawns builder
- `+ >_` → Immediately spawns new shell

### Tab Icons

| Tab Type | Icon | Unicode | Description |
|----------|------|---------|-------------|
| File (annotation) | 📄 | U+1F4C4 | Document/page |
| Builder | 🔨 | U+1F528 | Hammer (building) |
| Shell | >_ | Text | Terminal prompt |

### Creating Tabs

#### Method 1: Manual (Dashboard UI)

**New File Tab**:
1. Click `[+ 📄]` button
2. File picker dialog appears with common locations:
   - `codev/specs/`
   - `codev/plans/`
   - `codev/reviews/`
   - Or enter custom path
3. Select file → annotation tab opens

**New Builder Tab**:
1. Click `[+ 🔨]` button
2. Dialog: "Enter project ID (e.g., 0003):"
3. Enter ID → builder spawns in worktree → tab opens

**New Shell Tab**:
1. Click `[+ >_]` button
2. Shell immediately spawns with auto-generated name (shell-1, shell-2, etc.)

#### Method 2: Agent-Driven (CLI Commands)

Claude (or any agent) can spawn tabs via CLI:

```bash
# Open file for annotation review
agent-farm annotate codev/specs/0003-end-of-day-reporter.md

# Spawn builder for a project
agent-farm spawn --project 0003

# Spawn utility shell
agent-farm shell
agent-farm shell --name "test-runner"
```

**Example Workflow**:
```
User: "I want to review spec 0003"
Claude: Runs `agent-farm annotate codev/specs/0003-end-of-day-reporter.md`
→ New file tab appears on the right with the spec loaded in annotation viewer

User: "Start a builder to work on 0003"
Claude: Runs `agent-farm spawn --project 0003`
→ New builder tab appears on the right with the builder terminal
```

### Tab Behavior

**Closing Tabs**:
- Click `×` on tab to close
- Files: Just closes the viewer
- Builders: Prompts "Stop builder 0003?" before closing (hold Shift to bypass)
- Shells: Prompts "Close shell?" before closing (hold Shift to bypass)
- Right-click context menu: "Close", "Close Others", "Close All"

**Tab Overflow**:
- When tabs exceed available width, tab bar becomes horizontally scrollable
- Small left/right arrows appear at edges
- Active tab auto-scrolls into view

**Empty State** (no tabs):
- Shows: "No tabs open"
- Hint: "Click + buttons above or ask the architect to open files/builders"

**Focus Management** (Critical for CLI-driven tabs):
- When Architect spawns a tab via CLI, the tab opens but **focus stays on Architect terminal**
- This prevents focus-stealing when user is mid-typing
- Tab is visually highlighted as "new" briefly (subtle pulse/glow)
- Manual tab creation (+ buttons) DOES switch focus to the new tab

### Builder Status Indicators

Builder tabs show real-time status via colored dot:

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 | Green | Idle/ready |
| 🟡 | Yellow | Working (output streaming) |
| 🔴 | Red | Error/Exited |
| 🔵 | Blue | Spawning |

Example tab: `[🔨 0003 🟢]`

This allows users to see which builders need attention without switching tabs.

### State Management

Dashboard maintains:
```javascript
const state = {
  architect: {
    port: 7680,
    running: true
  },
  tabs: [
    { id: 'file-1', type: 'file', name: 'spec-0003', path: 'codev/specs/0003.md', port: 8080 },
    { id: 'file-2', type: 'file', name: 'plan-0003', path: 'codev/plans/0003.md', port: 8081 },
    { id: 'builder-1', type: 'builder', name: '0003', projectId: '0003', port: 7681 },
    { id: 'shell-1', type: 'shell', name: 'shell-1', port: 7700 }
  ],
  activeTab: 'builder-1'
};
```

### Visual Design

**Color Scheme** (dark theme):
```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #252525;
  --bg-tertiary: #2a2a2a;
  --border: #333;
  --text-primary: #fff;
  --text-secondary: #ccc;
  --text-muted: #666;
  --accent: #3b82f6;
  --tab-active: #333;
  --tab-hover: #2a2a2a;
}
```

**Tab Styling**:
```css
.tab {
  padding: 8px 12px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
}

.tab:hover {
  background: var(--tab-hover);
}

.tab.active {
  background: var(--tab-active);
  border-color: var(--border);
}

.tab .icon {
  font-size: 14px;
}

.tab .name {
  font-size: 13px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab .close {
  opacity: 0;
  margin-left: 4px;
  font-size: 12px;
}

.tab:hover .close {
  opacity: 0.6;
}

.tab .close:hover {
  opacity: 1;
}
```

**Add Buttons**:
```css
.add-buttons {
  display: flex;
  gap: 4px;
  margin-left: auto;
  padding: 0 8px;
}

.add-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
}

.add-btn:hover {
  border-style: solid;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
}
```

### CLI Changes

**Updated Commands**:

```bash
# Existing - works as before
agent-farm start              # Start architect
agent-farm spawn --project ID # Spawn builder (now opens tab in dashboard)
agent-farm stop               # Stop all

# New/Modified
agent-farm annotate FILE      # Open file in annotation tab
agent-farm shell              # Spawn utility shell
agent-farm shell --name NAME  # Spawn named shell
```

**Dashboard API**:

```
GET  /api/state              # Get current state (architect + tabs)
POST /api/tabs/file          # Create file tab { path: "..." }
POST /api/tabs/builder       # Create builder tab { projectId: "..." }
POST /api/tabs/shell         # Create shell tab { name?: "..." }
DELETE /api/tabs/:id         # Close tab
```

### CLI-to-Dashboard IPC

**Critical Architecture Decision**: How CLI commands trigger UI tab creation.

The `agent-farm` CLI acts as a thin client that communicates with the dashboard server:

```typescript
// CLI implementation (simplified)
async function handleAnnotateCommand(filePath: string) {
  try {
    // Contact the running dashboard server
    const response = await fetch('http://localhost:PORT/api/tabs/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (response.ok) {
      console.log(`✅ Opened ${filePath} in dashboard`);
    } else {
      throw new Error(await response.text());
    }
  } catch (err) {
    // Fallback if dashboard isn't running
    console.error(`❌ Dashboard not available: ${err.message}`);
    console.log(`Hint: Run 'agent-farm start' first`);
    process.exit(1);
  }
}
```

**Real-time Updates**: Dashboard uses polling (5s interval) or WebSocket to receive tab state changes.

**Idempotency**: Tab creation uses deterministic IDs based on content:
- File tabs: `file-${hash(path)}`
- Builder tabs: `builder-${projectId}`
- Shell tabs: `shell-${incrementingCounter}`

This prevents duplicate tabs if CLI command runs while user clicks + button simultaneously.

### Error Handling

| Scenario | Behavior |
|----------|----------|
| `annotate` with non-existent file | Tab opens with "File not found" error state |
| `spawn` with invalid project ID | Error toast: "Project 0099 not found" |
| Dashboard not running | CLI exits with error: "Dashboard not available" |
| Builder process crashes | Tab shows 🔴 status, output shows error |

**Notifications**: When builders finish or error, show non-intrusive toast with "Go to tab" action.

## Success Criteria

1. **Split layout works**: Architect on left, tabs on right, both visible simultaneously
2. **Tabs functional**: Can create, switch between, and close file/builder/shell tabs
3. **Manual creation**: + buttons spawn appropriate dialogs and create tabs
4. **Agent creation**: `agent-farm annotate/spawn/shell` commands create tabs in dashboard
5. **Real-time updates**: New tabs appear immediately when spawned via CLI
6. **Tab overflow**: Horizontal scrolling works when many tabs

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Tab limit? | No hard limit, rely on horizontal scroll + "Close All/Others" context menu |
| Pane resizing? | Fixed 50/50 for Phase 1; add draggable divider in Phase 2 |
| Tab reordering? | Deferred - not in Phase 1 |
| Focus on CLI spawn? | NO focus steal - tab opens in background, architect keeps focus |
| File editing? | Read-only in Phase 1; annotation comments only |
| Zombie processes? | Dashboard cleanup hook kills orphaned builders on exit |

## Open Questions

| Question | Status |
|----------|--------|
| Quick tab switcher (Ctrl+P)? | Consider adding for 10+ tabs scenario |
| Tab grouping by project? | Could color-code tabs by project ID |
| Architect sees builder output? | Currently isolated; consider log streaming option |

## Supersedes

This spec supersedes **0004-dashboard-nav-ui** which used a left navigation bar approach. The split-pane with tabs provides better visibility of the architect while working with other resources.

## References

- Current dashboard: `codev/templates/dashboard.html`
- agent-farm CLI: `agent-farm/src/`
- Annotation viewer: `codev/templates/annotate.html`
- Spec 0004: Dashboard Nav UI (superseded)
- Spec 0005: TypeScript CLI

## Expert Consultation Summary

### Gemini 3 Pro Feedback (Incorporated)

**Key Insights**:
1. ✅ Split-pane "Command Center" pattern is superior to left-nav for orchestrator workflows
2. ⚠️ Fixed 50/50 split risky on small screens → added to Phase 2 roadmap for resize handle
3. ✅ Focus stealing is a major UX risk → added focus management rules (CLI spawns don't steal focus)
4. ✅ Need explicit IPC mechanism → added CLI-to-Dashboard IPC section with implementation pattern
5. ✅ Builder status indicators needed → added status dot system (🟢🟡🔴🔵)
6. ✅ "Ghost tabs" for missing files → added error handling section

**Deferred Suggestions**:
- Maximize/minimize pane controls (Phase 2)
- Pane resize presets (20/80, 80/20)

### GPT-5 Codex Feedback (Incorporated)

**Key Insights**:
1. ✅ Tab overflow becomes painful at 10+ tabs → added "Close All/Others" context menu
2. ✅ Need status indicators for builders → added colored status dots
3. ✅ Error handling for spawn failures → added error toast behavior
4. ⚠️ State explosion with many tabs → noted in open questions for future grouping feature
5. ✅ Confirmation friction on close → added Shift-bypass for power users
6. ✅ Keyboard shortcuts essential → already included Ctrl+1, Ctrl+Tab, etc.

**Deferred Suggestions**:
- Quick tab switcher (Ctrl+P style) for many tabs
- Tab grouping/color-coding by project
- Command palette for common operations
