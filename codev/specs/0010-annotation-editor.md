# Specification: Annotation Editor

## Metadata
- **ID**: 0010-annotation-editor
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: medium

## Problem Statement

The annotation viewer currently displays files in read-only mode with syntax highlighting. While the backend (`annotate-server.ts`) already supports saving files via a `/save` endpoint, there's no UI to edit files.

Users often want to make quick edits (fix typos, adjust comments, tweak configurations) while reviewing code. Having to switch to a separate editor breaks the flow.

## Current State

- Annotation viewer shows files with syntax highlighting (Prism.js)
- Line numbers are displayed
- Server has `/save` endpoint ready (lines 115-139 in `annotate-server.ts`)
- No edit button or editable mode in the UI
- Template is at `codev/templates/annotate.html`

## Desired State

- Single "Edit/Annotate" toggle button in header
- Clicking toggles between annotate mode (current) and edit mode (textarea)
- Edit mode: full file visible in textarea, can edit freely
- Switching back to annotate mode saves and re-renders
- Cmd/Ctrl+S saves while in edit mode

## Scope

### In Scope
- Mode toggle button (Edit ↔ Annotate)
- Textarea for full-file editing
- Auto-save on mode switch
- Cmd+S keyboard shortcut

### Out of Scope
- Cancel/revert functionality
- Unsaved changes indicator
- Syntax highlighting while editing
- Full IDE features

## Success Criteria

- [ ] Toggle button visible in annotation viewer header
- [ ] Click Edit → textarea appears with file content
- [ ] Edit text, click Annotate → changes saved, code re-renders
- [ ] Cmd/Ctrl+S saves in edit mode
- [ ] Annotations still work after editing

## Technical Approach

**Textarea swap**: Hide the code view, show a textarea. On switch back, save and re-render.

- Simple, reliable
- Loses syntax highlighting while editing (acceptable for quick edits)
- Existing `saveFile()` and `fileLines` array already in place

## Dependencies

- `codev/templates/annotate.html` - the annotation viewer template
- `/save` endpoint in annotate-server.ts (already exists)
