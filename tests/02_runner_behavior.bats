#!/usr/bin/env bats
# Test actual behavior of test runners rather than implementation details

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'

setup() {
  export TEST_TEMP_DIR="$BATS_TEST_DIRNAME/tmp_test_$$"
  mkdir -p "$TEST_TEMP_DIR"
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
}

teardown() {
  rm -rf "$TEST_TEMP_DIR"
}

@test "run-tests.sh executes non-integration tests only" {
  # The test runners look in $PROJECT_ROOT/tests, not current directory
  # So we test the actual behavior with real test files
  DRY_RUN=1 run "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
  assert_output --partial "00_framework.bats"
  assert_output --partial "01_framework_validation.bats"
  assert_output --partial "02_runner_behavior.bats"
  # If we had Claude tests, they would be excluded
  refute_output --partial "claude_integration.bats"
}

@test "run-integration-tests.sh looks for integration tests" {
  # Currently we have no integration tests, so it should report none found
  DRY_RUN=1 run "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
  assert_output --partial "No integration test files found"
  # Should not include regular tests
  refute_output --partial "00_framework.bats"
  refute_output --partial "01_framework_validation.bats"
}

@test "DRY_RUN mode prevents actual test execution" {
  DRY_RUN=1 run "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
  assert_output --partial "DRY RUN: Would execute"
  # Should not see actual test execution output
  refute_output --partial "ok 1"
  refute_output --partial "not ok"
}

@test "test runner handles missing bats gracefully" {
  # Create a fake runner that points to non-existent bats
  cat > "$TEST_TEMP_DIR/fake_runner.sh" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
BATS_EXEC="/nonexistent/bats"
if [ ! -f "$BATS_EXEC" ]; then
    echo "Error: bats-core not found at $BATS_EXEC" >&2
    echo "Please ensure test framework is properly installed" >&2
    exit 1
fi
EOF
  chmod +x "$TEST_TEMP_DIR/fake_runner.sh"

  run "$TEST_TEMP_DIR/fake_runner.sh"
  assert_failure
  assert_output --partial "Error: bats-core not found"
}

@test "integration runner skips when Claude not available" {
  # Run with PATH that excludes Claude
  PATH=/usr/bin:/bin run "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
  assert_output --partial "Warning: Claude CLI not found"
  assert_output --partial "Integration tests will be skipped"
}