#!/usr/bin/env bash
# Run fast, local tests only (no Claude integration tests)

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

# Run all tests except Claude integration tests
echo "Running Codev installation tests..."
echo "================================"

# Use portable shell glob pattern instead of find
# Build array of test files
declare -a TEST_FILES=()

for test_file in "$PROJECT_ROOT"/tests/*.bats; do
    # Skip if no matches (glob didn't expand)
    [ ! -e "$test_file" ] && continue

    # Get just the filename
    filename="$(basename "$test_file")"

    # Skip integration and Claude tests
    case "$filename" in
        *claude*|*integration*)
            continue
            ;;
        *)
            TEST_FILES+=("$test_file")
            ;;
    esac
done

if [ ${#TEST_FILES[@]} -eq 0 ]; then
    echo "No test files found"
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
echo "Test run complete!"