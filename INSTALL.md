# Codev Installation Guide for AI Agents

## Overview

This document provides instructions for AI agents to install the Codev methodology framework into a user's project. Codev is a documentation-driven development methodology that uses structured protocols to guide collaborative software development.

## Installation Process

### Step 1: Check Prerequisites

When a user requests Codev installation, first determine which protocol variant to install:

```bash
# Check if Zen MCP server is available
mcp list
# or try
mcp__zen__version
```

**Decision Tree**:
- If Zen MCP is available → Install **SPIDER** protocol (with multi-agent consultation)
- If Zen MCP is not available:
  - Ask: "Zen MCP server is not detected. Would you like to:"
    1. "Install Zen MCP server for multi-agent consultation features"
    2. "Use SPIDER-SOLO protocol (single-agent variant)"

### Step 2: Copy the Codev Skeleton

The skeleton provides the basic directory structure and protocol files:

```bash
# Option A: If you have access to the codev repository
cp -r [codev-repo]/codev-skeleton/* ./

# Option B: Create the structure manually
mkdir -p codev/{protocols,ref,specs,plans}
mkdir -p codev/ref/lessons
```

### Step 3: Select and Install Protocol

Based on Step 1 decision:

#### For SPIDER (with multi-agent):
```bash
# Ensure the spider protocol is in place
ls codev/protocols/spider/protocol.md
# Should include:
# - protocol.md (with multi-agent consultation)
# - manifest.yaml
# - templates/spec.md
# - templates/plan.md
# - templates/lessons.md
```

#### For SPIDER-SOLO (single-agent):
```bash
# Use the spider-solo variant
mv codev/protocols/spider-solo codev/protocols/spider
rm -rf codev/protocols/spider-solo
# Or rename references in CLAUDE.md to spider-solo
```

### Step 4: Create or Update CLAUDE.md

Create the main agent instructions file in the project root:

```bash
# Copy from skeleton
cp codev-skeleton/CLAUDE.md ./CLAUDE.md

# Update the active protocol reference
# For SPIDER: codev/protocols/spider/protocol.md
# For SPIDER-SOLO: codev/protocols/spider-solo/protocol.md
```

Key sections to verify in CLAUDE.md:
- Active protocol path
- Consultation guidelines (if using SPIDER)
- File naming conventions (####-descriptive-name.md)

### Step 5: Initialize First Specification

Help the user start their first feature:

```bash
# Create the first specification
echo "# Specification: [Feature Name]" > codev/specs/0001-feature-name.md

# Point them to the template
echo "Use the template at codev/protocols/spider/templates/spec.md"
```

### Step 6: Verify Installation

Run these checks:

```bash
# Check directory structure
tree codev -L 2

# Expected output:
# codev/
# ├── protocols/
# │   └── spider/  (or spider-solo/)
# ├── ref/
# │   └── lessons/
# ├── specs/
# └── plans/

# Check protocol is accessible
cat codev/protocols/spider/protocol.md | head -20

# Check CLAUDE.md references correct protocol
grep "protocols/spider" CLAUDE.md
```

## Quick Installation Script

For automated installation, use this bash script:

```bash
#!/bin/bash
# codev-install.sh

# Check for Zen MCP
if command -v mcp &> /dev/null; then
    PROTOCOL="spider"
    echo "✓ Zen MCP detected - installing SPIDER protocol"
else
    echo "✗ Zen MCP not found"
    read -p "Install SPIDER-SOLO (single-agent)? [y/n]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PROTOCOL="spider-solo"
    else
        echo "Installation cancelled"
        exit 1
    fi
fi

# Create directory structure
mkdir -p codev/{protocols,ref/lessons,specs,plans}

# Copy protocol files (assumes access to codev-skeleton)
cp -r /path/to/codev-skeleton/protocols/$PROTOCOL codev/protocols/

# Copy CLAUDE.md
cp /path/to/codev-skeleton/CLAUDE.md ./CLAUDE.md

# Update CLAUDE.md with correct protocol
if [[ "$PROTOCOL" == "spider-solo" ]]; then
    sed -i '' 's/spider\/protocol.md/spider-solo\/protocol.md/g' CLAUDE.md
fi

echo "✓ Codev installed with $PROTOCOL protocol"
echo "Start with: Create a specification in codev/specs/0001-your-feature.md"
```

## Post-Installation Guidance

After installation, guide the user:

1. **First Specification**: "What would you like to build first? I'll create a specification using the SPIDER protocol."

2. **Explain the Flow**:
   - Specification (with clarifying questions)
   - Plan (with phases)
   - Implementation (IDE loop per phase)
   - Review (lessons learned)

3. **Document Naming**: Always use ####-descriptive-name.md format

4. **Git Integration**: Encourage commits at each document milestone

## Troubleshooting

### Common Issues:

**Q: User wants multi-agent but Zen MCP isn't working**
- Try: "Let me help you install Zen MCP server first"
- Fallback: "We can start with SPIDER-SOLO and migrate later"

**Q: User has existing codev directory**
- Ask: "You have an existing codev/ directory. Should I:"
  - "Back it up and reinstall"
  - "Update the protocol only"
  - "Keep existing setup"

**Q: User wants a different protocol name**
- Protocols can be renamed, just ensure:
  - Directory name matches references in CLAUDE.md
  - All templates are present
  - manifest.yaml is updated

## Protocol Comparison

| Feature | SPIDER | SPIDER-SOLO |
|---------|--------|-------------|
| Multi-agent consultation | ✓ (GPT-5 + Gemini Pro) | ✗ |
| Prerequisites | Zen MCP server | None |
| Specification reviews | 2 (multi-agent) | 0 (self-review) |
| Plan reviews | 2 (multi-agent) | 0 (self-review) |
| Code reviews per phase | Multi-agent | Self-review |
| Recommended for | Critical projects | Rapid prototyping |

## Remember

- The goal is THREE documents per feature (spec, plan, lessons)
- Each phase gets ONE atomic commit
- User approval required before phase commits
- Documentation drives development, not vice versa