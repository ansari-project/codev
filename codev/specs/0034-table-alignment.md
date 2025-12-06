# Specification: Table Alignment in Markdown Annotator

## Metadata
- **ID**: 0034-table-alignment
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-06
- **Priority**: low

## Problem Statement

Markdown tables in the annotator are hard to read when columns have varying widths:

```
| Name | Age |
|------|-----|
| Jo | 5 |
| Alexander | 42 |
```

The pipes don't align vertically, making it hard to scan columns.

## Desired State

Auto-pad cells so pipes align across all rows of a table:

```
| Name      | Age |
|-----------|-----|
| Jo        | 5   |
| Alexander | 42  |
```

Key constraint: **Line count must stay the same** - we only add spaces within lines, never change line breaks.

## Scope

### In Scope
- Detect markdown tables (contiguous lines containing `|`)
- Compute column widths across all rows
- Pad cells with spaces to align pipes
- Handle separator rows (`|---|---|`)

### Out of Scope
- Changing line breaks or merging lines
- Syntax highlighting within table cells
- Sorting or filtering tables
- Column resizing UI

## Technical Approach

### Two-Pass Rendering

Current `renderFile()` does single-pass, line-by-line rendering. Tables require two passes:

**Pass 1: Identify tables and compute widths**
```javascript
// Group contiguous lines with | into tables
// For each table, compute max width of each column
const tables = identifyTables(fileLines);
// tables = [{ startLine: 5, endLine: 9, columnWidths: [10, 5, 8] }, ...]
```

**Pass 2: Render with padding**
```javascript
// When rendering a line that's part of a table, pad cells
function renderTableLine(line, tableInfo) {
  const cells = line.split('|');
  const paddedCells = cells.map((cell, i) =>
    cell.padEnd(tableInfo.columnWidths[i])
  );
  return paddedCells.join('|');
}
```

### Table Detection

A table must have:
1. **Header row**: Line with `|` characters
2. **Separator row**: Line matching `/^\|?[\s:|-]+\|?$/` (dashes, colons, pipes)
3. **Contiguous**: No blank lines between rows

This avoids false positives on prose like "Use `foo | bar`".

```javascript
function identifyTables(lines, codeBlockRanges) {
  const tables = [];

  for (let i = 0; i < lines.length - 1; i++) {
    // Skip lines inside code blocks
    if (isInsideCodeBlock(i, codeBlockRanges)) continue;

    const line = lines[i];
    const nextLine = lines[i + 1];

    // Look for header + separator pattern
    if (line.includes('|') && isSeparatorRow(nextLine)) {
      const table = { startLine: i, endLine: i + 1, columns: [] };

      // Extend table to include all following rows with |
      let j = i + 2;
      while (j < lines.length && lines[j].includes('|') && !isInsideCodeBlock(j, codeBlockRanges)) {
        table.endLine = j;
        j++;
      }

      // Compute column widths across all rows
      for (let row = table.startLine; row <= table.endLine; row++) {
        const cells = parseCells(lines[row]);
        cells.forEach((cell, col) => {
          table.columns[col] = Math.max(table.columns[col] || 0, cell.trim().length);
        });
      }

      tables.push(table);
      i = table.endLine; // Skip past this table
    }
  }

  return tables;
}
```

### Code Block Awareness

Reuse the `inCodeBlock` state from 0030's markdown renderer:

```javascript
function findCodeBlockRanges(lines) {
  const ranges = [];
  let start = null;

  lines.forEach((line, i) => {
    if (/^(\s*)(```+|~~~+)/.test(line)) {
      if (start === null) {
        start = i;
      } else {
        ranges.push({ start, end: i });
        start = null;
      }
    }
  });

  return ranges;
}

function isInsideCodeBlock(lineNum, ranges) {
  return ranges.some(r => lineNum >= r.start && lineNum <= r.end);
}
```

### Cell Parsing

Handle edge cases:
- Leading/trailing pipes: `| cell |` vs `cell |`
- Empty cells: `| | data |`
- Escaped pipes: `\|` within cell content

```javascript
function parseCells(line) {
  // Split by | but not \|
  return line.split(/(?<!\\)\|/).map(c => c.trim());
}
```

### Separator Row Handling

The `|---|---|` row should pad dashes while preserving alignment markers:

```javascript
function isSeparatorRow(line) {
  return /^\|?[\s:|-]+\|?$/.test(line) && line.includes('-');
}

function padSeparatorCell(cell, width) {
  const trimmed = cell.trim();
  const leftColon = trimmed.startsWith(':');
  const rightColon = trimmed.endsWith(':');

  // Calculate dash count: width minus colons
  const dashCount = width - (leftColon ? 1 : 0) - (rightColon ? 1 : 0);

  return (leftColon ? ':' : '') + '-'.repeat(Math.max(1, dashCount)) + (rightColon ? ':' : '');
}
```

Examples:
- `---` with width 5 → `-----`
- `:---` with width 5 → `:----`
- `:---:` with width 5 → `:---:`
- `---:` with width 5 → `----:`

## Acceptance Criteria

- [ ] Tables with varying column widths render with aligned pipes
- [ ] Separator rows expand dashes to match column width
- [ ] Line numbers stay synchronized (no line count changes)
- [ ] Non-table content unaffected
- [ ] Tables inside code blocks are NOT processed
- [ ] Performance acceptable for files with many tables

## Test Cases

1. Simple table (2x2)
2. Table with long cell content
3. Table with empty cells
4. Multiple tables in one file
5. Table immediately followed by another table
6. Table inside code block (should NOT be aligned)

## Known Limitations

Per consultant feedback:
- **Inline code with pipes**: `` `foo | bar` `` in a cell may be incorrectly split. Full inline markdown parsing is complex; V1 accepts this limitation.
- **Unicode width**: Emojis and CJK characters may appear misaligned (char count ≠ visual width). Acceptable for V1.
- **Escaped pipes**: `\|` handling is best-effort; complex escaping scenarios may fail.

## Dependencies

- 0030 (Markdown Syntax Highlighting) - provides the custom markdown renderer
