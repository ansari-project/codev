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
# Clone codev repository to temporary directory
TEMP_DIR=$(mktemp -d)
git clone --depth 1 https://github.com/ansari-project/codev.git "$TEMP_DIR"

# Copy skeleton structure to your project
mkdir -p codev
cp -r "$TEMP_DIR/codev-skeleton/"* ./codev/

# Copy .claude directory with agents to project root
cp -r "$TEMP_DIR/codev-skeleton/.claude" ./

# Create required directories (ensures they exist even if skeleton is incomplete)
mkdir -p codev/specs
mkdir -p codev/plans

# Clean up
rm -rf "$TEMP_DIR"
```

**Directory Structure Should Be**:
```
project-root/
├── codev/              # All Codev files go here!
│   ├── protocols/      # Protocol definitions
│   ├── specs/          # Specifications
│   ├── plans/          # Implementation plans
│   ├── reviews/        # Reviews and lessons learned
│   └── resources/      # Reference materials and documentation
├── .claude/            # AI agent definitions
│   └── agents/         # Custom agents
│       ├── spider-protocol-updater.md
│       └── architecture-documenter.md
├── AGENTS.md           # Universal AI agent instructions (AGENTS.md standard)
├── CLAUDE.md           # Claude Code-specific (identical to AGENTS.md)
└── [project files]     # Your actual code
```

### Step 3: Protocol Selection

The entire `codev/protocols/` directory is copied with all available protocols. The active protocol is selected by modifying the AGENTS.md and CLAUDE.md files to reference the appropriate protocol path.

Available protocols:
- `codev/protocols/spider/` - Full SPIDER with multi-agent consultation
- `codev/protocols/spider-solo/` - Single-agent variant
- `codev/protocols/tick/` - Fast autonomous implementation for simple tasks

### Step 4: Create or Update AGENTS.md and CLAUDE.md

**IMPORTANT**: Check if AGENTS.md or CLAUDE.md already exists before modifying!

Both files should contain identical content - AGENTS.md follows the [AGENTS.md standard](https://agents.md/) for cross-tool compatibility (Cursor, GitHub Copilot, etc.), while CLAUDE.md provides native support for Claude Code.

```bash
# Check if either file exists
if [ -f "AGENTS.md" ] || [ -f "CLAUDE.md" ]; then
    echo "Agent configuration file exists. Updating to include Codev references..."
    # APPEND Codev-specific instructions to existing file(s)
    # Ensure both files exist and are synchronized
else
    # Ask user for permission
    echo "No AGENTS.md or CLAUDE.md found. May I create them? [y/n]"
    # If yes, create both files with Codev structure
    # Note: No template exists in skeleton - AI should create appropriate ones based on project context
fi
```

**When updating existing files**, add these sections:
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

Key sections to verify in AGENTS.md and CLAUDE.md:
- Active protocol path
- Consultation guidelines (if using SPIDER)
- File naming conventions (####-descriptive-name.md)
- Both files should be identical in content

### Step 5: Verify Installation

**Quick Verification Checklist**:
```bash
# 1. Verify codev/ directory exists
test -d codev && echo "✓ codev/ directory exists" || echo "✗ FAIL: codev/ directory missing"

# 2. Verify required subdirectories
test -d codev/protocols/spider && echo "✓ SPIDER protocol exists" || echo "✗ FAIL: SPIDER protocol missing"
test -d codev/protocols/tick && echo "✓ TICK protocol exists" || echo "✗ FAIL: TICK protocol missing"
test -d codev/specs && echo "✓ specs/ directory exists" || echo "✗ FAIL: specs/ directory missing"
test -d .claude/agents && echo "✓ .claude/agents/ directory exists" || echo "✗ FAIL: .claude/agents/ directory missing"

# 3. Verify protocol is readable
test -r codev/protocols/spider/protocol.md && echo "✓ protocol.md is readable" || echo "✗ FAIL: Cannot read protocol.md"

# 4. Verify AGENTS.md and CLAUDE.md exist and reference codev
test -f AGENTS.md && echo "✓ AGENTS.md exists" || echo "✗ FAIL: AGENTS.md missing"
test -f CLAUDE.md && echo "✓ CLAUDE.md exists" || echo "✗ FAIL: CLAUDE.md missing"
grep -q "codev" AGENTS.md && echo "✓ AGENTS.md references codev" || echo "✗ FAIL: AGENTS.md missing codev references"
grep -q "codev" CLAUDE.md && echo "✓ CLAUDE.md references codev" || echo "✗ FAIL: CLAUDE.md missing codev references"
```

**Detailed Structure Check**:
```bash
# View complete directory structure
find codev -type d -maxdepth 2 | sort

# Expected output:
# codev/
# codev/plans
# codev/protocols
# codev/protocols/spider
# codev/protocols/spider-solo
# codev/reviews
# codev/resources
# codev/specs

# Verify protocol content
cat codev/protocols/spider/protocol.md | head -20
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
  - Directory name matches references in AGENTS.md and CLAUDE.md
  - All templates are present
  - manifest.yaml is updated

## Protocol Comparison

| Feature | SPIDER | SPIDER-SOLO |
|---------|--------|-------------|
| Multi-agent consultation | ✓ (GPT-5 + Gemini Pro) | ✗ (self-review only) |
| Prerequisites | Zen MCP server | None |
| Specification reviews | Multi-agent external | Self-review |
| Plan reviews | Multi-agent external | Self-review |
| Implementation reviews | Multi-agent per phase | Self-review |
| Best for | Production features | Exploration & prototypes |
| Speed | Slower (thorough) | Faster (good enough) |

## Optional: Spider Protocol Updater Agent

For projects using Claude Code with the Task tool, you can install the `spider-protocol-updater` agent to help evolve the SPIDER protocol by learning from other implementations:

**Installation**:
```bash
# Create the .claude/agents directory if it doesn't exist
mkdir -p .claude/agents

# Copy the spider-protocol-updater agent from codev source
# (Assuming codev source is available)
cp path/to/codev-skeleton/.claude/agents/spider-protocol-updater.md .claude/agents/

# Also copy the architecture-documenter agent (for TICK protocol support)
cp path/to/codev-skeleton/.claude/agents/architecture-documenter.md .claude/agents/
```

**What the agents do**:

**spider-protocol-updater**:
- Analyzes SPIDER implementations in other GitHub repositories
- Identifies improvements and lessons learned
- Recommends protocol updates based on community usage
- Helps the protocol evolve through collective wisdom

**architecture-documenter**:
- Maintains comprehensive architecture documentation (arch.md)
- Documents directory structure, utilities, and design patterns
- Automatically invoked at the end of TICK protocol reviews
- Helps developers quickly understand the codebase structure

**How to use**:
```bash
# Check a specific repository for improvements
"Check the ansari-project/webapp repo for any SPIDER improvements"

# Periodic review of SPIDER implementations
"Scan recent SPIDER implementations for protocol enhancements"
```

**Note**: These agents require:
- Claude Code with Task tool support
- Access to GitHub repositories (for spider-protocol-updater)
- The agent files in `.claude/agents/`

## Remember

- The goal is THREE documents per feature (spec, plan, review)
- Each stage gets one pull request
- Phases can have multiple commits within the PR
- User approval required before creating PRs
- Context drives development