# Implementation Plan: Dashboard Navigation UI

**Plan ID**: 0004
**Spec Reference**: [0004-dashboard-nav-ui.md](../specs/0003-dashboard-nav-ui.md)
**Status**: Ready for Implementation
**Author**: Claude (with human guidance)
**Date**: 2025-12-02

## Overview

Implement a left navigation bar UI for the architect dashboard, replacing the current side-by-side grid layout. This provides better scalability and introduces utility terminals for ad-hoc tasks.

## Implementation Phases

### Phase 1: Dashboard HTML Refactor

**Goal**: Convert current grid layout to nav + main content area

**Files to modify**:
- `codev/templates/dashboard.html`
- `codev-skeleton/templates/dashboard.html`

**Changes**:

1. **New HTML structure**:
```html
<div class="container">
  <nav class="sidebar">
    <!-- Nav sections -->
  </nav>
  <main class="content">
    <iframe id="terminal-frame"></iframe>
  </main>
</div>
```

2. **CSS for layout**:
   - Fixed 200px sidebar
   - Flex layout for container
   - Full-height main content area
   - Nav item hover/active states

3. **JavaScript state**:
```javascript
const state = {
  architectPort: 7680,
  builders: [],
  utils: [],
  selectedTerminal: { type: 'architect', id: null }
};
```

4. **Navigation rendering**:
   - ARCHITECT section (always first)
   - BUILDERS section (dynamic list)
   - UTILS section (with "+ New Util" button)

5. **Terminal switching**:
   - Click handler on nav items
   - Update iframe src to selected terminal port
   - Update active state in nav

**Estimated lines**: ~150 lines HTML/CSS/JS changes

---

### Phase 2: Utility Terminal Support in CLI

**Goal**: Add `architect util` command and util state tracking

**Files to modify**:
- `codev/bin/architect`
- `codev-skeleton/bin/architect`

**New functions**:

1. **`cmd_util()`** - Spawn utility terminal:
```bash
cmd_util() {
    local action="${1:-start}"
    case "$action" in
        start) spawn_util ;;
        stop) stop_util "$2" ;;
        *) spawn_util ;;
    esac
}
```

2. **`spawn_util()`** - Start a new util terminal:
```bash
spawn_util() {
    # Find next available port (7700-7719)
    # Generate util-N name
    # Start ttyd with bash
    # Track in .utils.json
    # Update dashboard
}
```

3. **`stop_util()`** - Stop a utility terminal:
```bash
stop_util() {
    local util_id="$1"
    # Find util by id
    # Kill ttyd process
    # Remove from .utils.json
    # Update dashboard
}
```

4. **Utils state file** (`.utils.json`):
```json
[
  { "id": "util-1", "name": "util-1", "port": 7700, "pid": 12345 },
  { "id": "util-2", "name": "test-runner", "port": 7701, "pid": 12346 }
]
```

5. **Update `update_dashboard()`**:
   - Read utils from `.utils.json`
   - Include utils array in dashboard JavaScript

**New commands**:
```bash
architect util          # Spawn new utility terminal
architect util stop N   # Stop utility terminal N
```

**Estimated lines**: ~80 lines bash

---

### Phase 3: Dashboard JavaScript Enhancements

**Goal**: Implement nav interactions and util management

**Files to modify**:
- `codev/templates/dashboard.html`
- `codev-skeleton/templates/dashboard.html`

**Features**:

1. **Click-to-switch terminals**:
```javascript
function selectTerminal(type, id) {
  state.selectedTerminal = { type, id };
  const port = getPortForTerminal(type, id);
  document.getElementById('terminal-frame').src = `http://localhost:${port}`;
  updateNavActiveStates();
}
```

2. **"+ New Util" button**:
   - Calls server endpoint or spawns via fetch to local CLI wrapper
   - For Phase 3, just show button (actual spawning in Phase 4)

3. **Rename util inline**:
```javascript
function startRename(utilId) {
  // Replace text with input field
  // On blur/enter, save new name
  // Update localStorage and/or .utils.json
}
```

4. **Status dot rendering**:
```javascript
function getStatusDot(type, status) {
  const colors = {
    'architect-active': '#8b5cf6',
    'implementing': '#3b82f6',
    'blocked': '#ef4444',
    'pr-ready': '#22c55e',
    'util': '#6b7280',
    'inactive': '#374151'
  };
  return `<span class="status-dot" style="background:${colors[status]}"></span>`;
}
```

**Estimated lines**: ~100 lines JavaScript

---

### Phase 4: Integration and Polish

**Goal**: Connect all pieces and handle edge cases

**Tasks**:

1. **Dashboard-to-CLI communication** (for "+ New Util"):
   - Option A: Simple HTTP server endpoint in architect
   - Option B: Use localStorage + polling from CLI
   - Option C: Just refresh page and use CLI command separately

   **Decision**: Option C for simplicity - button shows instructions to run `architect util`

2. **Utils persistence**:
   - Create `.utils.json` on first util spawn
   - Load on dashboard render
   - Clean up stale entries on `architect status`

3. **Handle missing terminals**:
   - Gray out nav items for stopped terminals
   - Show "Terminal not running" message in main area

4. **Keyboard shortcuts** (stretch goal):
   - 1-9 to switch terminals
   - Cmd+N for new util

5. **Responsive behavior**:
   - Scrollable nav if many items
   - Min-height on main content

**Files to update**:
- Dashboard templates
- Architect CLI script
- INSTALL.md (document new util command)

**Estimated lines**: ~50 lines

---

## File Summary

| File | Action | Est. Changes |
|------|--------|--------------|
| `codev/templates/dashboard.html` | Major refactor | ~250 lines |
| `codev-skeleton/templates/dashboard.html` | Major refactor | ~250 lines |
| `codev/bin/architect` | Add util support | ~80 lines |
| `codev-skeleton/bin/architect` | Add util support | ~80 lines |
| `INSTALL.md` | Document util command | ~10 lines |

## Dependencies

- ttyd (already required)
- No new dependencies

## Testing Plan

1. **Manual testing**:
   - Start architect, verify nav shows architect terminal
   - Spawn builders, verify they appear in nav
   - Click nav items, verify terminal switching
   - Spawn utils, verify they appear and work
   - Rename utils, verify persistence
   - Stop utils, verify cleanup

2. **Edge cases**:
   - Dashboard with no architect running
   - Dashboard with many builders (10+)
   - Dashboard with many utils (10+)
   - Port conflicts

## Rollout

1. Implement in `codev/templates/` first (local testing)
2. Test all functionality
3. Copy to `codev-skeleton/templates/`
4. Update documentation
5. Commit and push

## Success Criteria

From spec:
1. Nav displays all terminals: Architect, all builders, all utils visible
2. Single-click switching: Click nav item -> terminal loads in main area
3. Status visible at glance: Can see which builders are blocked without clicking
4. Util terminals work: Can spawn/use/stop utility terminals
5. Responsive: Nav collapses or scrolls gracefully if many items

## Open Questions

None - all resolved in spec.

## Notes

- Phase 1 is the most critical - get the layout right first
- Utils can be minimal in Phase 2 - just bash shells
- Rename feature can use localStorage for simplicity (no server needed)
