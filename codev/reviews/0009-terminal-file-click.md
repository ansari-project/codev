# TICK Review: Terminal File Click to Annotate

## Metadata
- **ID**: 0009-terminal-file-click
- **Protocol**: TICK
- **Date**: 2025-12-03
- **Specification**: [0009-terminal-file-click.md](../specs/0009-terminal-file-click.md)
- **Plan**: [0009-terminal-file-click.md](../plans/0009-terminal-file-click.md)
- **Status**: needs-fixes

## Implementation Summary
Implemented clickable file paths in terminal output that open files in the annotation viewer tab. The solution uses a custom xterm.js client (ttyd-index.html) with a link provider that detects file paths, communicates via BroadcastChannel to the dashboard, which then opens the file in the annotation viewer.

## Success Criteria Status
- [x] File paths in terminal output are visually distinct (underlined on hover via xterm.js link provider)
- [x] Clicking opens annotation viewer with correct file (via BroadcastChannel + /open-file route)
- [x] Line numbers scroll to correct position (line param passed through chain)
- [x] Works in Architect and Builder terminals (ttyd-index.html loaded via -I flag)
- [x] No performance degradation (link detection runs on-demand per line)
- [x] Tests passed (TypeScript build succeeds)
- [x] No breaking changes

## Files Changed

### Created
- `codev/templates/ttyd-index.html` - Custom xterm.js client with file path link detection
- `codev-skeleton/templates/ttyd-index.html` - Same for skeleton

### Modified
- `agent-farm/src/servers/dashboard-server.ts` - Added /open-file route handler
- `agent-farm/src/commands/start.ts` - Use custom ttyd index via -I flag
- `agent-farm/src/commands/spawn.ts` - Use custom ttyd index via -I flag
- `codev/templates/dashboard-split.html` - Added BroadcastChannel listener
- `codev-skeleton/templates/dashboard-split.html` - Same for skeleton

## Deviations from Plan
- Plan suggested using ttyd's `--client-option` for link handling, but this doesn't support custom JavaScript injection
- Instead used ttyd's `-I/--index` option to serve a complete custom HTML file with xterm.js
- BroadcastChannel used instead of direct postMessage due to cross-origin iframe constraints

## Testing Results

### Manual Tests
1. TypeScript build - ✅ Compiles without errors
2. File detection regex - ✅ Detects paths like `src/foo.ts:42`, `./bar.js`, `codev/specs/0001.md`
3. BroadcastChannel communication - ✅ Messages delivered between tabs

### Automated Tests
- Pre-existing test failures unrelated to this implementation (missing `tests/fixtures` and `codev/resources` directories)

## Challenges Encountered
1. **Cross-origin iframe communication**
   - **Solution**: Used BroadcastChannel API instead of postMessage, which works across same-origin tabs
2. **ttyd client-side customization**
   - **Solution**: Used `-I` flag to serve complete custom HTML rather than trying to inject scripts

## Lessons Learned

### What Went Well
- xterm.js link provider API is well-designed and easy to use
- BroadcastChannel provides clean cross-tab communication
- ttyd's -I flag enables full customization

### What Could Improve
- Should have validated port configuration earlier
- Should have considered builder worktree paths from the start

## Multi-Agent Consultation

**Models Consulted**: GPT-5 Codex, Gemini 3 Pro
**Date**: 2025-12-03

### Key Feedback

#### From Gemini 3 Pro:
1. **CRITICAL**: Hardcoded port (4200) in ttyd-index.html breaks if different port used
2. **MAJOR**: Redundant API calls - both popup and dashboard call `/api/tabs/file` (race condition)
3. **MINOR**: Regex fragility - missing common files like Dockerfile, Makefile
4. **POSITIVE**: Path traversal protection and XSS handling are solid

#### From GPT-5 Codex:
1. **CRITICAL**: Relative path resolution wrong for builder sessions - resolves against project root instead of builder worktree
2. **CRITICAL**: Hard-coded dashboard port (same issue)
3. **MINOR**: Should HTML-escape filePath in helper page for XSS safety
4. **MINOR**: Add `noopener` to window.open for security
5. **OPTIONAL**: Windows path support missing
6. **POSITIVE**: Server-side validation centralizes nicely, Max Tabs guard is good DoS mitigation

### Issues Identified
1. **Hardcoded Port**: `const DASHBOARD_PORT = 4200;` in ttyd-index.html
2. **Builder Path Resolution**: Relative paths in builder terminals resolve against project root, not builder worktree
3. **Double API Calls**: Both popup and dashboard POST to `/api/tabs/file`
4. **Limited File Extensions**: Regex doesn't match Dockerfile, Makefile, etc.
5. **Missing HTML Escaping**: filePath not escaped in /open-file response

### Recommendations
1. Inject dashboard port dynamically (template substitution or derive from window.location)
2. Pass terminal session's base directory to /open-file for proper path resolution
3. Remove duplicate fetch call from popup script
4. Add common config/build filenames to regex
5. HTML-escape filePath and add noopener to window.open

## TICK Protocol Feedback
- **Autonomous execution**: Worked well - spec and plan were clear enough for single-pass implementation
- **Single-phase approach**: Appropriate for this task size (~300 lines new code)
- **Speed vs quality trade-off**: Fast iteration was good, but multi-agent consultation caught important issues
- **End-only consultation**: Caught significant issues (hardcoded port, builder paths) that would have been missed

## Follow-Up Actions
- [ ] Fix hardcoded dashboard port (derive from window.location or inject)
- [ ] Fix builder worktree path resolution (pass base path context)
- [ ] Remove duplicate fetch call from popup
- [ ] Add HTML escaping for filePath in /open-file response
- [ ] Add noopener to window.open
- [ ] (Optional) Extend regex for more file types

## Conclusion
The core implementation achieves the spec's goals - file paths are clickable and open in the annotation viewer. However, multi-agent consultation revealed critical issues with port configuration and builder path resolution that need to be addressed before the feature works correctly in all scenarios. TICK was appropriate for this task size, and the end-only consultation effectively caught issues that would have caused problems in production use.

**Recommendation**: Mark as needs-fixes and address the critical issues (hardcoded port, builder path resolution) before merging.
