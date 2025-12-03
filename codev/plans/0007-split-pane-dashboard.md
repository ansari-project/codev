# Implementation Plan: Split-Pane Dashboard

**Plan ID**: 0007
**Spec**: `codev/specs/0007-split-pane-dashboard.md`
**Status**: Draft
**Date**: 2025-12-02

## Overview

Implement a split-pane dashboard with Architect terminal always visible on the left and a tabbed interface on the right for files, builders, and shells.

## Phases

### Phase 1: Core Layout

**Goal**: Basic split-pane structure with architect on left, placeholder on right

**Tasks**:
1. Create new `dashboard-split.html` template (don't modify existing yet)
2. Implement 50/50 CSS flexbox layout
3. Left pane: iframe for architect terminal (port 7680)
4. Right pane: tab bar + content area (empty state initially)
5. Status bar at bottom showing running processes

**Files to modify/create**:
- `codev/templates/dashboard-split.html` (new)
- `agent-farm/src/servers/dashboard-server.ts` (serve new template)

**Deliverable**: Static split-pane layout, architect terminal loads on left

---

### Phase 2: Tab Infrastructure

**Goal**: Functional tab bar with state management

**Tasks**:
1. Implement tab bar component with icons (📄, 🔨, >_)
2. Tab state management in JavaScript
3. Tab switching (click to activate)
4. Tab closing with × button
5. Horizontal scroll when tabs overflow
6. Empty state message when no tabs

**State structure**:
```javascript
{
  tabs: [
    { id: 'file-1', type: 'file', name: 'spec-0003', path: '...', port: 8080 },
    { id: 'builder-1', type: 'builder', name: '0003', projectId: '0003', port: 7681, status: 'idle' },
    { id: 'shell-1', type: 'shell', name: 'shell-1', port: 7700 }
  ],
  activeTab: 'builder-1'
}
```

**Deliverable**: Working tab bar, can add/remove/switch tabs (hardcoded for testing)

---

### Phase 3: Tab Types Implementation

**Goal**: Each tab type renders correct content

**3a: File Tabs (Annotation Viewer)**
- Load annotation viewer iframe for file path
- Reuse existing `annotate-server.js` infrastructure
- Display "File not found" for missing files

**3b: Builder Tabs**
- Load ttyd terminal iframe for builder port
- Show status indicator (🟢🟡🔴🔵) in tab
- Close confirmation dialog

**3c: Shell Tabs**
- Load ttyd terminal iframe for shell port
- Auto-generate names (shell-1, shell-2, ...)

**Deliverable**: All three tab types functional

---

### Phase 4: Manual Tab Creation (UI)

**Goal**: + buttons spawn new tabs

**Tasks**:
1. Add `[+📄] [+🔨] [+>_]` buttons at right end of tab bar
2. File picker dialog for +📄
   - Quick access: specs/, plans/, reviews/
   - Custom path input
3. Project ID dialog for +🔨
4. Immediate spawn for +>_ (no dialog)

**API calls from UI**:
```
POST /api/tabs/file { path: "codev/specs/0003.md" }
POST /api/tabs/builder { projectId: "0003" }
POST /api/tabs/shell { name?: "test-runner" }
```

**Deliverable**: Users can create all tab types from dashboard UI

---

### Phase 5: CLI Integration (Agent-Driven Tabs)

**Goal**: `agent-farm` commands create tabs in dashboard

**Tasks**:
1. Add `agent-farm annotate <file>` command
2. Modify `agent-farm spawn` to notify dashboard
3. Add `agent-farm shell` command
4. All commands POST to dashboard API
5. Dashboard polls /api/state for updates (or WebSocket)

**CLI behavior**:
```bash
$ agent-farm annotate codev/specs/0003.md
✅ Opened codev/specs/0003.md in dashboard

$ agent-farm spawn --project 0003
✅ Builder 0003 spawned in dashboard

$ agent-farm shell --name test-runner
✅ Shell 'test-runner' opened in dashboard
```

**Focus rule**: CLI-spawned tabs open in background (no focus steal)

**Deliverable**: Architect can spawn tabs by running CLI commands

---

### Phase 6: Polish & Error Handling

**Goal**: Production-ready UX

**Tasks**:
1. Builder status indicators (poll process state)
2. Close confirmations for builders/shells (with Shift bypass)
3. Right-click context menu: "Close", "Close Others", "Close All"
4. Error toasts for spawn failures
5. "File not found" error state for missing files
6. Tab highlight pulse on CLI-spawn (visual feedback)
7. Notification toasts when builders complete/error

**Deliverable**: Polished, error-resilient dashboard

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `codev/templates/dashboard-split.html` | Create | New split-pane dashboard |
| `agent-farm/src/servers/dashboard-server.ts` | Modify | Serve new template, add tab APIs |
| `agent-farm/src/commands/annotate.ts` | Create | New annotate command |
| `agent-farm/src/commands/shell.ts` | Create | New shell command |
| `agent-farm/src/commands/spawn.ts` | Modify | Notify dashboard on spawn |
| `agent-farm/src/index.ts` | Modify | Register new commands |

## API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/state` | - | Get architect + tabs state |
| POST | `/api/tabs/file` | `{ path }` | Create file/annotation tab |
| POST | `/api/tabs/builder` | `{ projectId }` | Spawn builder + create tab |
| POST | `/api/tabs/shell` | `{ name? }` | Spawn shell + create tab |
| DELETE | `/api/tabs/:id` | - | Close tab (and stop process if builder/shell) |

## Testing Strategy

1. **Manual testing**: Run `agent-farm start`, verify split layout
2. **Tab operations**: Create/switch/close each tab type
3. **CLI integration**: Run annotate/spawn/shell commands, verify tabs appear
4. **Error cases**: Non-existent files, invalid project IDs
5. **Overflow**: Create 10+ tabs, verify horizontal scroll

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing dashboard | Create new template, don't modify old one initially |
| Port conflicts | Reuse existing port allocation from agent-farm |
| Focus stealing | Explicit rule: CLI spawns don't change focus |
| Zombie processes | Dashboard cleanup hook on exit |

## Dependencies

- Spec 0005 (TypeScript CLI) - already integrated
- Existing ttyd infrastructure
- Existing annotation viewer

## Estimated Effort

| Phase | Complexity |
|-------|------------|
| Phase 1: Core Layout | Low |
| Phase 2: Tab Infrastructure | Medium |
| Phase 3: Tab Types | Medium |
| Phase 4: Manual Creation | Medium |
| Phase 5: CLI Integration | Medium |
| Phase 6: Polish | Low |
