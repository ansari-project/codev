# Plan: Multi-Instance Support

## Metadata
- **Spec**: codev/specs/0011-multi-instance-support.md
- **Protocol**: TICK
- **Created**: 2025-12-04

## Implementation Overview

This is a simple UX improvement to show the project directory name in the dashboard title, making it easier to distinguish between multiple agent-farm instances running in different browser tabs.

## Implementation Steps

### Step 1: Update Dashboard HTML Template

**File**: `codev/templates/dashboard-split.html`

1. Change the `<title>` tag to include a placeholder:
   ```html
   <title>Agent Farm - {{PROJECT_NAME}}</title>
   ```

2. Change the `<h1>` tag in the header to include the same placeholder:
   ```html
   <h1>Agent Farm - {{PROJECT_NAME}}</h1>
   ```

### Step 2: Update Dashboard Server

**File**: `agent-farm/src/servers/dashboard-server.ts`

1. Get the project name from the project root path:
   ```typescript
   const projectName = path.basename(projectRoot);
   ```

2. Add template substitution for the project name when serving the dashboard (around line 896):
   ```typescript
   // Inject project name into template
   template = template.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
   ```

3. Handle long path truncation as recommended by experts:
   - If project name is very long, truncate with ellipsis
   - Example: A 50+ character name becomes "...project-name"

### Step 3: Update codev-skeleton Template

**File**: `codev-skeleton/templates/dashboard-split.html`

Same changes as Step 1 - this is the template used when codev is installed in other projects.

### Step 4: Update Legacy Dashboard Template (if exists)

**File**: `codev/templates/dashboard.html` (if it exists and is still used)

Same changes as Step 1 for backwards compatibility with any remaining references.

## Testing

1. Start dashboard: `./codev/bin/agent-farm start`
2. Open browser to dashboard URL
3. Verify:
   - Browser tab shows "Agent Farm - codev" (or current directory name)
   - Page header shows "Agent Farm - codev"
4. Stop dashboard

## Files Modified

1. `codev/templates/dashboard-split.html` - Add PROJECT_NAME placeholder
2. `codev/templates/dashboard.html` - Add PROJECT_NAME placeholder (legacy)
3. `codev-skeleton/templates/dashboard-split.html` - Add PROJECT_NAME placeholder
4. `codev-skeleton/templates/dashboard.html` - Add PROJECT_NAME placeholder (legacy)
5. `agent-farm/src/servers/dashboard-server.ts` - Inject project name

## Estimated Effort

- Template changes: ~5 minutes
- Server changes: ~10 minutes
- Testing: ~5 minutes
- Total: ~20 minutes

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Long project names break layout | Truncate to reasonable length (30 chars) |
| Special characters in directory name | HTML escape the project name |
| Template placeholder conflicts | Use distinctive placeholder format `{{PROJECT_NAME}}` |
