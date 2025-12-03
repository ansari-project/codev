# Specification: Hide tmux Status Bar

## Metadata
- **ID**: 0012-hide-tmux-status-bar
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: low

## Problem Statement

The tmux status bar at the bottom of each terminal adds visual noise to the dashboard. Since the dashboard already has its own tab bar and navigation, the tmux status bar is redundant and wastes vertical space.

## Current State

- tmux sessions show green status bar at bottom
- Shows: `[session-name] 0:bash* ...`
- Takes ~20px of vertical space
- Redundant with dashboard tab bar

## Desired State

- tmux status bar hidden in dashboard terminals
- Clean, full-height terminal display
- More screen space for actual content

## Success Criteria

- [ ] tmux status bar not visible in Architect terminal
- [ ] tmux status bar not visible in Builder terminals
- [ ] tmux status bar not visible in Util terminals
- [ ] No functional loss (session info available via dashboard)

## Technical Approach

### Option A: tmux Configuration (Recommended)

Set `status off` when creating sessions:

```bash
# In spawn.ts / start.ts
tmux new-session -d -s "session-name" -x 200 -y 50
tmux set-option -t "session-name" status off
```

Or in a single command:
```bash
tmux new-session -d -s "session-name" \; set-option status off
```

### Option B: Global tmux.conf

Create `.agent-farm/tmux.conf`:
```
set -g status off
```

Load with: `tmux -f .agent-farm/tmux.conf new-session ...`

### Recommended: Option A

Per-session configuration is simpler and doesn't affect user's global tmux settings.

## Implementation

Update `spawn.ts`, `start.ts`, and `util.ts` where tmux sessions are created:

```typescript
// After creating session
await run(`tmux set-option -t "${sessionName}" status off`);
```

## Test Scenarios

1. Start architect - no status bar visible
2. Spawn builder - no status bar visible
3. Open util shell - no status bar visible
4. User's other tmux sessions unaffected

## Dependencies

- Existing tmux session creation code

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users expect status bar | Low | Document the change |
| Some tmux versions differ | Low | Test on common versions |

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Feedback Incorporated**:
- Add toggle mechanism or keybinding to temporarily reveal status bar for debugging
- Consider making it configurable (some power users may want it)
- Ensure dashboard captures all relevant info that status bar would show

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
