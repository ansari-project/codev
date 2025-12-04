# Cleanup Audit Report

## Metadata
- **Date**: YYYY-MM-DD
- **Project**:
- **Auditor**:
- **Categories**: dead-code, dependencies, docs, tests, temp, metadata
- **Tools Used**:

## Summary

| Category | Items Found | Approved for Removal |
|----------|-------------|---------------------|
| Dead Code | 0 | 0 |
| Dependencies | 0 | 0 |
| Documentation | 0 | 0 |
| Tests | 0 | 0 |
| Temp Files | 0 | 0 |
| Metadata | 0 | 0 |
| **Total** | **0** | **0** |

## Pre-Audit Checks

- [ ] Git working directory is clean
- [ ] All tests are currently passing
- [ ] No pending merges or PRs in flight

---

## Dead Code

### Unused Exports

**Tool**: `npx ts-prune` / `ruff check --select F401` / other

| Approve | File | Line | Export | Tool Output | Owner Decision |
|---------|------|------|--------|-------------|----------------|
| | | | | | |

### Unreachable Code

**Tool**: static analysis / manual review

| Approve | File | Line | Description | Tool Output | Owner Decision |
|---------|------|------|-------------|-------------|----------------|
| | | | | | |

### Unused Files

**Tool**: `grep -r "import.*from"` analysis / IDE unused file detection

| Approve | File | Tool Output | Owner Decision |
|---------|------|-------------|----------------|
| | | | |

---

## Unused Dependencies

### npm packages

**Tool**: `npx depcheck`

| Approve | Package | Version | Tool Output | Owner Decision |
|---------|---------|---------|-------------|----------------|
| | | | | |

### Python packages

**Tool**: `pip-autoremove --list` / `deptry`

| Approve | Package | Tool Output | Owner Decision |
|---------|---------|-------------|----------------|
| | | | |

---

## Stale Documentation

**Tool**: manual review / link checker

| Approve | File | Issue | Suggestion | Owner Decision |
|---------|------|-------|------------|----------------|
| | | | | |

---

## Test Infrastructure

### Test Status
- All tests passing: [ ] Yes / [ ] No
- If no, which tests are failing?

### Orphaned Test Files

**Tool**: cross-reference with deleted features

| Approve | File | Reason | Owner Decision |
|---------|------|--------|----------------|
| | | | |

### Low-ROI Tests

**Tool**: test coverage analysis / flaky test detection

| Approve | File | Reason | Owner Decision |
|---------|------|--------|----------------|
| | | | |

### Orphaned Fixtures

**Tool**: grep for fixture usage

| Approve | File | Reason | Owner Decision |
|---------|------|--------|----------------|
| | | | |

---

## Temporary Files

**Tool**: `find` / `du -sh`

| Approve | Path | Type | Size | Owner Decision |
|---------|------|------|------|----------------|
| | | | | |

---

## Metadata Updates Required

### projectlist.md

| Approve | Entry | Current Status | Suggested Action | Owner Decision |
|---------|-------|----------------|------------------|----------------|
| | | | | |

### AGENTS.md / CLAUDE.md

| Approve | Section | Issue | Suggestion | Owner Decision |
|---------|---------|-------|------------|----------------|
| | | | | |

### arch.md

| Approve | Section | Issue | Suggestion | Owner Decision |
|---------|---------|-------|------------|----------------|
| | | | | |

---

## Recommendations

### High Priority (Should Remove)
1.

### Medium Priority (Likely Safe)
1.

### Low Priority / Needs Investigation
1.

### Do Not Remove
1.

---

## Rollback Notes

If VALIDATE fails, document restoration steps here:

| Item | Restoration Command | Notes |
|------|---------------------|-------|
| Tracked files | `git revert HEAD` or `git checkout HEAD~1 -- path/to/file` | |
| Untracked files | `./codev/cleanup/.trash/YYYY-MM-DD-HHMM/restore.sh` | |

---

## Approval

- [ ] Human has reviewed all items
- [ ] Checkboxes marked for approved items
- [ ] Ready to proceed to PRUNE phase

**Reviewed by**: _________________ **Date**: _________________

---

## Notes

<!-- Add any notes about this audit, false positives encountered, or improvements to audit logic -->

