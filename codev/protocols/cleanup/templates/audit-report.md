# Cleanup Audit Report

## Metadata
- **Date**: YYYY-MM-DD
- **Project**: [project-name]
- **Auditor**: [human/agent name]
- **Categories**: [dead-code, dependencies, docs, tests, temp, metadata]

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

| Approve | File | Line | Export | Reason |
|---------|------|------|--------|--------|
| [ ] | `src/utils/helpers.ts` | 42 | `formatDate()` | Not imported anywhere |
| [ ] | `src/lib/old.ts` | 15 | `legacyHelper()` | Replaced by newHelper() |

### Unreachable Code

| Approve | File | Line | Description | Reason |
|---------|------|------|-------------|--------|
| [ ] | `src/api/routes.ts` | 100-120 | Dead branch after early return | Condition always false |

### Unused Files

| Approve | File | Reason |
|---------|------|--------|
| [ ] | `src/utils/deprecated.ts` | No imports found |
| [ ] | `src/components/OldWidget.tsx` | Feature was removed |

---

## Unused Dependencies

### npm packages

| Approve | Package | Version | Reason |
|---------|---------|---------|--------|
| [ ] | `lodash` | 4.17.21 | No imports found |
| [ ] | `moment` | 2.29.4 | Replaced by date-fns |

### Python packages

| Approve | Package | Reason |
|---------|---------|--------|
| [ ] | `requests` | Using httpx instead |

---

## Stale Documentation

| Approve | File | Issue | Suggestion |
|---------|------|-------|------------|
| [ ] | `docs/api.md` | References deleted `/old-endpoint` | Remove section |
| [ ] | `README.md` | Mentions removed feature X | Update description |

---

## Test Infrastructure

### Test Status
- All tests passing: [ ] Yes / [ ] No
- If no, which tests are failing?

### Orphaned Test Files

| Approve | File | Reason |
|---------|------|--------|
| [ ] | `tests/old-feature.test.ts` | Tests deleted feature |
| [ ] | `tests/deprecated.test.ts` | Feature was removed in v2.0 |

### Low-ROI Tests

| Approve | File | Reason |
|---------|------|--------|
| [ ] | `tests/trivial.test.ts` | Tests obvious behavior |
| [ ] | `tests/flaky.test.ts` | Fails intermittently, no value |

### Orphaned Fixtures

| Approve | File | Reason |
|---------|------|--------|
| [ ] | `tests/fixtures/old-data.json` | Used by deleted test |

---

## Temporary Files

| Approve | Path | Type | Size |
|---------|------|------|------|
| [ ] | `codev/cleanup/.trash/2025-01-01-*` | Old trash | 50MB |
| [ ] | `.consult/` | Consultation logs | 10MB |
| [ ] | `dist/` | Build artifacts | 100MB |

---

## Metadata Updates Required

### projectlist.md

| Approve | Entry | Current Status | Suggested Action |
|---------|-------|----------------|------------------|
| [ ] | 0003-old-feature | implementing | Mark as archived |
| [ ] | 0005-removed | committed | Remove entry |

### AGENTS.md / CLAUDE.md

| Approve | Section | Issue | Suggestion |
|---------|---------|-------|------------|
| [ ] | Protocol list | Missing CLEANUP | Add entry |
| [ ] | Examples | Uses deleted function | Update example |

### arch.md

| Approve | Section | Issue | Suggestion |
|---------|---------|-------|------------|
| [ ] | Directory structure | Lists deleted folder | Update tree |

---

## Recommendations

### High Priority (Should Remove)
1. [List items that are clearly dead and should be removed]

### Medium Priority (Likely Safe)
1. [List items that are probably safe but review carefully]

### Low Priority / Needs Investigation
1. [List items that might be used dynamically or have unclear status]

### Do Not Remove
1. [List items that were flagged but should be kept, with reason]

---

## Approval

- [ ] Human has reviewed all items
- [ ] Checkboxes marked for approved items
- [ ] Ready to proceed to PRUNE phase

**Reviewed by**: _________________ **Date**: _________________

---

## Notes

[Add any notes about this audit, false positives encountered, or improvements to audit logic]
