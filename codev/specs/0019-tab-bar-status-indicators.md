# Specification: Tab Bar Status Indicators

## Metadata
- **ID**: 0019-tab-bar-status-indicators
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: medium

## Problem Statement

The dashboard tab bar shows builder names but no status. The Architect must click each tab to see if a builder is:
- Actively working
- Idle/waiting for input
- Blocked
- Errored
- Complete

This makes monitoring multiple builders inefficient.

## Current State

- Tab bar shows: `Architect | 0007 | 0009 | util`
- No visual status indicators
- Must switch tabs to check status

## Desired State

- Tab bar shows status via color/icon: `Architect | 0007 🟢 | 0009 🟡 | util`
- At-a-glance monitoring of all builders
- Status updates in real-time (or near-real-time)

## Success Criteria

- [ ] Each builder tab shows a status indicator (color dot or icon)
- [ ] Status indicators update within 5 seconds of state change
- [ ] Status meanings are documented/intuitive:
  - 🟢 Green: Working/Active
  - 🟡 Yellow: Idle/Waiting for input
  - 🔴 Red: Error/Blocked
  - ⚪ Gray: Complete/Stopped

## Technical Approach

### Status Detection

Builder status can be inferred from:
1. **State file**: `.agent-farm/state.json` has builder status field
2. **tmux activity**: Check if there's recent output in the pane
3. **Process status**: Check if ttyd/tmux processes are alive

Simplest approach: Use state.json status field, poll every 5s.

### UI Implementation

```html
<div class="tab" data-builder-id="0007">
  <span class="status-dot" data-status="implementing"></span>
  <span class="tab-label">0007</span>
</div>
```

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.status-dot[data-status="spawning"],
.status-dot[data-status="implementing"] { background: #4caf50; } /* Green */

.status-dot[data-status="blocked"] { background: #f44336; } /* Red */

.status-dot[data-status="pr-ready"],
.status-dot[data-status="complete"] { background: #9e9e9e; } /* Gray */
```

### Polling Logic

```javascript
async function updateStatusIndicators() {
  const response = await fetch('/api/status');
  const state = await response.json();

  for (const builder of state.builders) {
    const dot = document.querySelector(`[data-builder-id="${builder.id}"] .status-dot`);
    if (dot) {
      dot.dataset.status = builder.status;
    }
  }
}

// Poll every 5 seconds
setInterval(updateStatusIndicators, 5000);
```

## Scope

### In Scope
- Status dots in tab bar
- Color coding by status
- Polling for updates

### Out of Scope
- Real-time WebSocket updates
- Detailed status tooltip
- Activity detection from terminal output

## Test Scenarios

1. Spawn builder - tab shows green dot
2. Builder blocks - dot turns red
3. Builder completes - dot turns gray
4. Page refresh - status indicators load correctly

## Dependencies

- Dashboard (0007 split-pane)
- Builder state management

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Feedback Incorporated**:
- **Accessibility**: Don't rely solely on red/green colors - add shape differences or tooltips for colorblind users
- Consider event-driven state updates vs polling (polling may lag)
- Debounce updates to prevent flickering

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
