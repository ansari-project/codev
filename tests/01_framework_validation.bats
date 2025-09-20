#!/usr/bin/env bats
# Validate that the test framework is properly set up for Phase 1

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'

@test "test directory structure exists" {
  assert_dir_exist "$BATS_TEST_DIRNAME"
  assert_dir_exist "$BATS_TEST_DIRNAME/lib"
  assert_dir_exist "$BATS_TEST_DIRNAME/helpers"
  assert_dir_exist "$BATS_TEST_DIRNAME/fixtures"
}

@test "bats-core is properly vendored" {
  assert_dir_exist "$BATS_TEST_DIRNAME/lib/bats-core"
  assert_file_executable "$BATS_TEST_DIRNAME/lib/bats-core/bin/bats"
}

@test "bats helper libraries are vendored" {
  assert_dir_exist "$BATS_TEST_DIRNAME/lib/bats-support"
  assert_dir_exist "$BATS_TEST_DIRNAME/lib/bats-assert"
  assert_dir_exist "$BATS_TEST_DIRNAME/lib/bats-file"
}

@test "test runner scripts exist and are executable" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  assert_file_exist "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_file_executable "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_file_exist "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_file_executable "$PROJECT_ROOT/scripts/run-integration-tests.sh"
}

@test "run-tests.sh uses portable glob patterns" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  # Check for array declaration and glob pattern usage
  run grep -q "declare -a TEST_FILES" "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
  run grep -q 'for test_file in.*\*.bats' "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
}

@test "integration test runner checks for Claude" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  run grep -q "command -v claude" "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
}

@test "test runners support DRY_RUN mode" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  run grep -q "DRY_RUN=" "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
  run grep -q "DRY_RUN=" "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
}

@test "test runners use proper error redirection" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  # Check for stderr redirection in error messages
  run grep -q ">&2" "$PROJECT_ROOT/scripts/run-tests.sh"
  assert_success
  run grep -q ">&2" "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
}

@test "integration runner verifies Claude isolation flags" {
  PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  # Check that we verify Claude can run with isolation flags
  run grep -q "strict-mcp-config" "$PROJECT_ROOT/scripts/run-integration-tests.sh"
  assert_success
}