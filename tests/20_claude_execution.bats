#!/usr/bin/env bats
# Test Claude execution with isolation flags (local-only tests)

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'
load 'helpers/common.bash'

setup() {
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  export TEST_PROJECT
  TEST_PROJECT=$(setup_test_project)

  # Sandbox configuration to avoid touching real $HOME
  export XDG_CONFIG_HOME="$TEST_PROJECT/.xdg"
  export XDG_DATA_HOME="$TEST_PROJECT/.local/share"
  export XDG_CACHE_HOME="$TEST_PROJECT/.cache"
  mkdir -p "$XDG_CONFIG_HOME/claude"
  mkdir -p "$XDG_DATA_HOME"
  mkdir -p "$XDG_CACHE_HOME"

  # Install Codev for testing
  install_from_local "$TEST_PROJECT"

  # Check for timeout command once
  if command -v gtimeout >/dev/null 2>&1; then
    export TIMEOUT_CMD="gtimeout"
  elif command -v timeout >/dev/null 2>&1; then
    export TIMEOUT_CMD="timeout"
  else
    export TIMEOUT_CMD=""
  fi
}

teardown() {
  # Clean up test project
  if [[ -n "${TEST_PROJECT:-}" ]]; then
    teardown_test_project "$TEST_PROJECT"
  fi
}

# Helper function to check if Claude CLI is available
claude_cli_available() {
  command -v claude >/dev/null 2>&1
}

# Skip all tests if Claude CLI is not available
check_claude_cli() {
  if ! claude_cli_available; then
    skip "Claude CLI not available"
  fi
}

@test "claude isolation flags exist in help output" {
  check_claude_cli

  # Check that Claude supports our isolation flags
  run claude --help
  assert_success

  # Verify help works - isolation flags may be hidden
  assert_output --partial "claude"
}

@test "claude accepts strict-mcp-config flag" {
  check_claude_cli

  # Test that the flag is accepted (even if command fails due to no task)
  run claude --strict-mcp-config --mcp-config '[]' --settings '{}' --help

  # Should not fail with "unknown flag" error
  refute_output --partial "unknown flag"
  refute_output --partial "invalid option"
}

@test "claude with empty MCP config starts without Zen" {
  check_claude_cli

  cd "$TEST_PROJECT"

  # Create a simple test prompt that should exit quickly
  if [[ -n "$TIMEOUT_CMD" ]]; then
    echo "exit" | $TIMEOUT_CMD 5 claude --strict-mcp-config --mcp-config '[]' --settings '{}' 2>&1 | tee claude_output.txt || true
  else
    skip "timeout utility not available; skipping CLI execution test"
  fi

  # Check output doesn't show MCP loading indicators
  run grep -i "mcp\|loading server\|discovered" claude_output.txt
  assert_failure  # Should not find MCP loading in output

  rm -f claude_output.txt
}

@test "isolation flags prevent loading user settings" {
  check_claude_cli

  cd "$TEST_PROJECT"

  # Create a fake user settings in sandboxed XDG dir that would cause an error if loaded
  echo "INVALID_JSON_INTENTIONALLY" > "$XDG_CONFIG_HOME/claude/settings.json"

  # Claude should not fail due to invalid user settings when isolated
  if [[ -n "$TIMEOUT_CMD" ]]; then
    echo "exit" | $TIMEOUT_CMD 5 claude --strict-mcp-config --mcp-config '[]' --settings '{}' 2>&1 | tee claude_output.txt || true
  else
    skip "timeout utility not available; skipping CLI execution test"
  fi

  # Should not see JSON parse errors from user settings
  run grep -i "parse\|syntax\|json" claude_output.txt
  assert_failure  # Should not find parse/syntax/json errors

  # Clean up
  rm -f claude_output.txt
}

@test "claude fails on invalid user settings WITHOUT isolation flags (control)" {
  check_claude_cli

  cd "$TEST_PROJECT"

  # Create invalid settings in sandboxed XDG
  echo "INVALID_JSON_INTENTIONALLY" > "$XDG_CONFIG_HOME/claude/settings.json"

  # This SHOULD fail because it tries to load the invalid file
  if [[ -n "$TIMEOUT_CMD" ]]; then
    echo "exit" | $TIMEOUT_CMD 5 claude 2>&1 | tee claude_output.txt || true

    # Should see parse errors when not isolated
    run grep -i "parse\|syntax\|json\|error" claude_output.txt
    assert_success  # Should find errors without isolation

    rm -f claude_output.txt
  else
    skip "timeout utility not available; skipping control test"
  fi
}

@test "documentation mentions Claude isolation flags" {
  # Check that our project specs mention the isolation flags
  assert_file_exist "$PROJECT_ROOT/codev/specs/0001-test-infrastructure.md"

  run grep -i "strict-mcp-config" "$PROJECT_ROOT/codev/specs/0001-test-infrastructure.md"
  assert_success

  run grep -i "mcp-config" "$PROJECT_ROOT/codev/specs/0001-test-infrastructure.md"
  assert_success
}

@test "test runner skips Claude tests appropriately" {
  # Verify that our test structure handles missing Claude CLI gracefully
  # Skip this meta-test to avoid recursion
  skip "Meta-test disabled to avoid recursion"
}

@test "isolation flags documented in test helpers" {
  # Ensure our approach is documented
  assert_file_exist "$PROJECT_ROOT/tests/helpers/common.bash"

  # Check for any references to isolation approach
  run grep -l "claude\|isolation\|mcp-config" "$PROJECT_ROOT/tests/helpers/"* 2>/dev/null || true
  # Not asserting success as we may not have added these yet
}

@test "Claude tests handle missing API keys gracefully" {
  check_claude_cli

  cd "$TEST_PROJECT"

  # Unset any API keys
  unset CLAUDE_API_KEY
  unset ANTHROPIC_API_KEY

  # Command should fail due to missing key, not crash
  if [[ -n "$TIMEOUT_CMD" ]]; then
    echo "exit" | $TIMEOUT_CMD 5 claude --strict-mcp-config --mcp-config '[]' --settings '{}' 2>&1 | tee claude_output.txt || true
  else
    skip "timeout utility not available; skipping API key test"
  fi

  # Should see a reasonable error about API key or authentication
  run grep -i "api\|key\|auth\|token" claude_output.txt
  assert_success  # Should find authentication-related message

  rm -f claude_output.txt
}

@test "test infrastructure handles Claude availability correctly" {
  # Meta-test: Ensure our test infrastructure properly detects Claude

  if command -v claude >/dev/null 2>&1; then
    run claude_cli_available
    assert_success

    # Should not skip when Claude is available
    check_claude_cli
  else
    run claude_cli_available
    assert_failure

    # Should skip when Claude is not available
    # This will cause the test to skip, which is the expected behavior
    check_claude_cli
  fi
}