# Specification: Codev Installation Test Infrastructure

## Metadata
- **ID**: 0001-test-infrastructure
- **Status**: draft
- **Author**: Claude (with Waleed)
- **Created**: 2025-01-20
- **Multi-Agent**: true (GPT-5 and Gemini Pro)

## Problem Statement
Currently, there is no automated way to verify that the Codev installation process works correctly. The installation involves multiple steps including downloading files, creating directories, and potentially interacting with AI agents. We need a test infrastructure that can verify the installation process works as expected across different scenarios.

## Current State
- Installation instructions exist in INSTALL.md
- The process is manual and untested
- No way to verify that installations complete successfully
- No regression testing when we make changes to the installation process
- Installation involves both shell commands and AI agent interactions

## Desired State
- Automated test suite that validates the installation process
- Tests for different installation scenarios (with/without Zen MCP, existing vs new CLAUDE.md)
- Verification that all files are created in the correct locations
- Validation that the installed structure matches expectations
- Clear test reports showing what passed/failed
- Ability to run tests locally and in CI/CD

## Stakeholders
- **Primary Users**: Codev maintainers who need to ensure installation works
- **Secondary Users**: Contributors who want to verify their changes don't break installation
- **End Users**: Developers installing Codev who benefit from a reliable installation process

## Success Criteria
- [ ] Test suite can simulate a fresh installation
- [ ] Tests verify all files are created in correct locations
- [ ] Tests validate file contents match expected templates
- [ ] Tests handle both SPIDER and SPIDER-SOLO installation paths
- [ ] Tests can simulate presence/absence of Zen MCP server
- [ ] Tests can verify CLAUDE.md updates (both new and existing files)
- [ ] Test suite can be run with a single command
- [ ] All tests pass with >90% coverage of installation scenarios
- [ ] Clear documentation on how to run and extend tests

## Constraints
### Technical Constraints
- Must work without actually installing Zen MCP server
- Should not require network access for basic tests (mock the GitHub download)
- Must handle testing AI agent interactions (which are text-based instructions)
- Should work on common development platforms (macOS, Linux)
- Cannot directly test Claude's execution of instructions

### Business Constraints
- Should be simple enough for contributors to understand and modify
- Must not add heavy dependencies to the project
- Should complete in under 30 seconds for full test suite

## Assumptions
- Python is available for test infrastructure (common for development)
- We can mock or simulate the curl/tar download process
- We can test the file system outcomes even if we can't test the AI interaction directly
- Contributors will run tests before submitting PRs

## Solution Approaches

### Approach 1: Shell Script Test Suite
**Description**: Create a bash-based test suite that runs installation commands and verifies outcomes

**Pros**:
- No additional language dependencies
- Directly tests the actual shell commands
- Simple to understand for shell-savvy developers
- Can easily test file system operations

**Cons**:
- Limited testing framework capabilities
- Harder to mock external dependencies
- Less structured test reporting
- Difficult to test edge cases cleanly

**Estimated Complexity**: Medium
**Risk Level**: Low

### Approach 2: Python + Canonical install.sh (RECOMMENDED)
**Description**: Create a canonical `install.sh` script as the single source of truth, then use pytest to test it

**Pros**:
- Single authoritative installer script
- Tests the actual shell script (catches quoting, PATH issues)
- Rich testing ecosystem (pytest, mocking, fixtures)
- Easy to mock external dependencies (mcp command, network)
- Structured test reports and coverage metrics
- Can simulate different installation scenarios cleanly
- Easy to integrate with CI/CD
- Offline mode for fast, reliable tests

**Cons**:
- Adds Python as a test dependency (acceptable for testing)
- Need to maintain both install.sh and INSTALL.md in sync

**Estimated Complexity**: Medium
**Risk Level**: Low

### Approach 3: Docker-Based Integration Tests
**Description**: Use Docker containers to test actual installations in isolated environments

**Pros**:
- Tests real installation in clean environment
- Can test across different OS configurations
- Completely isolated from host system
- Most realistic testing scenario

**Cons**:
- Requires Docker
- Slower test execution
- More complex setup
- Harder to debug failures
- Overkill for basic validation

**Estimated Complexity**: High
**Risk Level**: Medium (defer to v2)

## Open Questions

### Critical (Blocks Progress)
- [ ] How do we test the AI agent instruction portions of installation?
- [ ] Should we test the actual GitHub download or always mock it?

### Important (Affects Design)
- [ ] Do we need to test on Windows or just Unix-like systems?
- [ ] Should tests be able to run without any network access?
- [ ] How do we handle testing the Zen MCP detection?

### Nice-to-Know (Optimization)
- [ ] Could we generate test cases from the INSTALL.md automatically?
- [ ] Should we test upgrade scenarios (existing Codev to new version)?

## Performance Requirements
- **Test Execution Time**: < 30 seconds for full suite
- **Individual Test**: < 2 seconds per test
- **Resource Usage**: Minimal CPU/memory usage
- **Parallelization**: Tests should be parallelizable where possible

## Security Considerations
- Tests should not require elevated privileges
- Should not modify system files outside of test directories
- Must clean up all test artifacts after completion
- Should not expose any sensitive information in test logs

## Test Scenarios
### Functional Tests
1. Fresh installation with no existing files
2. Installation with existing CLAUDE.md file
3. Installation with Zen MCP server available
4. Installation without Zen MCP server (falls back to SPIDER-SOLO)
5. Verify all directories are created (specs/, plans/, lessons/, resources/, protocols/)
6. Verify protocol files are copied correctly
7. Verify llms.txt is created in resources/
8. Test cleanup of temporary installation directory

### Edge Cases
1. Installation with read-only directories
2. Installation with spaces in path names
3. Installation with existing codev/ directory
4. Network timeout during GitHub download
5. Corrupted tar file download
6. Partial installation recovery

## Dependencies
- **External Services**: GitHub (for downloading skeleton) - should be mocked
- **Internal Systems**: File system operations, shell commands
- **Libraries/Frameworks**: Testing framework (pytest or bash-based)

## References
- [INSTALL.md](/INSTALL.md)
- [codev-skeleton structure](/codev-skeleton/)
- Standard software testing best practices

## Risks and Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Can't test AI interactions directly | High | Medium | Test file system outcomes instead |
| Tests become outdated | Medium | High | Run tests in CI/CD, keep simple |
| Platform-specific issues | Medium | Medium | Focus on Unix-like systems initially |
| Mocking adds complexity | Low | Medium | Start with simple file-based tests |

## V1 Scope Definition (Based on Multi-Agent Feedback)

### In Scope for V1
1. **Create canonical `install.sh` script** with:
   - `--non-interactive` flag to bypass prompts
   - `--protocol` flag to specify spider or spider-solo
   - Offline mode support via `CODEV_OFFLINE=1` or local archive path
   - Fix tar flag bug (`--strip-components=1`)

2. **Core "happy path" tests**:
   - Fresh installation with SPIDER protocol (Zen present)
   - Fresh installation with SPIDER-SOLO (Zen absent)
   - Basic file structure validation
   - CLAUDE.md creation verification

3. **Test infrastructure**:
   - pytest harness using tmp_path fixtures
   - Mock mcp command for Zen detection
   - Local skeleton archive for offline testing
   - "Sync linter" test to ensure install.sh and INSTALL.md stay aligned

### Out of Scope for V1 (Defer to V2)
- Idempotence and re-run safety
- Existing CLAUDE.md updates
- Existing codev/ directory handling
- Complex edge cases (read-only dirs, network failures)
- Windows support
- Docker-based testing
- Upgrade/migration scenarios

## Expert Consultation
**Date**: 2025-01-20
**Models**: GPT-5 and Gemini Pro

### GPT-5 Key Feedback:
- Create canonical install.sh as single source of truth
- Fix tar flag bug (`--strip=1` should be `--strip-components=1`)
- Add non-interactive mode for automation
- Implement offline/local skeleton support
- Use pytest calling install.sh via subprocess (not reimplementing)
- Add markers to CLAUDE.md for safe updates
- Remove tree dependency (not standard on macOS)
- Standardize Zen MCP detection approach

### Gemini Pro Key Feedback:
- Start with "golden path" testing for v1
- Focus on fresh installations only initially
- Create "sync linter" test to prevent drift between install.sh and INSTALL.md
- Mock mcp by adding fake executable to PATH
- Defer idempotence to v2 (complex to get right)
- Keep v1 simple: two scenarios, one command to run tests

## Approval
- [ ] Technical Lead Review
- [x] Multi-Agent Consultation Complete
- [ ] Stakeholder Sign-off

## Notes
This test infrastructure will be critical for maintaining Codev's reliability as it grows. Starting simple with file system validation and expanding to more complex scenarios over time is the recommended approach.