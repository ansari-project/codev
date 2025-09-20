#!/bin/bash

# Codev Installation Script
# This script installs the Codev methodology framework into an existing project

set -e

echo "======================================"
echo "     Codev Installation Script"
echo "======================================"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Warning: Current directory is not a git repository."
    echo "It's recommended to use Codev with version control."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
fi

# Check if codev directory already exists
if [ -d "codev" ]; then
    echo "Error: 'codev' directory already exists in this project."
    echo "To reinstall, please remove the existing codev directory first."
    exit 1
fi

echo "Creating Codev directory structure..."

# Create the basic structure
mkdir -p codev/{protocols/spider/{templates,hooks},ref/{lessons,consultations},specs,plans}

echo "✓ Directory structure created"

# Get the source directory (where this script is located)
SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Installing SP(IDE)R protocol..."

# Copy protocol files if they exist in the source
if [ -f "$SOURCE_DIR/codev/protocols/spider/protocol.md" ]; then
    cp "$SOURCE_DIR/codev/protocols/spider/protocol.md" codev/protocols/spider/
    cp "$SOURCE_DIR/codev/protocols/spider/manifest.yaml" codev/protocols/spider/
    cp "$SOURCE_DIR/codev/protocols/spider/templates/"*.md codev/protocols/spider/templates/ 2>/dev/null || true
    echo "✓ SP(IDE)R protocol installed"
else
    echo "⚠️  Protocol files not found in source. You'll need to add them manually."
fi

# Copy CLAUDE.md if it doesn't exist
if [ ! -f "CLAUDE.md" ]; then
    if [ -f "$SOURCE_DIR/CLAUDE.md" ]; then
        cp "$SOURCE_DIR/CLAUDE.md" ./
        echo "✓ CLAUDE.md installed"
    else
        echo "⚠️  CLAUDE.md not found in source. You'll need to create it manually."
    fi
else
    echo "ℹ️  CLAUDE.md already exists. Not overwriting."
    echo "   Please manually merge Codev instructions if needed."
fi

# Copy example specification if source exists
if [ -f "$SOURCE_DIR/codev/specs/example-spec.md" ]; then
    cp "$SOURCE_DIR/codev/specs/example-spec.md" codev/specs/
    echo "✓ Example specification installed"
fi

# Create a .gitignore for the codev directory if it doesn't exist
if [ ! -f "codev/.gitignore" ]; then
    cat > codev/.gitignore << 'EOF'
# Temporary files
*.tmp
*.swp
*~

# OS files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/

# Consultation logs (may contain sensitive data)
ref/consultations/*.log

# Local configuration overrides
local-config.yaml
EOF
    echo "✓ .gitignore created for codev directory"
fi

# Create a README in the codev directory
cat > codev/README.md << 'EOF'
# Codev Methodology

This directory contains the Codev methodology framework for this project.

## Structure

- `protocols/` - Installed development protocols (currently SP(IDE)R)
- `ref/` - Reference materials, research, and consultation logs
- `specs/` - Feature specifications (what to build)
- `plans/` - Implementation plans (how to build)

## Active Protocol

**SP(IDE)R** - See `protocols/spider/protocol.md` for details.

## Quick Start

1. Create a specification: Use `protocols/spider/templates/spec.md`
2. Create a plan: Use `protocols/spider/templates/plan.md`
3. Follow the IDE loop: Implement → Defend → Evaluate
4. Complete with review: Use `protocols/spider/templates/review.md`

## For AI Agents

Point AI agents to the CLAUDE.md file in the project root for instructions.

## Documentation

- Protocol details: `protocols/spider/protocol.md`
- Templates: `protocols/spider/templates/`
- Example: `specs/example-spec.md`
EOF
echo "✓ Codev README created"

echo ""
echo "======================================"
echo "    Installation Complete!"
echo "======================================"
echo ""
echo "Codev has been installed in your project."
echo ""
echo "Next steps:"
echo "1. Review CLAUDE.md for AI agent instructions"
echo "2. Check codev/specs/example-spec.md for an example"
echo "3. Read codev/protocols/spider/protocol.md for protocol details"
echo "4. Create your first specification using the template"
echo ""
echo "To use with an AI agent, tell them:"
echo "  'Follow the Codev methodology described in CLAUDE.md'"
echo ""
echo "Happy coding with Codev!"