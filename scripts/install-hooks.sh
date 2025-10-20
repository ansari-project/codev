#!/usr/bin/env bash
# Install git hooks for Codev development
# Usage: ./scripts/install-hooks.sh

set -e

# Get the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ensure hooks directory exists
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Install pre-commit hook
echo "Installing pre-commit hook..."
cp "$PROJECT_ROOT/hooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"
chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"

echo "✅ Git hooks installed successfully"
echo ""
echo "The pre-commit hook will now run tests before each commit."
echo "To bypass (not recommended): git commit --no-verify"
