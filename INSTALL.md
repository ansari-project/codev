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

# Detect if Claude Code is available and install agents to appropriate location
if command -v claude &> /dev/null; then
    # Claude Code detected - install agents to .claude/agents/
    mkdir -p .claude/agents
    cp -r "$TEMP_DIR/codev-skeleton/agents/"* ./.claude/agents/ 2>/dev/null || true
    echo "✓ Agents installed to .claude/agents/ (Claude Code detected)"
else
    # Non-Claude Code environment - agents already in codev/agents/ from skeleton
    echo "✓ Agents installed to codev/agents/ (universal location)"
fi

# Create required directories (ensures they exist even if skeleton is incomplete)
mkdir -p codev/specs
mkdir -p codev/plans

# Clean up
rm -rf "$TEMP_DIR"
```

**Directory Structure Should Be**:
```
project-root/
├── .ruler/             # Optional: Ruler-managed agent configs
│   ├── codev.md        # Codev-specific instructions (if using Ruler)
│   └── ruler.toml      # Ruler configuration
├── codev/              # All Codev files go here!
│   ├── protocols/      # Protocol definitions
│   ├── projectlist.md  # Master project tracking
│   ├── specs/          # Specifications
│   ├── plans/          # Implementation plans
│   ├── reviews/        # Reviews and lessons learned
│   ├── resources/      # Reference materials and documentation
│   └── agents/         # Custom agents (non-Claude Code tools)
│       └── spider-protocol-updater.md
├── .claude/            # Claude Code-specific directory (if using Claude Code)
│   └── agents/         # Custom agents (Claude Code only)
│       └── spider-protocol-updater.md
├── AGENTS.md           # Universal AI agent instructions (if NOT using Claude Code)
├── CLAUDE.md           # Claude Code-specific instructions (if using Claude Code)
└── [project files]     # Your actual code
```

**Note**:
- Agents are installed to either `.claude/agents/` (Claude Code) OR `codev/agents/` (other tools), not both
- Agent configuration file is either `CLAUDE.md` (Claude Code) OR `AGENTS.md` (other tools), not both

### Step 3: Protocol Selection

The entire `codev/protocols/` directory is copied with all available protocols. The active protocol is selected by modifying the agent configuration files to reference the appropriate protocol path:
- For **Ruler users**: Modify `.ruler/codev.md` and run `npx @intellectronica/ruler apply`
- For **direct management**: Modify `CLAUDE.md` (Claude Code) or `AGENTS.md` (other tools)

Available protocols:
- `codev/protocols/spider/` - Full SPIDER with multi-agent consultation
- `codev/protocols/spider-solo/` - Single-agent variant
- `codev/protocols/tick/` - Fast autonomous implementation for simple tasks
- `codev/protocols/experiment/` - Disciplined experimentation for research and prototyping

### Step 4: Create or Update Agent Configuration Files

**IMPORTANT**: Check if the user is using Ruler for agent configuration management first!

AGENTS.md follows the [AGENTS.md standard](https://agents.md/) for cross-tool compatibility (Cursor, GitHub Copilot, etc.), while CLAUDE.md provides native support for Claude Code.

```bash
# Check if Ruler is in use
if [ -d ".ruler" ] && [ -f ".ruler/ruler.toml" ]; then
    echo "Ruler detected. Adding Codev instructions via .ruler/codev.md..."

    # Create .ruler/codev.md with Codev-specific instructions
    # Run ruler apply to regenerate all tool-specific configs
    npx @intellectronica/ruler apply

    echo "✓ Codev instructions added to .ruler/codev.md and distributed via ruler"
else
    # No Ruler - use single-file approach based on detected environment
    echo "No Ruler detected. Using direct agent configuration..."

    # Detect environment and set target file
    if command -v claude &> /dev/null; then
        TARGET_FILE="CLAUDE.md"
        echo "Claude Code detected - using CLAUDE.md"
    else
        TARGET_FILE="AGENTS.md"
        echo "Other AI tool detected - using AGENTS.md"
    fi

    # Check if target file exists
    if [ -f "$TARGET_FILE" ]; then
        echo "Agent configuration file ($TARGET_FILE) exists. Updating to include Codev references..."
        # APPEND Codev-specific instructions to existing file
    else
        # Ask user for permission
        echo "No $TARGET_FILE found. May I create it? [y/n]"
        # If yes, create the appropriate file with Codev structure
        # Note: No template exists in skeleton - AI should create appropriate one based on project context
    fi
fi
```

**Content to add** (same for both approaches):

For Ruler users, create `.ruler/codev.md` with this content.
For direct management, AGENTS.md and CLAUDE.md should contain identical content - AGENTS.md follows the [AGENTS.md standard](https://agents.md/) for cross-tool compatibility (Cursor, GitHub Copilot, etc.), while CLAUDE.md provides native support for Claude Code.

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

Key sections to verify:
- For **Ruler users**: Ensure content in `.ruler/codev.md` is correct before running `npx @intellectronica/ruler apply`
- For **direct management** (CLAUDE.md or AGENTS.md):
  - Active protocol path
  - Consultation guidelines (if using SPIDER)
  - File naming conventions (####-descriptive-name.md)

### Step 5: Verify Installation

**Run the Doctor Command**:

The easiest way to verify your installation is to run the `codev-doctor` command:

```bash
./codev/bin/codev-doctor
```

This checks:
- **Core dependencies**: Node.js, tmux, ttyd, git, Python (with versions)
- **AI CLI dependencies**: Claude Code, Gemini CLI, Codex CLI (at least one required)
- **Python packages**: typer (for the consult tool)

If any required dependencies are missing, the doctor will show install instructions.

**Note**: If the doctor reports missing dependencies, your AI agent can guide you through installing them. Simply share the doctor output and ask for help.

**Quick Codev Structure Verification**:
```bash
# 1. Verify codev/ directory exists
test -d codev && echo "✓ codev/ directory exists" || echo "✗ FAIL: codev/ directory missing"

# 2. Verify required subdirectories
test -d codev/protocols/spider && echo "✓ SPIDER protocol exists" || echo "✗ FAIL: SPIDER protocol missing"
test -d codev/protocols/tick && echo "✓ TICK protocol exists" || echo "✗ FAIL: TICK protocol missing"
test -d codev/specs && echo "✓ specs/ directory exists" || echo "✗ FAIL: specs/ directory missing"

# 3. Verify agents are installed in appropriate location
if command -v claude &> /dev/null; then
    test -d .claude/agents && echo "✓ .claude/agents/ directory exists (Claude Code)" || echo "✗ FAIL: .claude/agents/ directory missing"
else
    test -d codev/agents && echo "✓ codev/agents/ directory exists (universal)" || echo "✗ FAIL: codev/agents/ directory missing"
fi

# 4. Verify protocol is readable
test -r codev/protocols/spider/protocol.md && echo "✓ protocol.md is readable" || echo "✗ FAIL: Cannot read protocol.md"

# 5. Verify agent configuration exists and references codev
# Check for Ruler first, then fall back to single-file detection
if [ -d ".ruler" ] && [ -f ".ruler/ruler.toml" ]; then
    test -f .ruler/codev.md && echo "✓ .ruler/codev.md exists (Ruler setup)" || echo "✗ FAIL: .ruler/codev.md missing"
    grep -q "codev" .ruler/codev.md && echo "✓ .ruler/codev.md references codev" || echo "✗ FAIL: .ruler/codev.md missing codev references"
elif command -v claude &> /dev/null; then
    test -f CLAUDE.md && echo "✓ CLAUDE.md exists (Claude Code)" || echo "✗ FAIL: CLAUDE.md missing"
    grep -q "codev" CLAUDE.md && echo "✓ CLAUDE.md references codev" || echo "✗ FAIL: CLAUDE.md missing codev references"
else
    test -f AGENTS.md && echo "✓ AGENTS.md exists (universal)" || echo "✗ FAIL: AGENTS.md missing"
    grep -q "codev" AGENTS.md && echo "✓ AGENTS.md references codev" || echo "✗ FAIL: AGENTS.md missing codev references"
fi
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

**Note for future changes**: To modify the active protocol or other agent instructions:
- **Ruler users**: Edit `.ruler/codev.md` and run `npx @intellectronica/ruler apply`
- **Direct management**: Edit both `AGENTS.md` and `CLAUDE.md` (keep them synchronized)

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
  - Directory name matches references in agent configuration file (AGENTS.md or CLAUDE.md)
  - All templates are present
  - manifest.yaml is updated

## Protocol Comparison

| Feature | SPIDER | SPIDER-SOLO | TICK | EXPERIMENT |
|---------|--------|-------------|------|------------|
| Multi-agent consultation | ✓ (GPT-5 + Gemini Pro) | ✗ (self-review only) | ✗ | ✗ |
| Prerequisites | Zen MCP server | None | None | None |
| Specification reviews | Multi-agent external | Self-review | Minimal | N/A |
| Plan reviews | Multi-agent external | Self-review | Minimal | N/A |
| Implementation reviews | Multi-agent per phase | Self-review | Post-implementation | Results-focused |
| Best for | Production features | Medium features | Small tasks | Research & prototyping |
| Speed | Slower (thorough) | Medium | Fast | Flexible |
| Output | Spec + Plan + Review | Spec + Plan + Review | Spec + Plan + Review | notes.md per experiment |

## Workflow Agents

Codev includes specialized workflow agents that can be invoked for specific tasks. These agents are automatically installed during the setup process to the appropriate location based on your development environment.

**Available Agents**:
- **spider-protocol-updater**: Analyzes SPIDER implementations in other repositories and recommends protocol improvements
- **architecture-documenter**: Maintains comprehensive architecture documentation (arch.md)
- **codev-updater**: Updates your Codev installation to the latest version

**Agent Location**:
- **Claude Code users**: Agents are installed to `.claude/agents/` and accessible via native Claude Code agent invocation
- **Other tool users**: Agents are installed to `codev/agents/` and can be manually referenced or invoked

The installation process automatically detects your environment and installs agents to the appropriate location.

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

## Architect-Builder Pattern (Optional)

For projects with parallelizable components, Codev includes the Architect-Builder pattern for running multiple AI agents simultaneously.

### Prerequisites

- **ttyd** (web-based terminal): `brew install ttyd` on macOS
- **tmux** (terminal multiplexer): `brew install tmux` on macOS
- **Node.js** 18+ (for agent-farm runtime)
- **git** 2.5+ (with worktree support)

### Setup

The architect-builder tools are included in the codev installation:

```bash
# Ensure .builders/ and .agent-farm/ are in your .gitignore
echo ".builders/" >> .gitignore
echo ".agent-farm/" >> .gitignore

# Build the agent-farm TypeScript
cd agent-farm && npm install && npm run build && cd ..

# Verify the agent-farm CLI is available
./codev/bin/agent-farm --help
```

### Shell Alias (Recommended)

Add to your `~/.bashrc` or `~/.zshrc` for convenience:

```bash
# Agent Farm alias - run from any codev project
alias af='./codev/bin/agent-farm'
```

Then use shorter commands:
```bash
af start           # Start architect dashboard
af spawn -p 0003   # Spawn builder
af status          # Check status
af stop            # Stop everything
```

### Configuration

Create `codev/config.json` to customize commands:

```json
{
  "shell": {
    "architect": "claude --model opus",
    "builder": "claude --model sonnet",
    "shell": "bash"
  },
  "templates": {
    "dir": "codev/templates"
  },
  "roles": {
    "dir": "codev/roles"
  }
}
```

Override via CLI:
```bash
./codev/bin/agent-farm start --architect-cmd "claude --model opus"
./codev/bin/agent-farm spawn --project 0003 --builder-cmd "claude"
```

### Quick Start

```bash
# Start the architect dashboard
./codev/bin/agent-farm start

# Spawn a builder for a spec
./codev/bin/agent-farm spawn --project 0003

# Check status of all builders
./codev/bin/agent-farm status

# Open a utility shell
./codev/bin/agent-farm util

# Annotate a file for review
./codev/bin/agent-farm annotate src/auth/login.ts

# Clean up a builder (checks for uncommitted changes first)
./codev/bin/agent-farm cleanup --project 0003

# Force cleanup (WARNING: may lose uncommitted work)
./codev/bin/agent-farm cleanup --project 0003 --force

# Stop the architect and all builders
./codev/bin/agent-farm stop

# Manage port allocations (for multi-project support)
./codev/bin/agent-farm ports list
./codev/bin/agent-farm ports cleanup
```

### How It Works

1. **Architect** (you + primary AI) creates specs and plans
2. **Builders** (autonomous AI agents) implement specs in isolated git worktrees
3. Each builder runs in a **tmux session** with **web terminal** (ttyd) access
4. **Review comments** are stored directly in files using `// REVIEW:` syntax
5. Builders create PRs when complete; architect reviews and merges

### Key Features

- **Multi-project support**: Each project gets its own port block (4200-4299, 4300-4399, etc.)
- **Safe cleanup**: Refuses to delete worktrees with uncommitted changes unless `--force` is used
- **Orphan detection**: Automatically cleans up stale tmux sessions on startup
- **Configurable commands**: Customize architect, builder, and shell commands via `config.json`

### Key Files

- `.agent-farm/state.json` - Runtime state (builders, ports, processes)
- `~/.agent-farm/ports.json` - Global port registry (for multi-project support)
- `codev/config.json` - Project configuration
- `codev/templates/` - Dashboard and annotation HTML templates
- `codev/roles/` - Architect and builder role prompts
- `codev/bin/agent-farm` - CLI wrapper script

See `codev/specs/0002-architect-builder.md` for full documentation.

## Remember

- The goal is THREE documents per feature (spec, plan, review)
- Each stage gets one pull request
- Phases can have multiple commits within the PR
- User approval required before creating PRs
- Context drives development