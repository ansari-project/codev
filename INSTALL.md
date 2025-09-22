# Codev Installation Guide for AI Agents

## Overview

This document provides instructions for AI agents to install the Codev methodology framework into a user's project. Codev is a context-driven development methodology that uses structured protocols to guide collaborative software development.

### Core Principles
1. **Context Drives Code** - Context definitions flow from high-level specifications down to implementation details
2. **Human-AI Collaboration** - Designed for seamless cooperation between developers and AI agents
3. **Evolving Methodology** - The process itself evolves and improves with each project

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

### Step 2: Create and Populate the Codev Directory

**IMPORTANT**: All Codev files go INSIDE a `codev/` directory, not in the project root!

```bash
# Create a temporary directory for installation
mkdir -p /tmp/codev-install
cd /tmp/codev-install

# Download and extract just the codev-skeleton
curl -L https://github.com/ansari-project/codev/archive/main.tar.gz | tar xz --strip-components=1 codev-main/codev-skeleton

# Go back to your project directory
cd -

# Create the codev directory in your project
mkdir -p codev

# Copy the skeleton structure
cp -r /tmp/codev-install/codev-skeleton/* codev/

# Clean up
rm -rf /tmp/codev-install
```

**Directory Structure Should Be**:
```
project-root/
├── codev/              # All Codev files go here!
│   ├── protocols/      # Protocol definitions
│   ├── specs/          # Specifications
│   ├── plans/          # Implementation plans
│   ├── reviews/        # Reviews and lessons learned
│   └── resources/      # Reference materials (llms.txt, guides, etc.)
├── CLAUDE.md           # In project root
└── [project files]     # Your actual code
```

### Step 3: Protocol Selection

The entire `codev/protocols/` directory is copied with all available protocols. The active protocol is selected by modifying the CLAUDE.md file to reference the appropriate protocol path.

Available protocols:
- `codev/protocols/spider/` - Full SPIDER with multi-agent consultation
- `codev/protocols/spider-solo/` - Single-agent variant

### Step 4: Create or Update CLAUDE.md

**IMPORTANT**: Check if CLAUDE.md already exists before modifying!

```bash
# Check if CLAUDE.md exists
if [ -f "CLAUDE.md" ]; then
    echo "CLAUDE.md exists. Updating to include Codev references..."
    # APPEND Codev-specific instructions to existing file
else
    # Ask user for permission
    echo "No CLAUDE.md found. May I create one? [y/n]"
    # If yes, copy from skeleton
    cp codev/CLAUDE.md.template ./CLAUDE.md
fi
```

**When updating existing CLAUDE.md**, add these sections:
```markdown
## Codev Methodology

This project uses the Codev context-driven development methodology.

### Active Protocol
- Protocol: SPIDER (or SPIDER-SOLO)
- Location: codev/protocols/spider/protocol.md

### Directory Structure
- Specifications: codev/specs/
- Plans: codev/plans/
- Reviews: codev/reviews/
- Resources: codev/resources/

See codev/protocols/spider/protocol.md for full protocol details.
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
# Verify codev is a directory, not spread across root
ls -la codev/

# Check directory structure (using find for cross-platform compatibility)
find codev -type d -maxdepth 2 | sort

# Expected structure:
# codev/                    # <-- Everything inside here!
# ├── protocols/
# │   ├── spider/
# │   └── spider-solo/
# ├── specs/
# ├── plans/
# ├── reviews/
# └── resources/

# WRONG structure (files in root):
# project-root/
# ├── protocols/           # ❌ Wrong!
# ├── specs/               # ❌ Wrong!
# └── codev/               # Should all be inside here

# Check protocol is accessible
cat codev/protocols/spider/protocol.md | head -20

# Check CLAUDE.md references correct protocol
grep "protocols/spider" CLAUDE.md
```

## Post-Installation Guidance

After installation, guide the user:

1. **First Specification**: "What would you like to build first? I can help create a specification. Which protocol would you prefer - SPIDER (with multi-agent consultation) or SPIDER-SOLO?"

2. **Explain the Flow**:
   - **Build in phases using the IDE loop**:
     - **I**mplement: Build the code
     - **D**efend: Write comprehensive tests
     - **E**valuate: Verify requirements are met
   - Each phase follows: Specification → Plan → IDE Loop → Review

3. **Document Naming**: Always use ####-descriptive-name.md format

4. **Git Integration**:
   - Each stage gets one pull request
   - Phases can have multiple commits
   - User approval required before PRs

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

## Optional: Spider Protocol Updater Agent

For projects using Claude Code with the Task tool, you can install the `spider-protocol-updater` agent to help evolve the SPIDER protocol by learning from other implementations:

**Installation**:
```bash
# Create the .claude/agents directory if it doesn't exist
mkdir -p .claude/agents

# Copy the spider-protocol-updater agent from codev source
# (Assuming codev source is available)
cp path/to/codev/.claude/agents/spider-protocol-updater.md .claude/agents/
```

**What it does**:
- Analyzes SPIDER implementations in other GitHub repositories
- Identifies improvements and lessons learned
- Recommends protocol updates based on community usage
- Helps the protocol evolve through collective wisdom

**How to use**:
```bash
# Check a specific repository for improvements
"Check the ansari-project/webapp repo for any SPIDER improvements"

# Periodic review of SPIDER implementations
"Scan recent SPIDER implementations for protocol enhancements"
```

**Note**: This agent requires:
- Claude Code with Task tool support
- Access to GitHub repositories
- The agent file in `.claude/agents/spider-protocol-updater.md`

## Remember

- The goal is THREE documents per feature (spec, plan, review)
- Each stage gets one pull request
- Phases can have multiple commits within the PR
- User approval required before creating PRs
- Context drives development