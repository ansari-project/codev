# TICK Plan: Tab Bar Status Indicators

## Metadata
- **ID**: 0019-tab-bar-status-indicators
- **Protocol**: TICK
- **Specification**: codev/specs/0019-tab-bar-status-indicators.md
- **Created**: 2025-12-04
- **Status**: autonomous

## Implementation Approach
Update the dashboard-split.html template to show status indicators on builder tabs. Use the existing polling mechanism and state structure - no server changes needed.

## Implementation Steps

### Step 1: Update CSS Color Variables
**Files**: codev/templates/dashboard-split.html
**Changes**: Replace existing status colors with spec-defined colors:
- Green for active states (spawning, implementing)
- Yellow for waiting (pr-ready)
- Red for blocked
- Gray for complete

### Step 2: Add Accessibility CSS
**Files**: codev/templates/dashboard-split.html
**Changes**:
- Add diamond shape class for blocked status
- Add pulse animation keyframes for attention states
- Apply pulse to waiting and blocked states

### Step 3: Update getStatusDot() Function
**Files**: codev/templates/dashboard-split.html
**Changes**:
- Add status-to-config mapping with color, label, shape, pulse properties
- Generate CSS classes based on status config
- Add title attribute for tooltip
- Add ARIA attributes for screen readers

### Step 4: Update Status Bar Colors
**Files**: codev/templates/dashboard-split.html
**Changes**: Update architect status dot to use new CSS variable names

## Files to Create/Modify

### New Files
None

### Modified Files
- `codev/templates/dashboard-split.html` - CSS and JavaScript updates for status indicators

## Testing Strategy

### Manual Testing
1. Start agent-farm dashboard
2. Spawn a builder and verify green status dot appears
3. Set builder status to blocked and verify red diamond with pulse
4. Set builder status to pr-ready and verify yellow dot with pulse
5. Set builder status to complete and verify gray dot
6. Hover over status dots to see tooltips
7. Verify pulse animation is visible for accessibility

### Automated Tests (if applicable)
None - this is a UI template change

## Success Criteria
- [x] All steps completed
- [x] Status dots show correct colors for each state
- [x] Pulse animation works for waiting/blocked states
- [x] Diamond shape appears for blocked status
- [x] Tooltips show on hover
- [x] No breaking changes to existing dashboard functionality

## Risks
| Risk | If Occurs |
|------|-----------|
| CSS variable renames break other code | Search for old variable names and update all references |
| Pulse animation too distracting | Reduce animation intensity or make it slower |

## Dependencies
- Dashboard (0007 split-pane) - already implemented
- Builder state management - already exists in state.json

## Notes
- Implementation reuses existing polling mechanism (1000ms interval)
- Status is read from state.json which is already populated by agent-farm
- No backend changes required
