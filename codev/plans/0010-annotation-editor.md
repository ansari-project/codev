# Plan: Annotation Editor

## Metadata
- **Spec**: codev/specs/0010-annotation-editor.md
- **Protocol**: TICK
- **Created**: 2025-12-04

## Overview

Add a simple mode toggle to the annotation viewer: **Annotate** (current behavior) vs **Edit** (full file editing via textarea).

## Current State Analysis

The `codev/templates/annotate.html` already has:
- Syntax highlighted code display with Prism.js
- Line numbers with word-wrap handling
- Review comment dialog (click line → add/edit/resolve annotation)
- `fileLines` array holding file content
- `saveFile()` function calling `/save` endpoint
- Auto-save on comment changes

**What's missing**: A way to edit the full file content (not just annotations).

## Implementation Steps

### Step 1: Add Mode Toggle Button to Header

**File**: `codev/templates/annotate.html`

Add an Edit/Annotate toggle button in the header:

```html
<div class="header">
  <h1>Annotation Viewer</h1>
  <div class="path">{{FILE_PATH}}</div>
  <div class="actions">
    <button class="btn btn-primary" id="modeToggle" onclick="toggleMode()">Edit</button>
  </div>
</div>
```

CSS for actions:
```css
.header .actions {
  position: absolute;
  right: 20px;
  top: 15px;
}
```

### Step 2: Add Hidden Textarea for Edit Mode

Add a textarea that's hidden by default, shown when in edit mode:

```html
<textarea id="editor" style="display: none;"></textarea>
```

CSS for editor:
```css
#editor {
  width: 100%;
  height: calc(100vh - 60px);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 15px;
  border: none;
  resize: none;
  background: #1a1a1a;
  color: #d4d4d4;
  display: none;
}
```

### Step 3: Implement toggleMode() Function

```javascript
let editModeActive = false;

function toggleMode() {
  const content = document.querySelector('.content');
  const editor = document.getElementById('editor');
  const toggle = document.getElementById('modeToggle');

  if (!editModeActive) {
    // Enter edit mode
    editor.value = fileLines.join('\n');
    content.style.display = 'none';
    editor.style.display = 'block';
    toggle.textContent = 'Annotate';
    toggle.classList.remove('btn-primary');
    toggle.classList.add('btn-secondary');
    editModeActive = true;
    editor.focus();
  } else {
    // Exit edit mode - save and refresh
    fileLines = editor.value.split('\n');
    saveFile();
    content.style.display = 'flex';
    editor.style.display = 'none';
    toggle.textContent = 'Edit';
    toggle.classList.remove('btn-secondary');
    toggle.classList.add('btn-primary');
    editModeActive = false;
    renderFile();
    updateAnnotationsList();
  }
}
```

### Step 4: Add Keyboard Shortcut (Cmd/Ctrl+S)

Enhance existing keydown handler:

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDialog();
  }
  // Save shortcut in edit mode
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (editModeActive) {
      fileLines = document.getElementById('editor').value.split('\n');
      saveFile();
      showNotification('File saved!');
    }
  }
});
```

### Step 5: Add Save Notification

```javascript
function showNotification(message) {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}
```

CSS:
```css
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  z-index: 300;
}
```

### Step 6: Handle Unsaved Changes Warning (Optional but recommended)

```javascript
let hasUnsavedChanges = false;

// Track changes in edit mode
document.getElementById('editor').addEventListener('input', () => {
  hasUnsavedChanges = true;
});

// Warn before leaving
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges && editModeActive) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

## Files to Modify

| File | Changes |
|------|---------|
| `codev/templates/annotate.html` | Add mode toggle, textarea, JS logic, CSS |

## Testing Checklist

- [ ] Edit button visible in header
- [ ] Click Edit → textarea appears, code hides
- [ ] Edit text in textarea
- [ ] Click Annotate → code reappears with changes, syntax highlighted
- [ ] Changes persisted (refresh page, changes still there)
- [ ] Cmd+S saves file in edit mode
- [ ] Notification shows on save
- [ ] Line numbers still work after returning to annotate mode
- [ ] Annotations still work after editing

## Risks

| Risk | Mitigation |
|------|------------|
| Large file slow to edit | Accept for v1; add warning if file > 100KB in future |
| Lost scroll position on mode switch | Accept for v1; can sync scrollTop later |

## Simplifications from Spec

The spec included some features we're deferring:
- ~~Cancel button~~ - Just click Annotate to exit (saves on exit)
- ~~Unsaved indicator~~ - Simplified to just beforeunload warning
- ~~Tab key handling~~ - Use native behavior for now

This keeps the implementation minimal per user's request for "super simple".

## Estimated Complexity

~50 lines of JS + ~30 lines of CSS. Single file change. TICK-appropriate.
