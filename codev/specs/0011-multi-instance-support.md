# Specification: Multi-Instance Support

## Metadata
- **ID**: 0011-multi-instance-support
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: medium

## Problem Statement

When running multiple agent-farm instances (one per project), it's hard to distinguish between them:
1. All browser tabs show the same "Agent Farm Dashboard" title
2. No way to see all running instances at a glance
3. Port conflicts can occur if not managed carefully

## Current State

- Dashboard title is generic: "Agent Farm Dashboard"
- Each instance tracks state in its own `.agent-farm/` directory
- Port registry exists at `~/.agent-farm/ports.json` with project isolation
- No meta-view across instances

## Desired State

1. **Directory-aware titles**: Dashboard shows project directory name
   - "Agent Farm - codev" or "Agent Farm - webapp"
2. **Meta-dashboard (optional)**: Single page showing all running instances
3. **Better port management**: Already implemented in 0008

## Success Criteria

- [ ] Dashboard title includes project directory name
- [ ] Browser tab title shows project name
- [ ] (Optional) Meta-dashboard lists all running instances with links

## Technical Approach

### Title Update

Simple change to dashboard HTML template:

```html
<title>Agent Farm - {{PROJECT_NAME}}</title>
<h1>Agent Farm - {{PROJECT_NAME}}</h1>
```

Server injects `PROJECT_NAME` from `path.basename(projectRoot)`.

### Meta-Dashboard (Optional Stretch Goal)

Separate static page that reads `~/.agent-farm/ports.json`:
- Lists all projects with allocated ports
- Links to each dashboard
- Shows basic status (running/stopped)

## Scope

### In Scope
- Directory name in dashboard title
- Title in browser tab

### Out of Scope (or stretch goal)
- Meta-dashboard
- Cross-instance communication

## Test Scenarios

1. Start dashboard in `/foo/bar/project-a` - title shows "Agent Farm - project-a"
2. Start another in `/foo/bar/project-b` - title shows "Agent Farm - project-b"
3. Browser tabs are distinguishable

## Dependencies

- Dashboard server (existing)
- Port registry (0008, already implemented)

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Feedback Incorporated**:
- Handle long paths with truncation (e.g., `.../project-name`)
- Both models confirmed approach is sound - simple, high-value UX fix

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
