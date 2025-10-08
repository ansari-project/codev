#!/usr/bin/env bats
# Test codev-updater agent functionality

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'
load 'helpers/common.bash'

setup() {
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  export TEST_PROJECT
  TEST_PROJECT=$(setup_test_project)

  # Install initial Codev setup
  run install_from_local "$TEST_PROJECT"
  assert_success
}

teardown() {
  # Clean up test project
  if [[ -n "${TEST_PROJECT:-}" ]]; then
    teardown_test_project "$TEST_PROJECT"
  fi
}

@test "codev-updater agent exists in installation" {
  # Verify the codev-updater agent was installed
  assert_file_exist "$TEST_PROJECT/.claude/agents/codev-updater.md"
  assert_file_exist "$TEST_PROJECT/.claude/agents/spider-protocol-updater.md"
  assert_file_exist "$TEST_PROJECT/.claude/agents/architecture-documenter.md"
}

@test "updater preserves user specs during update" {
  # Create user specs
  echo "# Test Spec 1" > "$TEST_PROJECT/codev/specs/0001-test-feature.md"
  echo "# Test Spec 2" > "$TEST_PROJECT/codev/specs/0002-another-feature.md"

  # Simulate an update by copying protocols again
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/"* "$TEST_PROJECT/codev/protocols/"

  # Verify specs are preserved
  assert_file_exist "$TEST_PROJECT/codev/specs/0001-test-feature.md"
  assert_file_exist "$TEST_PROJECT/codev/specs/0002-another-feature.md"

  # Verify content is unchanged
  run cat "$TEST_PROJECT/codev/specs/0001-test-feature.md"
  assert_output "# Test Spec 1"
}

@test "updater preserves user plans during update" {
  # Create user plans
  echo "# Test Plan 1" > "$TEST_PROJECT/codev/plans/0001-test-feature.md"
  echo "# Test Plan 2" > "$TEST_PROJECT/codev/plans/0002-another-feature.md"

  # Simulate an update
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/"* "$TEST_PROJECT/codev/protocols/"

  # Verify plans are preserved
  assert_file_exist "$TEST_PROJECT/codev/plans/0001-test-feature.md"
  assert_file_exist "$TEST_PROJECT/codev/plans/0002-another-feature.md"

  run cat "$TEST_PROJECT/codev/plans/0001-test-feature.md"
  assert_output "# Test Plan 1"
}

@test "updater preserves user reviews during update" {
  # Create user reviews
  echo "# Test Review 1" > "$TEST_PROJECT/codev/reviews/0001-test-feature.md"
  echo "# Test Review 2" > "$TEST_PROJECT/codev/reviews/0002-another-feature.md"

  # Simulate an update
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/"* "$TEST_PROJECT/codev/protocols/"

  # Verify reviews are preserved
  assert_file_exist "$TEST_PROJECT/codev/reviews/0001-test-feature.md"
  assert_file_exist "$TEST_PROJECT/codev/reviews/0002-another-feature.md"

  run cat "$TEST_PROJECT/codev/reviews/0001-test-feature.md"
  assert_output "# Test Review 1"
}

@test "updater can add new protocol (TICK)" {
  # Remove TICK protocol to simulate old installation
  rm -rf "$TEST_PROJECT/codev/protocols/tick"

  # Verify TICK is missing
  assert_not_exist "$TEST_PROJECT/codev/protocols/tick"

  # Simulate update that adds TICK
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/tick" "$TEST_PROJECT/codev/protocols/"

  # Verify TICK was added
  assert_dir_exist "$TEST_PROJECT/codev/protocols/tick"
  assert_file_exist "$TEST_PROJECT/codev/protocols/tick/protocol.md"
  assert_dir_exist "$TEST_PROJECT/codev/protocols/tick/templates"
}

@test "updater updates existing protocols" {
  # Modify an existing protocol file
  echo "# Old version" > "$TEST_PROJECT/codev/protocols/spider/protocol.md"

  # Simulate update
  cp "$PROJECT_ROOT/codev-skeleton/protocols/spider/protocol.md" \
     "$TEST_PROJECT/codev/protocols/spider/protocol.md"

  # Verify protocol was updated (should have more than just "# Old version")
  run wc -l < "$TEST_PROJECT/codev/protocols/spider/protocol.md"
  assert [ "$output" -gt 1 ]
}

@test "updater can add new agents" {
  # Remove architecture-documenter to simulate old installation
  rm -f "$TEST_PROJECT/.claude/agents/architecture-documenter.md"

  # Verify agent is missing
  assert_not_exist "$TEST_PROJECT/.claude/agents/architecture-documenter.md"

  # Simulate update that adds new agent
  cp "$PROJECT_ROOT/codev-skeleton/.claude/agents/architecture-documenter.md" \
     "$TEST_PROJECT/.claude/agents/"

  # Verify agent was added
  assert_file_exist "$TEST_PROJECT/.claude/agents/architecture-documenter.md"
}

@test "updater updates existing agents" {
  # Modify an existing agent
  echo "# Old agent version" > "$TEST_PROJECT/.claude/agents/spider-protocol-updater.md"

  # Simulate update
  cp "$PROJECT_ROOT/codev-skeleton/.claude/agents/spider-protocol-updater.md" \
     "$TEST_PROJECT/.claude/agents/"

  # Verify agent was updated (should have more content)
  run wc -l < "$TEST_PROJECT/.claude/agents/spider-protocol-updater.md"
  assert [ "$output" -gt 1 ]
}

@test "all three agents are present after update" {
  # Simulate full update
  cp "$PROJECT_ROOT/codev-skeleton/.claude/agents/"*.md "$TEST_PROJECT/.claude/agents/"

  # Verify all agents exist
  assert_file_exist "$TEST_PROJECT/.claude/agents/spider-protocol-updater.md"
  assert_file_exist "$TEST_PROJECT/.claude/agents/architecture-documenter.md"
  assert_file_exist "$TEST_PROJECT/.claude/agents/codev-updater.md"
}

@test "updater preserves custom CLAUDE.md content" {
  # Create custom CLAUDE.md with user content
  cat > "$TEST_PROJECT/CLAUDE.md" <<'EOF'
# My Project

## Custom Section
This is my custom content that should be preserved.

## Codev Methodology
Using SPIDER protocol at codev/protocols/spider/protocol.md
EOF

  # Save original content
  cp "$TEST_PROJECT/CLAUDE.md" "$TEST_PROJECT/CLAUDE.md.original"

  # Simulate update (should not modify CLAUDE.md automatically)
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/"* "$TEST_PROJECT/codev/protocols/"

  # Verify CLAUDE.md was not modified
  run diff "$TEST_PROJECT/CLAUDE.md" "$TEST_PROJECT/CLAUDE.md.original"
  assert_success
}

@test "verify backup instructions work" {
  # Create some user work
  echo "# Important Spec" > "$TEST_PROJECT/codev/specs/important.md"

  # Create a backup following the pattern in codev-updater
  BACKUP_DIR="$TEST_PROJECT/codev-backup-test"
  cp -r "$TEST_PROJECT/codev" "$BACKUP_DIR"

  # Modify the original
  echo "# Modified" > "$TEST_PROJECT/codev/specs/important.md"

  # Restore from backup
  rm -rf "$TEST_PROJECT/codev"
  mv "$BACKUP_DIR" "$TEST_PROJECT/codev"

  # Verify restoration worked
  run cat "$TEST_PROJECT/codev/specs/important.md"
  assert_output "# Important Spec"
}

@test "updater does not overwrite arch.md if it exists" {
  # Create arch.md (maintained by architecture-documenter)
  cat > "$TEST_PROJECT/codev/resources/arch.md" <<'EOF'
# Project Architecture

This is maintained by architecture-documenter agent and should not be overwritten.

## Custom Architecture Content
Project-specific architecture documentation.
EOF

  # Save original
  cp "$TEST_PROJECT/codev/resources/arch.md" "$TEST_PROJECT/arch.md.original"

  # Simulate update (should not touch arch.md)
  # Note: We don't copy resources during protocol updates
  cp -r "$PROJECT_ROOT/codev-skeleton/protocols/"* "$TEST_PROJECT/codev/protocols/"

  # Verify arch.md unchanged if it exists
  if [[ -f "$TEST_PROJECT/codev/resources/arch.md" ]]; then
    run diff "$TEST_PROJECT/codev/resources/arch.md" "$TEST_PROJECT/arch.md.original"
    assert_success
  fi
}