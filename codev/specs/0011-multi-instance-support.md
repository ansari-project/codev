# Specification: Multi-Instance Support

## Metadata
- **ID**: 0011-multi-instance-support
- **Protocol**: TICK
- **Status**: integrated
- **Created**: 2025-12-03
- **Priority**: medium

## Problem Statement

When running multiple agent-farm instances (one per project), all browser tabs show the same "Agent Farm Dashboard" title, making it hard to distinguish between them.

## Solution

Directory-aware titles: Dashboard shows "Agent Farm - projectName" format in both the browser tab and page header.

## Success Criteria

- [x] Dashboard title shows project name
- [x] Browser tab title shows project name
- [x] Long project names are truncated appropriately

## Implementation

Server injects `PROJECT_NAME` from `path.basename(projectRoot)` into the HTML template:

```html
<title>Agent Farm - {{PROJECT_NAME}}</title>
<h1>Agent Farm - {{PROJECT_NAME}}</h1>
```

## Files Modified

- `codev/templates/dashboard-split.html` - Added PROJECT_NAME placeholder
- `codev-skeleton/templates/dashboard-split.html` - Added PROJECT_NAME placeholder
- `agent-farm/src/servers/dashboard-server.ts` - Inject project name with HTML escaping

## Dependencies

- Dashboard server (existing)

## Expert Consultation

**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 3 Pro
**Feedback Incorporated**:
- Handle long paths with truncation
- Both models confirmed approach is sound

## Notes

Meta-dashboard feature was split out to separate spec (0029).
