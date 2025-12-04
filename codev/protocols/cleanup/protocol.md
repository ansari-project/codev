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
AUDIT ──→ PRUNE ──→ VALIDATE ──→ SYNC
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

**Use git for tracked files** (preferred):
Git itself provides soft-delete - files can be restored from history at any time.

```bash
# Remove tracked files (they remain in git history)
git rm src/utils/old-helper.ts
git rm tests/old.test.ts

# Commit the removal
git commit -m "[Cleanup] PRUNE: Remove 2 dead code files"

# If needed later, restore from history
git checkout HEAD~1 -- src/utils/old-helper.ts
```

**Use `.trash/` for untracked files only**:
Untracked files (build artifacts, generated files, temp files) have no git history, so move them to `.trash/` for potential recovery:

```
Original: dist/old-bundle.js (untracked)
Moved to: codev/cleanup/.trash/2025-12-04-1430/dist/old-bundle.js
```

### Restore Script Generation

For untracked files moved to `.trash/`, generate `restore.sh`:

```bash
#!/bin/bash
# Restore script for cleanup session 2025-12-04-1430
# For UNTRACKED files only - tracked files use git restore
# Run from project root

set -e

echo "Restoring 2 untracked files from cleanup session 2025-12-04-1430..."

mkdir -p "dist"
mv "codev/cleanup/.trash/2025-12-04-1430/dist/old-bundle.js" "dist/old-bundle.js"

mkdir -p "tmp"
mv "codev/cleanup/.trash/2025-12-04-1430/tmp/cache.json" "tmp/cache.json"

echo "Restored 2 files successfully"
echo "For tracked files, use: git checkout HEAD~N -- path/to/file"
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
- [ ] Tracked files removed via `git rm` and committed
- [ ] Untracked files moved to `.trash/` with directory structure preserved
- [ ] `restore.sh` generated for untracked files (if any)
- [ ] Changes committed: `[Cleanup] PRUNE: Remove N files`

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

1. **For tracked files** (most common):
   ```bash
   # Revert the git rm commit
   git revert HEAD

   # Or restore specific files
   git checkout HEAD~1 -- src/utils/old-helper.ts
   ```

2. **For untracked files** (if any were moved to .trash/):
   ```bash
   ./codev/cleanup/.trash/YYYY-MM-DD-HHMM/restore.sh
   ```

3. Re-run tests to confirm restoration worked

4. Investigate what was incorrectly identified as dead code

5. Update audit report with false positive notes

6. Create follow-up task to fix audit logic

### Exit Criteria
- [ ] All tests pass
- [ ] Linter passes
- [ ] Build succeeds
- [ ] No import/module errors
- [ ] Application starts (if applicable)

---

## Phase 4: SYNC

**Purpose**: Synchronize documentation and tracking files with the current codebase state.

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
- [ ] Final commit: `[Cleanup] SYNC: Update documentation`

---

## Retention Policy

### .trash/ Directory
- **Not version-controlled** (gitignored)
- Contents kept locally for **30 days**
- After 30 days, trash directories may be permanently deleted
- Before deleting, preview first:
  ```bash
  # Preview what will be deleted
  find codev/cleanup/.trash -mtime +30 -print

  # If safe, delete
  find codev/cleanup/.trash -mtime +30 -delete
  ```

### Audit Reports
- **Version-controlled** (committed to git)
- Provides historical record of cleanup activities
- Enables collaboration and code review of cleanup decisions
- Kept indefinitely in `codev/cleanup/`

---

## Rollback Strategy

### During PRUNE Phase

**For tracked files** (before commit):
```bash
# Unstage the git rm
git restore --staged path/to/file
git restore path/to/file
```

**For untracked files** (moved to .trash/):
```bash
# Move individual file back
mv "codev/cleanup/.trash/YYYY-MM-DD-HHMM/path/to/file" "path/to/file"
```

### After VALIDATE Fails

**For tracked files** (most common):
```bash
# Revert the cleanup commit
git revert HEAD

# Or restore specific files from before the commit
git checkout HEAD~1 -- path/to/file
```

**For untracked files**:
```bash
./codev/cleanup/.trash/YYYY-MM-DD-HHMM/restore.sh
```

### After SYNC Phase

If you discover an issue after completing cleanup:

1. **Tracked files**: Always recoverable from git history
   ```bash
   # Find the commit that removed it
   git log --all --full-history -- path/to/file

   # Restore from before deletion
   git checkout <commit>~1 -- path/to/file
   ```

2. **Untracked files**: Check if still in `.trash/` (30-day retention)
   ```bash
   ls codev/cleanup/.trash/*/path/to/file
   ```

---

## Governance Integration

### Spec/Plan/Review Requirements

CLEANUP is an **operational protocol**, not a feature development protocol. It does **not** require the standard spec/plan/review trio:

| Document | Required? | Notes |
|----------|-----------|-------|
| Spec | No | CLEANUP follows a fixed process, not a new feature design |
| Plan | No | The **audit report** serves as the operational plan |
| Review | No | Lessons are captured in audit report notes, not a separate review |
| Consultation | No | Human review of audit report is sufficient |

**Exception**: If CLEANUP reveals the need for refactoring or architectural changes, those should follow SPIDER with proper spec/plan/review.

### projectlist.md Updates

During the SYNC phase, update `codev/projectlist.md`:

1. **Mark completed projects as `archived`**:
   ```markdown
   | 0003 | Old Feature | archived | - | Removed in cleanup 2025-12-04 |
   ```

2. **Remove orphaned entries** (projects that were never implemented)

3. **Update notes** to reflect cleanup actions

### Avoiding Conflicts with Active Work

- **Check for open PRs** before starting CLEANUP
- **Don't run CLEANUP** while feature branches are active
- Both SPIDER (Review phase) and CLEANUP (SYNC phase) modify AGENTS.md
- Coordinate with team if multiple agents are working

---

## Integration Points

### With architecture-documenter
- Called during SYNC phase
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
[Cleanup] SYNC: Update documentation
```

---

## Best Practices

### During AUDIT
- Be thorough but not paranoid
- When in doubt, leave it in (can always clean later)
- Check git blame to understand why code exists
- Consider if code might be used dynamically (reflection, eval)

### During PRUNE
- Use `git rm` for tracked files (history preserved automatically)
- Use `.trash/` only for untracked files
- Group related files in the same commit
- Don't prune and add features in the same commit

### During VALIDATE
- Run the FULL test suite, not just affected tests
- Check CI/CD if available
- Do a manual smoke test for critical paths

### During SYNC
- Let architecture-documenter do heavy lifting
- Review its changes before committing
- Don't forget projectlist.md

---

## Anti-Patterns to Avoid

1. **Aggressive Pruning**: Don't delete everything the audit finds. Review each item.

2. **Skipping VALIDATE**: Always run tests after pruning. "It looked dead" is not validation.

3. **Using `rm` for tracked files**: Use `git rm` so history is preserved. Never `rm -rf`.

4. **Pruning During Active Development**: Don't clean up on feature branches or with pending PRs.

5. **Ignoring False Positives**: If audit logic is wrong, fix it. Don't just skip items.

6. **Moving tracked files to .trash/**: Use `git rm` for tracked files. Only use `.trash/` for untracked files.

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
