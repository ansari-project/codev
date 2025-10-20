#!/usr/bin/env bash
# Common test helpers for Codev installation tests

# Create a temporary test project directory
# Returns the path to the created directory
setup_test_project() {
  local test_dir
  test_dir=$(mktemp -d "${TMPDIR:-/tmp}/codev-test.XXXXXX")
  echo "$test_dir"
}

# Clean up test project directory
# Usage: teardown_test_project <directory>
teardown_test_project() {
  local test_dir="$1"
  if [[ -n "$test_dir" && -d "$test_dir" ]]; then
    rm -rf "$test_dir"
  fi
}

# Install Codev from local skeleton
# Usage: install_from_local <target_dir>
install_from_local() {
  local target_dir="$1"
  local source_dir="$PROJECT_ROOT/codev-skeleton"

  if [[ ! -d "$source_dir" ]]; then
    echo "Error: codev-skeleton not found at $source_dir" >&2
    return 1
  fi

  # Create codev directory
  mkdir -p "$target_dir/codev"

  # Copy all files including dotfiles into codev/ subdirectory
  # Using cp -a to preserve modes and timestamps
  cp -a "$source_dir/." "$target_dir/codev/"

  # Handle agent installation conditionally (mimics INSTALL.md logic)
  if command -v claude &> /dev/null; then
    # Claude Code detected - install agents to .claude/agents/
    mkdir -p "$target_dir/.claude/agents"
    cp "$source_dir/agents/"*.md "$target_dir/.claude/agents/" 2>/dev/null || true
  fi
  # Note: For non-Claude Code, agents are already in codev/agents/ from skeleton copy

  # Verify copy was successful by checking for key protocol directory
  if [[ ! -d "$target_dir/codev/protocols/spider" ]]; then
    echo "Error: Installation failed - protocols not found" >&2
    return 1
  fi

  return 0
}

# Create a CLAUDE.md file with specified content
# Usage: create_claude_md <directory> <content>
create_claude_md() {
  local dir="$1"
  local content="$2"

  mkdir -p "$dir"
  cat > "$dir/CLAUDE.md" << EOF
$content
EOF
}

# Assert that a Codev project structure exists
# Usage: assert_codev_structure <directory>
assert_codev_structure() {
  local dir="$1"

  # Check for essential directories
  assert_dir_exist "$dir/codev"
  assert_dir_exist "$dir/codev/specs"
  assert_dir_exist "$dir/codev/plans"
  assert_dir_exist "$dir/codev/reviews"
  assert_dir_exist "$dir/codev/protocols"

  # Check for essential files
  assert_file_exist "$dir/CLAUDE.md"
  # INSTALL.md is optional (provided by user, not skeleton)
}

# Assert that SPIDER protocol is properly configured
# Usage: assert_spider_protocol <directory>
assert_spider_protocol() {
  local dir="$1"

  assert_dir_exist "$dir/codev/protocols/spider"
  assert_file_exist "$dir/codev/protocols/spider/protocol.md"
  assert_file_exist "$dir/codev/protocols/spider/templates/spec.md"
  assert_file_exist "$dir/codev/protocols/spider/templates/plan.md"
}

# Assert that SPIDER-SOLO protocol is properly configured
# Usage: assert_spider_solo_protocol <directory>
assert_spider_solo_protocol() {
  local dir="$1"

  assert_dir_exist "$dir/codev/protocols/spider-solo"
  assert_file_exist "$dir/codev/protocols/spider-solo/protocol.md"
  assert_file_exist "$dir/codev/protocols/spider-solo/templates/spec.md"
  assert_file_exist "$dir/codev/protocols/spider-solo/templates/plan.md"
}

# Get the content of CLAUDE.md
# Usage: get_claude_md_content <directory>
get_claude_md_content() {
  local dir="$1"
  if [[ -f "$dir/CLAUDE.md" ]]; then
    cat "$dir/CLAUDE.md"
  else
    echo ""
  fi
}

# Check if a file contains specific text (literal match)
# Usage: file_contains <file> <text>
file_contains() {
  local file="$1"
  local text="$2"
  if [[ -f "$file" ]] && grep -Fq -- "$text" "$file"; then
    return 0
  else
    return 1
  fi
}