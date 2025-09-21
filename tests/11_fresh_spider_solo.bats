#!/usr/bin/env bats
# Test fresh Codev installation with SPIDER-SOLO protocol (Zen MCP absent)

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'
load 'helpers/common.bash'
load 'helpers/mock_mcp.bash'

setup() {
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  export TEST_PROJECT
  TEST_PROJECT=$(setup_test_project)

  # Remove MCP from PATH for all tests (Zen absent scenario)
  remove_mcp_from_path
}

teardown() {
  # Clean up test project
  if [[ -n "${TEST_PROJECT:-}" ]]; then
    teardown_test_project "$TEST_PROJECT"
  fi

  # Restore original PATH
  restore_path
}

@test "fresh install with Zen absent creates SPIDER-SOLO setup" {
  # Verify Zen is NOT available
  run is_zen_available
  assert_failure

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Create CLAUDE.md with SPIDER-SOLO protocol reference
  create_claude_md "$TEST_PROJECT" "# Project Instructions

## Codev Methodology

This project uses the Codev context-driven development methodology.

### Active Protocol
- Protocol: SPIDER-SOLO (single-agent variant)
- Location: codev/protocols/spider-solo/protocol.md

### Directory Structure
- Specifications: codev/specs/
- Plans: codev/plans/
- Reviews: codev/reviews/

See codev/protocols/spider-solo/protocol.md for full protocol details."

  # Verify structure
  assert_codev_structure "$TEST_PROJECT"
  assert_spider_solo_protocol "$TEST_PROJECT"

  # Both protocols should still be installed (user chooses)
  assert_spider_protocol "$TEST_PROJECT"
}

@test "SPIDER-SOLO protocol has all required templates" {
  install_from_local "$TEST_PROJECT"

  # Check all SPIDER-SOLO templates exist
  assert_file_exist "$TEST_PROJECT/codev/protocols/spider-solo/templates/spec.md"
  assert_file_exist "$TEST_PROJECT/codev/protocols/spider-solo/templates/plan.md"
  assert_file_exist "$TEST_PROJECT/codev/protocols/spider-solo/templates/review.md"
  assert_file_exist "$TEST_PROJECT/codev/protocols/spider-solo/templates/review.md"

  # Verify protocol.md exists and has content
  assert_file_exist "$TEST_PROJECT/codev/protocols/spider-solo/protocol.md"
  # Check protocol has substantial content
  local line_count
  line_count=$(wc -l "$TEST_PROJECT/codev/protocols/spider-solo/protocol.md" | awk '{print $1}')
  assert [ "$line_count" -gt 50 ]
}

@test "SPIDER-SOLO protocol excludes multi-agent consultation" {
  install_from_local "$TEST_PROJECT"

  local protocol_file="$TEST_PROJECT/codev/protocols/spider-solo/protocol.md"

  # SPIDER-SOLO should mention it's SOLO variant
  run file_contains "$protocol_file" "SPIDER-SOLO Protocol"
  assert_success

  # Should mention self-review instead of multi-agent
  run file_contains "$protocol_file" "Self-review only"
  assert_success

  # Should have self-review instead of multi-agent
  run file_contains "$protocol_file" "self-review and human approval only"
  assert_success

  # Negative assertions - ensure SPIDER-specific consultation requirements are NOT present
  run file_contains "$protocol_file" "MUST consult GPT-5 AND Gemini Pro"
  assert_failure

  run file_contains "$protocol_file" "Expert Consultation (DEFAULT - MANDATORY)"
  assert_failure

  run file_contains "$protocol_file" "MUST consult BOTH GPT-5 AND Gemini Pro"
  assert_failure
}

@test "MCP command returns error when absent" {
  # Verify mcp command fails with exit code 127 (command not found)
  run mcp list 2>/dev/null || true  # Suppress stderr
  assert_failure
}

@test "both protocols available regardless of Zen presence" {
  install_from_local "$TEST_PROJECT"

  # Both protocols should be installed
  assert_spider_protocol "$TEST_PROJECT"
  assert_spider_solo_protocol "$TEST_PROJECT"

  # User can choose either one via CLAUDE.md
  create_claude_md "$TEST_PROJECT" "Protocol: SPIDER-SOLO"
  run file_contains "$TEST_PROJECT/CLAUDE.md" "SPIDER-SOLO"
  assert_success

  # Or they could still choose SPIDER if they plan to add Zen later
  create_claude_md "$TEST_PROJECT" "Protocol: SPIDER"
  run file_contains "$TEST_PROJECT/CLAUDE.md" "SPIDER"
  assert_success
}

@test "SPIDER-SOLO has same phase structure as SPIDER" {
  install_from_local "$TEST_PROJECT"

  local protocol_file="$TEST_PROJECT/codev/protocols/spider-solo/protocol.md"

  # Check for all SPIDER phases (same structure, different execution)
  run file_contains "$protocol_file" "## S - Specify"
  assert_success

  run file_contains "$protocol_file" "## P - Plan"
  assert_success

  run file_contains "$protocol_file" "### (IDE) - Implementation Loop"
  assert_success

  run file_contains "$protocol_file" "#### I - Implement"
  assert_success

  run file_contains "$protocol_file" "#### D - Defend"
  assert_success

  run file_contains "$protocol_file" "#### E - Evaluate"
  assert_success

  run file_contains "$protocol_file" "## R - Review"
  assert_success
}

@test "SPIDER-SOLO includes same git commit requirements" {
  install_from_local "$TEST_PROJECT"

  local protocol_file="$TEST_PROJECT/codev/protocols/spider-solo/protocol.md"

  # Same commit discipline as SPIDER
  run file_contains "$protocol_file" "Phase Commit"
  assert_success

  run file_contains "$protocol_file" "MANDATORY"
  assert_success

  run file_contains "$protocol_file" "Single atomic commit for the phase"
  assert_success
}

@test "directory structure identical for both protocols" {
  install_from_local "$TEST_PROJECT"

  # Same directory structure
  assert_dir_exist "$TEST_PROJECT/codev"
  assert_dir_exist "$TEST_PROJECT/codev/specs"
  assert_dir_exist "$TEST_PROJECT/codev/plans"
  assert_dir_exist "$TEST_PROJECT/codev/reviews"
  assert_dir_exist "$TEST_PROJECT/codev/resources"

  # Same resources
  assert_file_exist "$TEST_PROJECT/codev/resources/llms.txt"
  # example-spec.md was removed from skeleton
}

@test "SPIDER-SOLO emphasizes self-review" {
  install_from_local "$TEST_PROJECT"

  local protocol_file="$TEST_PROJECT/codev/protocols/spider-solo/protocol.md"

  # Should mention self-review
  run file_contains "$protocol_file" "Self-review"
  assert_success

  # Should still have review phase
  run file_contains "$protocol_file" "Review"
  assert_success
}

@test "installation works without any MCP available" {
  # Our mock shim exists but returns error
  run mcp --version 2>/dev/null || true  # Suppress stderr
  assert_failure

  # Installation should still succeed
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Create CLAUDE.md first (required by assert_codev_structure)
  create_claude_md "$TEST_PROJECT" "Protocol: SPIDER-SOLO"

  # All core components should be present
  assert_codev_structure "$TEST_PROJECT"
  assert_spider_protocol "$TEST_PROJECT"
  assert_spider_solo_protocol "$TEST_PROJECT"
}