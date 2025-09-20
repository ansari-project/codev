#!/usr/bin/env bash
# Run Claude integration tests (slower, requires Claude CLI)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BATS_EXEC="$PROJECT_ROOT/tests/lib/bats-core/bin/bats"

# Support DRY_RUN mode for testing
DRY_RUN="${DRY_RUN:-}"

# Check if bats is available
if [ ! -f "$BATS_EXEC" ]; then
    echo "Error: bats-core not found at $BATS_EXEC" >&2
    echo "Please ensure test framework is properly installed" >&2
    exit 1
fi

# Enhanced Claude availability check
if ! command -v claude >/dev/null 2>&1; then
    echo "Warning: Claude CLI not found in PATH" >&2
    echo "Integration tests will be skipped" >&2
    echo "" >&2
    echo "To run integration tests, install Claude CLI:" >&2
    echo "  https://claude.ai/download" >&2
    exit 0
fi

# Verify Claude can run with isolation flags
if [ -z "$DRY_RUN" ]; then
    if ! claude --version --strict-mcp-config --mcp-config '[]' --settings '{}' >/dev/null 2>&1; then
        echo "Error: Claude cannot run with required isolation flags" >&2
        echo "Please ensure you have a recent version of Claude CLI" >&2
        exit 1
    fi
fi

# Run Claude integration tests
echo "Running Claude integration tests..."
echo "==================================="
echo "Note: These tests use Claude with isolation flags"
echo ""

# Use portable shell glob pattern instead of find
# Build array of test files
declare -a TEST_FILES=()

for test_file in "$PROJECT_ROOT"/tests/*.bats; do
    # Skip if no matches (glob didn't expand)
    [ ! -e "$test_file" ] && continue

    # Get just the filename
    filename="$(basename "$test_file")"

    # Include only integration and Claude tests
    case "$filename" in
        *claude*|*integration*)
            TEST_FILES+=("$test_file")
            ;;
        *)
            continue
            ;;
    esac
done

if [ ${#TEST_FILES[@]} -eq 0 ]; then
    echo "No integration test files found"
    exit 0
fi

if [ -n "$DRY_RUN" ]; then
    echo "DRY RUN: Would execute:"
    echo "$BATS_EXEC" "${TEST_FILES[@]}"
    exit 0
fi

# Run tests (array expansion is safe from word splitting)
"$BATS_EXEC" "${TEST_FILES[@]}"

echo ""
echo "Integration test run complete!"