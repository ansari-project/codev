# CLEANUP Protocol

## Overview

CLEANUP is a structured maintenance protocol for systematically removing cruft from codebases. It provides a safe, reversible process for identifying and removing dead code, unused dependencies, stale documentation, and other accumulated technical debt.

**Core Principle**: Safe deletion through soft-delete with easy restoration. All removals are reversible for 30 days.

## When to Use CLEANUP

### Triggers
- After completing a major feature
- Before starting a new development cycle
- When onboarding new team members (clean slate)
- Quarterly maintenance windows
- When build times or test suites become slow
- Before major refactoring efforts

### Skip CLEANUP for
- Active development branches
- Codebases with pending merges
- Emergency production issues
- When tests are failing (fix tests first)

## Scope Definition

CLEANUP operates on specific **categories** of targets. Each audit run should specify which categories to include:

| Category | Description | Examples |
|----------|-------------|----------|
| `dead-code` | Unused functions, imports, unreachable code | Exported functions never imported, dead branches |
| `dependencies` | Unused npm/pip packages | Packages in package.json but never imported |
| `docs` | Stale documentation | References to deleted functions/files |
| `tests` | Orphaned test files, low-ROI tests | Tests for deleted features, flaky tests |
| `temp` | Temporary and build artifacts | `.trash/`, `.consult/`, `dist/`, `node_modules/` |
| `metadata` | Orphaned entries in tracking files | Stale entries in projectlist.md |

**Default scope**: `dead-code`, `dependencies`, `docs`, `tests`

## Protocol Phases

```
AUDIT ──→ PRUNE ──→ VALIDATE ──→ INDEX
         ↓ fail      ↓ fail
      ROLLBACK    ROLLBACK
```

### Prerequisites

Before starting CLEANUP:
- [ ] Git working directory is clean (`git status` shows no changes)
- [ ] All tests are passing
- [ ] No pending merges or PRs in flight
- [ ] Team notified of maintenance window (if applicable)

---

## Phase 1: AUDIT

**Purpose**: Identify what needs cleaning without making any changes.

### Entry Criteria
- Clean git state (no uncommitted changes)
- All tests passing
- Scope categories defined

### Activities

1. **Static Analysis for Dead Code**
   - Identify unused exports
   - Find unreachable code paths
   - Detect unused variables and imports
   - List functions called nowhere

2. **Dependency Analysis**
   - Check package.json for unused npm packages
   - Check requirements.txt/pyproject.toml for unused Python packages
   - Identify outdated dependencies (informational only)

3. **Documentation Audit**
   - Find references to non-existent files
   - Detect references to deleted functions
   - Identify outdated API documentation
   - Check for broken internal links

4. **Test Infrastructure Audit**
   - Identify orphaned test files (tests for deleted features)
   - Find tests with low ROI (flaky tests, trivial tests)
   - Check for orphaned fixtures
   - Verify all tests still pass

5. **Metadata Audit**
   - Scan projectlist.md for completed/orphaned entries
   - Check AGENTS.md/CLAUDE.md for stale references
   - Verify arch.md matches current structure

### Tools and Approaches

For JavaScript/TypeScript:
```bash
# Find unused exports
npx ts-prune

# Find unused dependencies
npx depcheck
```

For Python:
```bash
# Find unused imports
ruff check --select F401

# Find unused dependencies
pip-autoremove --list
```

For general dead code:
```bash
# Find files not imported anywhere
grep -r "import.*from" . | # analyze patterns
```

### Output

Generate audit report: `codev/cleanup/audit-YYYY-MM-DD.md`

Template: `templates/audit-report.md`

### Exit Criteria
- [ ] Audit report generated with all findings
- [ ] Each finding has clear file path and line number
- [ ] Findings organized by category
- [ ] Human has reviewed the audit report

---

## Phase 2: PRUNE

**Purpose**: Remove identified cruft safely with the ability to restore.

### Entry Criteria
- Audit report exists and has been reviewed
- Human has approved items for removal (checkbox in audit report)
- Git state is clean

### Modes

#### Dry Run Mode (DEFAULT)

Always start with dry run to preview changes:

```bash
# The audit report shows what WOULD be deleted
# No files are moved until human confirms
```

The audit report serves as the dry-run preview. Human marks checkboxes to approve specific items.

#### Execution Mode

After human approval, execute the prune:

1. Create timestamped trash directory: `codev/cleanup/.trash/YYYY-MM-DD-HHMM/`
2. Move approved files preserving directory structure
3. Generate `restore.sh` script

### Soft Delete Strategy

Files are moved (not deleted) to preserve the option to restore:

```
Original: src/utils/old-helper.ts
Moved to: codev/cleanup/.trash/2025-12-04-1430/src/utils/old-helper.ts
```

### Restore Script Generation

Automatically generate `restore.sh` in each trash directory:

```bash
#!/bin/bash
# Restore script for cleanup session 2025-12-04-1430
# Generated automatically - run from project root

set -e

echo "Restoring 3 files from cleanup session 2025-12-04-1430..."

mkdir -p "src/utils"
mv "codev/cleanup/.trash/2025-12-04-1430/src/utils/old-helper.ts" "src/utils/old-helper.ts"

mkdir -p "tests"
mv "codev/cleanup/.trash/2025-12-04-1430/tests/old.test.ts" "tests/old.test.ts"

mkdir -p "docs"
mv "codev/cleanup/.trash/2025-12-04-1430/docs/deprecated.md" "docs/deprecated.md"

echo "Restored 3 files successfully"
echo "Don't forget to run tests!"
```

### Dependency Removal

For unused dependencies:
```bash
# npm
npm uninstall <package-name>

# pip (if using requirements.txt)
# Remove line from requirements.txt, then:
pip install -r requirements.txt
```

### Exit Criteria
- [ ] All approved items moved to `.trash/`
- [ ] Directory structure preserved in `.trash/`
- [ ] `restore.sh` generated and executable
- [ ] Changes committed: `[Cleanup] PRUNE: Move N files to .trash/`

---

## Phase 3: VALIDATE

**Purpose**: Ensure nothing broke after pruning.

### Entry Criteria
- PRUNE phase complete
- Changes committed

### Activities

1. **Run Full Test Suite**
   ```bash
   npm test        # or pytest, etc.
   ```

2. **Run Linters**
   ```bash
   npm run lint    # or ruff, eslint, etc.
   ```

3. **Check for Import Errors**
   ```bash
   # TypeScript
   npx tsc --noEmit

   # Python
   python -m py_compile **/*.py
   ```

4. **Verify Build Succeeds**
   ```bash
   npm run build   # or equivalent
   ```

5. **Smoke Test** (if applicable)
   - Start the application
   - Verify core functionality works
   - Check logs for errors

### Rollback on Failure

If VALIDATE fails:

1. Run the restore script:
   ```bash
   ./codev/cleanup/.trash/YYYY-MM-DD-HHMM/restore.sh
   ```

2. Re-run tests to confirm restoration worked

3. Investigate what was incorrectly identified as dead code

4. Update audit report with false positive notes

5. Create follow-up task to fix audit logic

### Exit Criteria
- [ ] All tests pass
- [ ] Linter passes
- [ ] Build succeeds
- [ ] No import/module errors
- [ ] Application starts (if applicable)

---

## Phase 4: INDEX

**Purpose**: Update documentation and tracking files to reflect current state.

### Entry Criteria
- VALIDATE phase passed
- All tests green

### Activities

1. **Update Architecture Documentation**
   - Invoke `architecture-documenter` agent
   - Update `codev/resources/arch.md` with current structure
   - Remove references to deleted code

2. **Sync Documentation Files**
   - Ensure CLAUDE.md and AGENTS.md are in sync
   - Update README if it references deleted features
   - Remove stale API documentation

3. **Update Project Tracking**
   - Update `codev/projectlist.md`:
     - Mark completed projects as `archived`
     - Remove orphaned entries
     - Update status of affected projects

4. **Update Comments**
   - Search for TODO/FIXME comments referencing deleted code
   - Remove or update stale comments

### Exit Criteria
- [ ] arch.md reflects current codebase
- [ ] CLAUDE.md and AGENTS.md are synchronized
- [ ] projectlist.md is accurate
- [ ] No stale references in documentation
- [ ] Final commit: `[Cleanup] INDEX: Update documentation`

---

## Retention Policy

### .trash/ Directory
- Contents kept for **30 days**
- After 30 days, trash directories may be permanently deleted
- Run periodic cleanup: `find codev/cleanup/.trash -mtime +30 -delete`

### Audit Reports
- Kept **indefinitely** in `codev/cleanup/`
- Provides historical record of cleanup activities
- Useful for understanding past decisions

---

## Rollback Strategy

### During PRUNE Phase
If you realize something shouldn't have been moved:
```bash
# Move individual file back
mv "codev/cleanup/.trash/YYYY-MM-DD-HHMM/path/to/file" "path/to/file"
```

### After VALIDATE Fails
```bash
# Full restoration
./codev/cleanup/.trash/YYYY-MM-DD-HHMM/restore.sh

# Then re-run tests
npm test
```

### After INDEX Phase
If you discover an issue after completing cleanup:
1. Check if the file is still in `.trash/`
2. If yes, restore it manually
3. If no (>30 days), recover from git history:
   ```bash
   git checkout HEAD~N -- path/to/file
   ```

---

## Integration Points

### With architecture-documenter
- Called during INDEX phase
- Updates `codev/resources/arch.md`
- Agent location: `.claude/agents/architecture-documenter.md`

### With Agent Farm (requires 0014)
Future integration:
```bash
af spawn --protocol cleanup
```

### Manual Invocation (current)
Run CLEANUP manually by following this protocol document phase by phase.

---

## Commit Messages

Use these commit message patterns:

```
[Cleanup] AUDIT: Generate cleanup audit report
[Cleanup] PRUNE: Move N files to .trash/
[Cleanup] VALIDATE: All tests passing after prune
[Cleanup] INDEX: Update documentation
```

---

## Best Practices

### During AUDIT
- Be thorough but not paranoid
- When in doubt, leave it in (can always clean later)
- Check git blame to understand why code exists
- Consider if code might be used dynamically (reflection, eval)

### During PRUNE
- Always use soft-delete (never `rm -rf`)
- Preserve directory structure in `.trash/`
- Group related files in the same session
- Don't prune and add features in the same commit

### During VALIDATE
- Run the FULL test suite, not just affected tests
- Check CI/CD if available
- Do a manual smoke test for critical paths

### During INDEX
- Let architecture-documenter do heavy lifting
- Review its changes before committing
- Don't forget projectlist.md

---

## Anti-Patterns to Avoid

1. **Aggressive Pruning**: Don't delete everything the audit finds. Review each item.

2. **Skipping VALIDATE**: Always run tests after pruning. "It looked dead" is not validation.

3. **Permanent Deletion**: Never use `rm`. Always soft-delete to `.trash/`.

4. **Pruning During Active Development**: Don't clean up on feature branches.

5. **Not Preserving Paths**: The `.trash/` structure must mirror the original for easy restoration.

6. **Ignoring False Positives**: If audit logic is wrong, fix it. Don't just skip items.

---

## Templates

Templates for CLEANUP artifacts are in `templates/`:
- `audit-report.md` - Audit report template

---

## Protocol Evolution

This protocol can be customized:
1. Add project-specific cleanup categories
2. Integrate with existing CI/CD for validation
3. Add automated scheduling for periodic cleanup
4. Create custom audit tools for your stack
