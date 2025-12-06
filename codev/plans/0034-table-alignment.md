# Plan: Table Alignment in Markdown Annotator

## Metadata
- **Spec**: codev/specs/0034-table-alignment.md
- **Protocol**: TICK
- **Estimated Complexity**: Medium (~150 lines)

## Implementation Steps

### Step 1: Add helper functions

Add to `agent-farm/templates/annotate.html` after `renderMarkdownLine()`:

```javascript
// Find code block ranges to exclude from table processing
function findCodeBlockRanges(lines) { ... }

// Check if line is inside a code block
function isInsideCodeBlock(lineNum, ranges) { ... }

// Check if line is a table separator row
function isSeparatorRow(line) { ... }

// Parse cells from a table row
function parseTableCells(line) { ... }

// Pad a separator cell preserving alignment markers
function padSeparatorCell(cell, width) { ... }

// Pad a regular cell to target width
function padCell(cell, width) { ... }

// Identify tables in the document
function identifyTables(lines, codeBlockRanges) { ... }

// Render a table row with padded cells
function renderTableRow(line, columnWidths, isSeparator) { ... }
```

### Step 2: Modify renderFile()

Update `renderFile()` to:
1. Find code block ranges (first pass)
2. Identify tables and compute column widths (first pass)
3. Render lines, applying table padding where needed (second pass)

```javascript
function renderFile() {
  const isMarkdown = lang === 'markdown' || lang === 'md';

  if (isMarkdown) {
    resetMarkdownState();
    const codeBlockRanges = findCodeBlockRanges(fileLines);
    const tables = identifyTables(fileLines, codeBlockRanges);
    // ... render with table awareness
  }
  // ... rest of rendering
}
```

### Step 3: Create lookup for table membership

```javascript
// Build a map: lineNumber -> tableInfo (or null)
function buildTableMap(tables) {
  const map = new Map();
  for (const table of tables) {
    for (let i = table.startLine; i <= table.endLine; i++) {
      map.set(i, table);
    }
  }
  return map;
}
```

### Step 4: Update line rendering

In the `fileLines.map()` loop, check if line is part of a table:

```javascript
const highlightedLines = fileLines.map((line, i) => {
  if (isMarkdown) {
    const tableInfo = tableMap.get(i);
    if (tableInfo) {
      const isSep = isSeparatorRow(line);
      const paddedLine = renderTableRow(line, tableInfo.columns, isSep);
      return renderMarkdownLine(paddedLine); // Then apply markdown styling
    }
    return renderMarkdownLine(line);
  }
  return Prism.highlight(line, prismLang, lang);
});
```

## Test Plan

1. **Simple table**: Verify pipes align
2. **Table with alignment markers**: `:---:` preserved
3. **Table in code block**: NOT processed
4. **Multiple tables**: Each aligned independently
5. **Non-table with pipes**: Not affected (prose like "A | B")
6. **Empty cells**: Handled correctly

## Files Modified

- `agent-farm/templates/annotate.html` - Add table alignment logic

## Rollback

If issues arise, the table alignment can be disabled by:
1. Removing the `identifyTables()` call
2. Removing the `tableMap.get(i)` check in rendering

The underlying markdown rendering from 0030 remains unchanged.
