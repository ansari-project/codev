# Codev Test Infrastructure

## Overview

This test suite provides comprehensive testing for the Codev methodology framework, ensuring reliable installation, protocol handling, and isolation during testing.

## Test Organization

The test suite is organized into functional groups:

### Framework Tests (01-09)
- **01_framework_validation.bats** - Core framework validation
- **02_runner_behavior.bats** - Test runner behavior verification

### Protocol Tests (10-19)
- **10_fresh_spider.bats** - SPIDER protocol tests (Zen present)
- **11_fresh_spider_solo.bats** - SPIDER-SOLO protocol tests (Zen absent)
- **12_existing_claude_md.bats** - CLAUDE.md preservation tests

### Integration Tests (20+)
- **20_claude_execution.bats** - Claude CLI isolation tests

## Running Tests

### Quick Test Run (excludes integration tests)
```bash
./scripts/run-tests.sh
```

### Run All Tests
```bash
./scripts/run-all-tests.sh
```

### Run Specific Test File
```bash
./tests/lib/bats-core/bin/bats tests/10_fresh_spider.bats
```

### Run Tests with TAP Output
```bash
./tests/lib/bats-core/bin/bats tests/*.bats --tap
```

## Test Helpers

### Common Helpers (`helpers/common.bash`)

Key functions:
- `setup_test_project()` - Creates isolated test directory
- `teardown_test_project()` - Cleans up test directory
- `install_from_local()` - Installs Codev from local skeleton
- `create_claude_md()` - Creates CLAUDE.md with content
- `file_contains()` - Checks if file contains string

### Mock MCP Helpers (`helpers/mock_mcp.bash`)

Functions for simulating Zen MCP presence/absence:
- `mock_mcp_present()` - Simulates Zen MCP availability
- `mock_mcp_absent()` - Simulates Zen MCP unavailability
- `remove_mcp_from_path()` - Removes MCP from PATH
- `restore_path()` - Restores original PATH

## Key Testing Patterns

### 1. Test Isolation

Every test runs in an isolated environment:
```bash
setup() {
  export TEST_PROJECT
  TEST_PROJECT=$(setup_test_project)
}

teardown() {
  teardown_test_project "$TEST_PROJECT"
}
```

### 2. XDG Sandboxing

Tests that might interact with user configuration use XDG sandboxing:
```bash
export XDG_CONFIG_HOME="$TEST_PROJECT/.xdg"
export XDG_DATA_HOME="$TEST_PROJECT/.local/share"
export XDG_CACHE_HOME="$TEST_PROJECT/.cache"
```

This ensures tests never touch real user configuration in `$HOME`.

### 3. Conditional Skipping

Tests skip gracefully when dependencies are unavailable:
```bash
check_claude_cli() {
  if ! command -v claude >/dev/null 2>&1; then
    skip "Claude CLI not available"
  fi
}
```

### 4. Platform Compatibility

Tests handle macOS/Linux differences:
```bash
if [[ "$OSTYPE" == "darwin"* ]]; then
  perms=$(stat -f "%Lp" "$file")
else
  perms=$(stat -c "%a" "$file")
fi
```

### 5. Avoiding Overmocking

Tests focus on behavior, not implementation:
- Test actual behavior, not internal details
- Use real implementations where possible
- Only mock external dependencies (APIs, MCP)
- Prefer integration tests over heavily mocked unit tests

## Claude CLI Isolation

When testing with Claude CLI, use isolation flags to prevent loading user configuration:

```bash
claude --strict-mcp-config --mcp-config '[]' --settings '{}'
```

- `--strict-mcp-config` - Enforces strict MCP configuration
- `--mcp-config '[]'` - Empty MCP configuration (no servers)
- `--settings '{}'` - Empty settings (no user preferences)

## Test Coverage

### Installation Testing
- ✅ Fresh installation with Zen present (SPIDER)
- ✅ Fresh installation with Zen absent (SPIDER-SOLO)
- ✅ Existing CLAUDE.md preservation
- ✅ Permission preservation
- ✅ Symlink handling

### Protocol Testing
- ✅ SPIDER protocol structure and templates
- ✅ SPIDER-SOLO protocol structure and templates
- ✅ Multi-agent consultation requirements
- ✅ Git commit requirements
- ✅ Phase structure validation

### Isolation Testing
- ✅ Claude CLI flag acceptance
- ✅ Settings isolation verification
- ✅ MCP configuration isolation
- ✅ API key handling
- ✅ Control tests for default behavior

## CI/CD Considerations

### Local-Only Tests

Some tests are designed to run only locally (not in CI):
- Claude execution tests (require Claude CLI)
- Tests requiring API keys

These tests skip gracefully when dependencies are unavailable.

### Timeout Handling

Tests that execute external commands use timeout protection:
```bash
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
fi
```

### Security

- Tests never commit sensitive data
- API keys are explicitly unset during testing
- Sandboxed environments prevent configuration leakage
- No real user directories are modified

## Contributing

When adding new tests:

1. Follow existing patterns for setup/teardown
2. Use XDG sandboxing for configuration-related tests
3. Add appropriate skip conditions for optional dependencies
4. Focus on behavior, not implementation details
5. Ensure tests are idempotent and isolated
6. Document any special requirements or considerations

## Dependencies

### Required
- Bash 4.0+
- Git
- Standard Unix utilities (grep, sed, awk, etc.)

### Optional
- Claude CLI (for execution tests)
- timeout/gtimeout (for execution timeout protection)
- Zen MCP server (for multi-agent tests)

## Troubleshooting

### Tests Hanging

If tests hang, likely causes:
- Missing timeout utility for Claude tests
- Recursive test execution (meta-tests)

Solution: Install `coreutils` for gtimeout on macOS:
```bash
brew install coreutils
```

### Permission Errors

Ensure test directories are writable:
```bash
chmod -R u+w /tmp/codev-test.*
```

### Path Issues

If commands aren't found, check PATH:
```bash
echo $PATH
which bats
```

## Test Metrics

Current test suite:
- **Total Tests**: 52
- **Core Framework**: 12 tests
- **SPIDER Protocol**: 10 tests
- **SPIDER-SOLO Protocol**: 10 tests
- **CLAUDE.md Preservation**: 10 tests
- **Claude Execution**: 10 tests

All tests should pass on supported platforms (macOS, Linux).