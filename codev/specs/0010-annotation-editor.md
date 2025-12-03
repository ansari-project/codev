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

- "Edit" button in the annotation viewer header
- Clicking "Edit" enables inline editing of the file content
- "Save" button appears when in edit mode
- "Cancel" button to discard changes
- Syntax highlighting preserved during editing (if possible)
- Visual indication of unsaved changes
- Keyboard shortcut (Cmd/Ctrl+S) to save

## Scope

### In Scope
- Edit button toggle
- Basic text editing in a `<textarea>` or editable `<pre>` element
- Save button that calls `/save` endpoint
- Cancel button to revert changes
- Unsaved changes indicator
- Keyboard shortcuts

### Out of Scope
- Full IDE features (autocomplete, linting, multi-cursor)
- Diff view
- Version history
- Collaborative editing
- File tree navigation

## Success Criteria

- [ ] Edit button visible in annotation viewer header
- [ ] Clicking Edit enables text editing
- [ ] Save button calls `/save` endpoint successfully
- [ ] Cancel button reverts to original content
- [ ] Visual indicator shows unsaved changes
- [ ] Cmd/Ctrl+S saves the file
- [ ] Works for files of reasonable size (<1MB)
- [ ] Error handling for save failures

## Technical Approach

### Option A: Textarea Swap (Recommended)

Replace the Prism-highlighted `<pre><code>` with a `<textarea>` when editing.

```javascript
function toggleEdit() {
  if (editMode) {
    // Switch back to view mode
    const code = document.getElementById('code');
    code.innerHTML = Prism.highlight(editor.value, Prism.languages[lang], lang);
    editor.style.display = 'none';
    code.style.display = 'block';
    editMode = false;
  } else {
    // Switch to edit mode
    const code = document.getElementById('code');
    editor.value = currentContent;
    editor.style.display = 'block';
    code.style.display = 'none';
    editMode = true;
  }
}
```

**Pros**:
- Simple implementation
- Native browser editing
- Works reliably

**Cons**:
- Loses syntax highlighting while editing
- Basic editing experience

### Option B: ContentEditable

Make the `<code>` element contenteditable.

**Pros**:
- Preserves syntax highlighting (maybe)

**Cons**:
- ContentEditable is notoriously buggy
- Syntax highlighting breaks on edit
- Harder to get raw text

### Option C: Monaco Editor

Embed Monaco (VS Code's editor).

**Pros**:
- Full IDE experience
- Syntax highlighting while editing

**Cons**:
- Heavy dependency (~2MB)
- Overkill for simple edits
- Complex integration

### Recommended: Option A

Simple textarea swap is the best balance of functionality and complexity for a "quick edit" feature.

## Technical Design

### UI Changes to annotate.html

```html
<!-- Header buttons -->
<div class="header">
  <span class="file-path">{{FILE_PATH}}</span>
  <div class="buttons">
    <button id="editBtn" onclick="toggleEdit()">Edit</button>
    <button id="saveBtn" onclick="save()" style="display: none;">Save</button>
    <button id="cancelBtn" onclick="cancel()" style="display: none;">Cancel</button>
  </div>
</div>

<!-- Indicator for unsaved changes -->
<span id="unsavedIndicator" style="display: none;">Unsaved changes</span>

<!-- Hidden textarea for editing -->
<textarea id="editor" style="display: none;"></textarea>
```

### JavaScript Logic

```javascript
let editMode = false;
let originalContent = '';
let hasUnsavedChanges = false;

function toggleEdit() {
  const code = document.getElementById('code');
  const editor = document.getElementById('editor');
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  if (!editMode) {
    // Enter edit mode
    originalContent = currentContent;
    editor.value = currentContent;
    editor.style.display = 'block';
    code.style.display = 'none';
    editBtn.textContent = 'View';
    saveBtn.style.display = 'inline';
    cancelBtn.style.display = 'inline';
    editMode = true;
    editor.focus();
  } else {
    // Exit edit mode (view)
    currentContent = editor.value;
    code.textContent = currentContent;
    Prism.highlightElement(code);
    editor.style.display = 'none';
    code.style.display = 'block';
    editBtn.textContent = 'Edit';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    editMode = false;
  }
}

async function save() {
  const editor = document.getElementById('editor');
  const content = editor.value;

  try {
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filePath, content }),
    });

    if (response.ok) {
      currentContent = content;
      hasUnsavedChanges = false;
      updateUnsavedIndicator();
      showNotification('File saved!');
    } else {
      throw new Error('Save failed');
    }
  } catch (err) {
    showNotification('Error saving file: ' + err.message, 'error');
  }
}

function cancel() {
  const editor = document.getElementById('editor');
  editor.value = originalContent;
  currentContent = originalContent;
  hasUnsavedChanges = false;
  updateUnsavedIndicator();
  toggleEdit(); // Back to view mode
}

// Track unsaved changes
document.getElementById('editor').addEventListener('input', () => {
  hasUnsavedChanges = true;
  updateUnsavedIndicator();
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (editMode) {
      save();
    }
  }
});

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

### CSS Additions

```css
#editor {
  width: 100%;
  height: calc(100vh - 60px);
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 1em;
  border: none;
  resize: none;
  background: #1e1e1e;
  color: #d4d4d4;
}

#unsavedIndicator {
  color: #ffa500;
  font-size: 12px;
  margin-left: 10px;
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
}

.notification.error {
  background: #f44336;
}
```

## Test Scenarios

1. Click Edit - textarea appears, code hides
2. Click View (in edit mode) - code appears, textarea hides
3. Type in textarea - unsaved indicator appears
4. Click Save - file saved, indicator clears
5. Click Cancel - reverts to original, exits edit mode
6. Press Cmd+S - saves file
7. Close tab with unsaved changes - browser warns
8. Edit mode with large file (~100KB) - no performance issues

## Dependencies

- Existing annotate-server.ts `/save` endpoint
- Existing annotate.html template

## UX Considerations (from consultation)

1. **Scroll Position Sync**: Capture `scrollTop` before swap, apply to textarea (and vice versa on save)
2. **Tab Key Handling**: Intercept Tab to insert spaces/tab instead of moving focus
3. **Visual Continuity**: Match textarea font-family, font-size, line-height to Prism theme
4. **Line Numbers**: Accept horizontal shift when gutter disappears (or add matching padding-left)
5. **Focus After Save**: Return focus to code block so keyboard users can resume scrolling

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large file editing slow | Medium | Add warning for files >100KB |
| Save fails silently | High | Clear error notifications |
| Lost work on browser crash | Medium | Browser's beforeunload warning |
| CRLF/LF normalization | Medium | Detect original line endings, preserve on save |
| Concurrent edits overwrite | Medium | Send last-modified timestamp, reject if file changed |
| HTML entities in content | Low | Ensure using raw text, not HTML-escaped Prism output |

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Sections Updated**:
- **UX Considerations**: Added scroll sync, tab handling, visual continuity, line numbers, focus management per both models
- **Risks**: Added CRLF normalization, concurrent edits, HTML entities per both models

Both models confirmed textarea swap is the right approach for "quick edit" scope. Avoid ContentEditable (buggy) and Monaco (overkill).

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
- [ ] Expert AI Consultation Complete
