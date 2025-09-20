#!/usr/bin/env bats
# Test the helper functions themselves

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'
load 'helpers/common.bash'
load 'helpers/mock_mcp.bash'

setup() {
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  export TEST_TEMP_DIR
}

teardown() {
  # Clean up any test directories
  if [[ -n "${TEST_TEMP_DIR:-}" && -d "${TEST_TEMP_DIR}" ]]; then
    teardown_test_project "$TEST_TEMP_DIR"
  fi
  # Restore PATH if modified
  restore_path
}

@test "setup_test_project creates temporary directory" {
  TEST_TEMP_DIR=$(setup_test_project)
  assert_dir_exist "$TEST_TEMP_DIR"
  assert [ -w "$TEST_TEMP_DIR" ]
}

@test "teardown_test_project removes directory" {
  TEST_TEMP_DIR=$(setup_test_project)
  assert_dir_exist "$TEST_TEMP_DIR"

  teardown_test_project "$TEST_TEMP_DIR"
  assert_not_exist "$TEST_TEMP_DIR"

  # Prevent double cleanup
  unset TEST_TEMP_DIR
}

@test "install_from_local copies codev-skeleton" {
  TEST_TEMP_DIR=$(setup_test_project)

  run install_from_local "$TEST_TEMP_DIR"
  assert_success

  # Check that key directories were copied into codev/ subdirectory
  assert_dir_exist "$TEST_TEMP_DIR/codev"
  assert_dir_exist "$TEST_TEMP_DIR/codev/protocols"
  assert_dir_exist "$TEST_TEMP_DIR/codev/protocols/spider"
  assert_dir_exist "$TEST_TEMP_DIR/codev/protocols/spider-solo"
  assert_dir_exist "$TEST_TEMP_DIR/codev/specs"
  assert_dir_exist "$TEST_TEMP_DIR/codev/plans"
  assert_dir_exist "$TEST_TEMP_DIR/codev/lessons"
}

@test "create_claude_md creates file with content" {
  TEST_TEMP_DIR=$(setup_test_project)

  create_claude_md "$TEST_TEMP_DIR" "# Test CLAUDE.md content"

  assert_file_exist "$TEST_TEMP_DIR/CLAUDE.md"
  run cat "$TEST_TEMP_DIR/CLAUDE.md"
  assert_output "# Test CLAUDE.md content"
}

@test "assert_codev_structure validates directory layout" {
  TEST_TEMP_DIR=$(setup_test_project)

  # Create the expected structure
  mkdir -p "$TEST_TEMP_DIR/codev/specs"
  mkdir -p "$TEST_TEMP_DIR/codev/plans"
  mkdir -p "$TEST_TEMP_DIR/codev/lessons"
  mkdir -p "$TEST_TEMP_DIR/codev/protocols"
  touch "$TEST_TEMP_DIR/CLAUDE.md"

  # This should succeed
  run assert_codev_structure "$TEST_TEMP_DIR"
  assert_success
}

@test "mock_mcp_present simulates Zen MCP availability" {
  mock_mcp_present

  # Check mcp is in PATH
  run command -v mcp
  assert_success

  # Check Zen is listed
  run mcp list
  assert_success
  assert_output --partial "@anthropic/zen"
}

@test "mock_mcp_absent simulates MCP without Zen" {
  mock_mcp_absent

  # Check mcp is in PATH
  run command -v mcp
  assert_success

  # Check Zen is NOT listed
  run mcp list
  assert_success
  refute_output --partial "@anthropic/zen"
  assert_output --partial "@example/other"
}

@test "remove_mcp_from_path masks mcp command" {
  # First add mock to ensure something to remove
  mock_mcp_present
  run command -v mcp
  assert_success

  # Now remove it (it will be masked with a failing shim)
  remove_mcp_from_path
  run command -v mcp
  assert_success  # The shim exists

  # But it should fail when run
  run mcp list
  assert_failure  # The shim returns exit code 127
}

@test "restore_path restores original PATH" {
  # Save original state
  local original_path="$PATH"

  # Modify PATH
  mock_mcp_present
  run command -v mcp
  assert_success

  # Restore
  restore_path

  # PATH should be back to original
  assert_equal "$PATH" "$original_path"

  # Mock directory should be cleaned up
  assert [ -z "${MOCK_MCP_DIR:-}" ]
}

@test "is_zen_available detects Zen presence correctly" {
  # Test with Zen present
  mock_mcp_present
  run is_zen_available
  assert_success
  restore_path

  # Test with Zen absent
  mock_mcp_absent
  run is_zen_available
  assert_failure
  restore_path

  # Test with no mcp
  remove_mcp_from_path
  run is_zen_available
  assert_failure
}

@test "file_contains checks file content" {
  TEST_TEMP_DIR=$(setup_test_project)
  echo "This is a test file with SPIDER protocol" > "$TEST_TEMP_DIR/test.txt"

  run file_contains "$TEST_TEMP_DIR/test.txt" "SPIDER protocol"
  assert_success

  run file_contains "$TEST_TEMP_DIR/test.txt" "SOLO protocol"
  assert_failure
}

@test "assert_spider_protocol validates SPIDER setup" {
  TEST_TEMP_DIR=$(setup_test_project)

  # Create minimal SPIDER protocol structure
  mkdir -p "$TEST_TEMP_DIR/codev/protocols/spider/templates"
  touch "$TEST_TEMP_DIR/codev/protocols/spider/protocol.md"
  touch "$TEST_TEMP_DIR/codev/protocols/spider/templates/spec.md"
  touch "$TEST_TEMP_DIR/codev/protocols/spider/templates/plan.md"

  # Should succeed with all files present
  assert_spider_protocol "$TEST_TEMP_DIR"

  # Remove a required file and expect failure
  rm "$TEST_TEMP_DIR/codev/protocols/spider/templates/plan.md"
  run assert_spider_protocol "$TEST_TEMP_DIR"
  assert_failure
}

@test "assert_spider_solo_protocol validates SPIDER-SOLO setup" {
  TEST_TEMP_DIR=$(setup_test_project)

  # Create minimal SPIDER-SOLO protocol structure
  mkdir -p "$TEST_TEMP_DIR/codev/protocols/spider-solo/templates"
  touch "$TEST_TEMP_DIR/codev/protocols/spider-solo/protocol.md"
  touch "$TEST_TEMP_DIR/codev/protocols/spider-solo/templates/spec.md"
  touch "$TEST_TEMP_DIR/codev/protocols/spider-solo/templates/plan.md"

  # Should succeed with all files present
  assert_spider_solo_protocol "$TEST_TEMP_DIR"

  # Test missing directory should fail
  TEST_TEMP_DIR2=$(setup_test_project)
  mkdir -p "$TEST_TEMP_DIR2/codev"
  run assert_spider_solo_protocol "$TEST_TEMP_DIR2"
  assert_failure
  teardown_test_project "$TEST_TEMP_DIR2"
}