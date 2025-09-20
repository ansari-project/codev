# Plan: Codev Installation Test Infrastructure

## Metadata
- **ID**: 0001-test-infrastructure
- **Specification**: [codev/specs/0001-test-infrastructure.md](/codev/specs/0001-test-infrastructure.md)
- **Status**: draft
- **Author**: Claude (with Waleed)
- **Created**: 2025-01-20

## Overview
This plan implements a shell-based test suite for validating the Codev installation process. Based on the approved specification, we'll use the bats-core framework to create structured tests that verify installation outcomes without requiring network access or complex dependencies.

## Success Metrics
- [ ] All three core test scenarios pass
- [ ] Tests run in under 30 seconds total
- [ ] No network access required during tests
- [ ] Tests can run on macOS and Linux
- [ ] Single command to run all tests
- [ ] Clear pass/fail reporting

## Phase Breakdown

### Phase 1: Set Up Test Framework and Structure
**Objective**: Establish the test infrastructure foundation with bats-core

**Dependencies**: None

**Tasks**:
1. Create `tests/` directory structure
2. Vendor bats-core and helper libraries
3. Create run-tests.sh entry point script
4. Set up basic test helpers (mktemp, cleanup)
5. Verify bats runs successfully

**Deliverables**:
- Working bats-core installation in tests/lib/
- Basic test structure created
- run-tests.sh script functional

**Success Criteria**:
- Can run `./scripts/run-tests.sh` without errors
- Bats framework loads and reports version
- Test directory structure matches specification

---

### Phase 2: Implement Core Test Helpers
**Objective**: Create reusable test utilities for mocking and setup

**Dependencies**: Phase 1 (Test framework set up)

**Tasks**:
1. Create mock_mcp helper for Zen detection
2. Create setup_test_project helper using mktemp
3. Create install_from_local helper to copy codev-skeleton
4. Create assertion helpers for directory structure
5. Fix INSTALL.md issues (tar flag, cp command)

**Deliverables**:
- tests/helpers/common.bash with project setup
- tests/helpers/mock_mcp.bash for Zen simulation
- Updated INSTALL.md with fixes

**Success Criteria**:
- Helpers can create isolated test directories
- Mock mcp can simulate present/absent states
- Local skeleton copy works with dotfiles

---

### Phase 3: Implement SPIDER Test (Zen Present)
**Objective**: Test fresh installation when Zen MCP is available

**Dependencies**: Phase 2 (Helpers ready)

**Tasks**:
1. Create 01_fresh_spider.bats test file
2. Mock Zen MCP as present
3. Copy local skeleton to test directory
4. Create CLAUDE.md with SPIDER protocol
5. Assert directory structure and file contents

**Deliverables**:
- Working test for SPIDER installation
- Verifies correct protocol selection
- Validates all directories created

**Success Criteria**:
- Test passes consistently
- Correctly detects SPIDER protocol in CLAUDE.md
- All required directories exist

---

### Phase 4: Implement SPIDER-SOLO Test (Zen Absent)
**Objective**: Test fresh installation when Zen MCP is not available

**Dependencies**: Phase 2 (Helpers ready)

**Tasks**:
1. Create 02_fresh_spider_solo.bats test file
2. Ensure no mcp in PATH
3. Copy local skeleton to test directory
4. Create CLAUDE.md with SPIDER-SOLO protocol
5. Assert correct protocol selection

**Deliverables**:
- Working test for SPIDER-SOLO installation
- Verifies fallback behavior
- Validates directory structure

**Success Criteria**:
- Test passes consistently
- Correctly selects SPIDER-SOLO when Zen absent
- All required directories exist

---

### Phase 5: Implement Existing CLAUDE.md Update Test
**Objective**: Test updating an existing CLAUDE.md file

**Dependencies**: Phase 2 (Helpers ready)

**Tasks**:
1. Create 03_existing_claude.bats test file
2. Pre-create CLAUDE.md with existing content
3. Run installation process
4. Verify Codev section appended
5. Assert original content preserved

**Deliverables**:
- Working test for existing file updates
- Validates non-destructive updates
- Ensures content preservation

**Success Criteria**:
- Original CLAUDE.md content preserved
- Codev section properly appended
- No duplicate sections added

---

### Phase 6: Add Claude Execution Test (Optional)
**Objective**: Test actual Claude command execution with isolation

**Dependencies**: Phases 3-5 complete

**Tasks**:
1. Create 04_claude_execution.bats (marked as optional)
2. Use Claude isolation flags (--strict-mcp-config)
3. Provide installation instructions as input
4. Verify Claude can execute without user settings
5. Add skip condition if Claude not available

**Deliverables**:
- Optional integration test with real Claude
- Demonstrates isolation capability
- Can be skipped in CI if needed

**Success Criteria**:
- Claude runs in isolation when available
- Test skips gracefully if Claude not installed
- No user settings affect test execution

---

### Phase 7: Documentation and CI Integration
**Objective**: Document usage and prepare for CI/CD

**Dependencies**: All tests implemented

**Tasks**:
1. Create tests/README.md with usage instructions
2. Document how to run tests locally
3. Add GitHub Actions workflow (optional)
4. Document how to add new tests
5. Create troubleshooting guide

**Deliverables**:
- Complete test documentation
- CI/CD configuration (if applicable)
- Developer guide for extending tests

**Success Criteria**:
- Clear documentation for running tests
- Instructions for debugging failures
- Guide for adding new test cases

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Bats not available on all systems | Vendor it locally, no system install needed |
| Tests affecting host system | Use mktemp and cleanup traps |
| Claude not installed | Make execution tests optional with skip |
| Platform differences | Focus on POSIX-compliant shell |
| Test flakiness | Avoid network, use deterministic mocks |

## Rollback Plan
If any phase fails:
1. Tests are isolated and can be removed without impact
2. INSTALL.md fixes can be reverted if issues found
3. Each phase can be re-attempted independently

## Dependencies
- Local codev-skeleton directory
- Bash shell (POSIX-compliant)
- Basic Unix utilities (cp, mkdir, grep, etc.)
- Optional: Claude CLI for execution tests

## Phase Status Tracking

| Phase | Status | Start Date | End Date | Notes |
|-------|--------|------------|----------|-------|
| Phase 1: Test Framework | pending | - | - | |
| Phase 2: Core Helpers | pending | - | - | |
| Phase 3: SPIDER Test | pending | - | - | |
| Phase 4: SPIDER-SOLO Test | pending | - | - | |
| Phase 5: Existing CLAUDE.md | pending | - | - | |
| Phase 6: Claude Execution | pending | - | - | Optional |
| Phase 7: Documentation | pending | - | - | |

## Notes
- Phases 3, 4, and 5 can be developed in parallel once Phase 2 is complete
- Phase 6 is optional and can be deferred if time constraints
- Focus on outcome testing rather than testing every shell command
- Keep tests simple and maintainable for v1