# Specification: Markdown Syntax Highlighting in Annotator

## Metadata
- **ID**: 0030-markdown-syntax-highlighting
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-06
- **Priority**: low

## Problem Statement

Markdown files in the annotation viewer render as plaintext, making specs, plans, and documentation hard to read. The Prism markdown component is already loaded but explicitly disabled:

```javascript
// NOTE: For markdown, Prism's highlighting can insert newlines, so we use plaintext
const useHighlighting = lang !== 'markdown';
```

The concern is that Prism's markdown highlighting can insert newlines that break line-number synchronization. However, this concern is overblown—testing shows Prism's inline highlighting works fine for markdown.

## Current State

- `prism-markdown.min.js` is loaded but not used
- Markdown files render as monospace plaintext
- No visual distinction between headers, code, lists, links
- Specs and plans are the primary files reviewed, yet they're the hardest to read

## Desired State

- Markdown files get syntax highlighting like other file types
- Headers, code blocks, lists, links, bold/italic are visually distinct
- Line numbers remain synchronized with content
- Annotation functionality continues to work

## Scope

### In Scope
- Enable Prism markdown highlighting
- Test with real spec/plan files to verify no line sync issues
- Adjust CSS if needed for readability

### Out of Scope
- Full markdown rendering (like GitHub's preview)
- Live preview toggle
- Embedded image rendering

## Technical Approach

### ❌ Approach 1: Remove markdown exception (TESTED - FAILED)

Removing the `lang !== 'markdown'` check causes Prism to insert line breaks around `**` tokens, breaking the display. Even with per-line highlighting, Prism's markdown grammar outputs HTML that creates visual line breaks.

**Evidence**: Tested 2025-12-06. `**ID**:` was split across 3 lines.

### ❌ Approach 2: CSS override (TESTED - FAILED)

```css
.language-markdown .token { display: inline !important; }
```

Didn't help. Prism inserts actual newline characters in the output string, not just block-level elements.

**Evidence**: Tested 2025-12-06. Links and bold text still split across lines.

### ✅ Approach 3: Hybrid "Styled Source" (IMPLEMENTED)

Per Gemini's recommendation: syntax stays visible but muted, content gets semantic styling.

```javascript
// Example: **bold** renders as:
// <span class="md-syntax">**</span><span class="md-bold">bold</span><span class="md-syntax">**</span>
```

**What it does:**
- `#` muted gray, header text large/purple
- `**` muted gray, content bold/yellow
- Backticks muted, code red with background
- `[text](url)` - brackets muted, text blue underlined
- Code blocks tracked with state across lines

**Pros:**
- Visually meaningful without hiding source
- No position drift (all characters present)
- 1:1 line mapping trivially preserved
- Monospace keeps tables aligned

**Known limitations:**
- `~~~` fences not handled (uses ``` only)
- 4-space indented code not detected
- Complex nesting may not render perfectly

## Acceptance Criteria

- [ ] Markdown files show syntax highlighting (headers in different color, code in backticks highlighted, etc.)
- [ ] Line numbers stay synchronized (no offset issues)
- [ ] Annotations can be added to markdown files (unchanged behavior)
- [ ] No visual regressions for other file types

## Test Files

Test with these existing files:
- `codev/specs/0010-annotation-editor.md` - Has headers, code blocks, lists
- `codev/plans/0010-annotation-editor.md` - Has technical content
- `README.md` - Has various markdown elements

## Risk Assessment

**Low risk**. If it doesn't work:
1. We immediately see the problem (line number sync issues)
2. We can revert the one-line change
3. Alternative: use a different highlighting approach for markdown only

## Known Limitations

**Fenced code blocks won't get language-specific highlighting**. Since each line is highlighted independently, a line inside ` ```js ` won't be recognized as JavaScript—it'll render as generic markdown. This is acceptable because:
- Headers, bold, italic, links, lists all work
- The primary use case is reading specs/plans (prose-heavy)
- Full language-aware code block highlighting would require two-pass rendering

## Dependencies

- `codev/templates/annotate.html` (now at `agent-farm/templates/annotate.html`)
- Prism.js markdown component (already loaded)
