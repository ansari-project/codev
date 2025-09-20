#!/usr/bin/env bats
# Test Codev installation when CLAUDE.md already exists

load 'lib/bats-support/load'
load 'lib/bats-assert/load'
load 'lib/bats-file/load'
load 'helpers/common.bash'
load 'helpers/mock_mcp.bash'

setup() {
  export PROJECT_ROOT="$(cd "$BATS_TEST_DIRNAME/.." && pwd)"
  export TEST_PROJECT
  TEST_PROJECT=$(setup_test_project)

  # Mock Zen as present for consistent testing
  mock_mcp_present
}

teardown() {
  # Clean up test project
  if [[ -n "${TEST_PROJECT:-}" ]]; then
    teardown_test_project "$TEST_PROJECT"
  fi

  # Restore original PATH
  restore_path
}

@test "install preserves existing CLAUDE.md content" {
  # Create existing CLAUDE.md with custom content
  local existing_content="# My Custom Project Instructions

This project uses special conventions:
- Always use tabs, not spaces
- Never commit directly to main
- Custom lint rules apply

## Important Notes
Do not modify this file!"

  create_claude_md "$TEST_PROJECT" "$existing_content"

  # Verify it exists before installation
  assert_file_exist "$TEST_PROJECT/CLAUDE.md"
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$existing_content"

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Verify CLAUDE.md still has original content
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$existing_content"

  # Verify Codev structure was still installed
  assert_dir_exist "$TEST_PROJECT/codev"
  assert_dir_exist "$TEST_PROJECT/codev/protocols"
}

@test "existing CLAUDE.md with Codev reference is preserved" {
  # Create CLAUDE.md that already mentions Codev
  local existing_content="# Project with Codev

This project already uses Codev methodology.

## Active Protocol
Protocol: SPIDER
Location: codev/protocols/spider/protocol.md

## Custom Rules
- Additional project-specific rules here"

  create_claude_md "$TEST_PROJECT" "$existing_content"

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Content should be unchanged
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$existing_content"
}

@test "empty CLAUDE.md is preserved" {
  # Create empty CLAUDE.md
  touch "$TEST_PROJECT/CLAUDE.md"
  assert_file_exist "$TEST_PROJECT/CLAUDE.md"

  # Check it's empty
  local size_before
  size_before=$(wc -c < "$TEST_PROJECT/CLAUDE.md" | tr -d ' ')
  assert_equal "$size_before" "0"

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Should still be empty
  local size_after
  size_after=$(wc -c < "$TEST_PROJECT/CLAUDE.md" | tr -d ' ')
  assert_equal "$size_after" "0"
}

@test "CLAUDE.md with different protocol choice is respected" {
  # User explicitly chose SPIDER-SOLO
  local existing_content="# Project Instructions

## Codev Protocol
Using SPIDER-SOLO protocol (no multi-agent consultation needed)
See: codev/protocols/spider-solo/protocol.md"

  create_claude_md "$TEST_PROJECT" "$existing_content"

  # Even though Zen is present, respect user's SPIDER-SOLO choice
  run is_zen_available
  assert_success  # Zen is available

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Content unchanged
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$existing_content"

  # Both protocols installed but user chose SOLO
  assert_spider_protocol "$TEST_PROJECT"
  assert_spider_solo_protocol "$TEST_PROJECT"
}

@test "CLAUDE.md permissions are preserved" {
  # Create CLAUDE.md with specific permissions
  create_claude_md "$TEST_PROJECT" "# Test content"
  chmod 600 "$TEST_PROJECT/CLAUDE.md"  # Owner read/write only

  # Get initial permissions
  if [[ "$OSTYPE" == "darwin"* ]]; then
    initial_perms=$(stat -f "%Lp" "$TEST_PROJECT/CLAUDE.md")
  else
    initial_perms=$(stat -c "%a" "$TEST_PROJECT/CLAUDE.md")
  fi
  assert_equal "$initial_perms" "600"

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Check permissions unchanged
  if [[ "$OSTYPE" == "darwin"* ]]; then
    final_perms=$(stat -f "%Lp" "$TEST_PROJECT/CLAUDE.md")
  else
    final_perms=$(stat -c "%a" "$TEST_PROJECT/CLAUDE.md")
  fi
  assert_equal "$final_perms" "600"
}

@test "CLAUDE.md with non-ASCII content is preserved" {
  # Test with unicode and special characters
  local existing_content="# Project 项目 📚

## Règles du Projet
- Use € for currency
- Support 日本語 comments
- Emoji reactions allowed: 👍 ❌ ✅"

  create_claude_md "$TEST_PROJECT" "$existing_content"

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Content should be byte-for-byte identical
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$existing_content"
}

@test "CLAUDE.md as symlink is not followed" {
  # Create actual file elsewhere
  mkdir -p "$TEST_PROJECT/docs"
  echo "# Real CLAUDE content" > "$TEST_PROJECT/docs/CLAUDE_REAL.md"

  # Create symlink
  ln -s docs/CLAUDE_REAL.md "$TEST_PROJECT/CLAUDE.md"

  # Verify it's a symlink
  assert [ -L "$TEST_PROJECT/CLAUDE.md" ]

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Should still be a symlink
  assert [ -L "$TEST_PROJECT/CLAUDE.md" ]

  # Target content unchanged
  run cat "$TEST_PROJECT/docs/CLAUDE_REAL.md"
  assert_output "# Real CLAUDE content"
}

@test "readonly CLAUDE.md does not block installation" {
  # Create CLAUDE.md and make it readonly
  create_claude_md "$TEST_PROJECT" "# Readonly file"
  chmod 444 "$TEST_PROJECT/CLAUDE.md"  # Read-only for everyone

  # Install should still succeed (doesn't need to modify CLAUDE.md)
  run install_from_local "$TEST_PROJECT"
  assert_success

  # File still readonly with same content
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "# Readonly file"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    perms=$(stat -f "%Lp" "$TEST_PROJECT/CLAUDE.md")
  else
    perms=$(stat -c "%a" "$TEST_PROJECT/CLAUDE.md")
  fi
  assert_equal "$perms" "444"
}

@test "CLAUDE.md with large content is preserved" {
  # Create a large CLAUDE.md (not huge, just substantial)
  local large_content="# Large CLAUDE.md File

## Section 1: Overview"

  # Add 50 sections with content
  for i in {1..50}; do
    large_content="$large_content

## Section $i: Details
This is section $i with multiple lines of content.
- Point 1 for section $i
- Point 2 for section $i
- Point 3 for section $i"
  done

  create_claude_md "$TEST_PROJECT" "$large_content"

  # Get line count before
  local lines_before
  lines_before=$(wc -l < "$TEST_PROJECT/CLAUDE.md")

  # Install Codev
  run install_from_local "$TEST_PROJECT"
  assert_success

  # Verify exact same content
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$large_content"

  # Verify line count unchanged
  local lines_after
  lines_after=$(wc -l < "$TEST_PROJECT/CLAUDE.md")
  assert_equal "$lines_after" "$lines_before"
}

@test "multiple installs do not modify CLAUDE.md" {
  # Create initial CLAUDE.md
  local content="# Project Instructions
Version: 1.0
Do not modify"

  create_claude_md "$TEST_PROJECT" "$content"

  # Install multiple times
  run install_from_local "$TEST_PROJECT"
  assert_success

  run install_from_local "$TEST_PROJECT"
  assert_success

  run install_from_local "$TEST_PROJECT"
  assert_success

  # Content should be unchanged after multiple installs
  run cat "$TEST_PROJECT/CLAUDE.md"
  assert_output "$content"
}