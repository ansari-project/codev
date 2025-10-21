# Codev Project Instructions for AI Agents

> **Note**: This file follows the [AGENTS.md standard](https://agents.md/) for cross-tool compatibility with Cursor, GitHub Copilot, and other AI coding assistants. For Claude Code users, an identical [CLAUDE.md](CLAUDE.md) file is maintained for native support. Both files contain the same content and should be kept synchronized.

## Project Context

**THIS IS THE CODEV SOURCE REPOSITORY - WE ARE SELF-HOSTED**

This project IS Codev itself, and we use our own methodology for development. All new features and improvements to Codev should follow the SPIDER protocol defined in `codev/protocols/spider/protocol.md`.

### Important: Understanding This Repository's Structure

This repository has a dual nature that's important to understand:

1. **`codev/`** - This is OUR instance of Codev
   - This is where WE (the Codev project) keep our specs, plans, reviews, and resources
   - When working on Codev features, you work in this directory
   - Example: `codev/specs/0001-test-infrastructure.md` is a feature spec for Codev itself

2. **`codev-skeleton/`** - This is the template for OTHER projects
   - This is what gets copied to other projects when they install Codev
   - Contains the protocol definitions, templates, and agents
   - Does NOT contain specs/plans/reviews (those are created by users)
   - Think of it as "what Codev provides" vs "how Codev uses itself"

**When to modify each**:
- **Modify `codev/`**: When implementing features for Codev (specs, plans, reviews, our architecture docs)
- **Modify `codev-skeleton/`**: When updating protocols, templates, or agents that other projects will use

## Quick Start

You are working in the Codev project itself, with multiple development protocols available:

**Available Protocols**:
- **SPIDER**: Multi-phase development with consultation - `codev/protocols/spider/protocol.md`
- **SPIDER-SOLO**: Single-agent variant - `codev/protocols/spider-solo/protocol.md`
- **TICK**: Fast autonomous implementation - `codev/protocols/tick/protocol.md`

Key locations:
- Protocol details: `codev/protocols/` (Choose appropriate protocol)
- Specifications go in: `codev/specs/`
- Plans go in: `codev/plans/`
- Reviews go in: `codev/reviews/`

## Protocol Selection Guide

### Use TICK for:
- Small features (< 300 lines of code)
- Well-defined tasks with clear requirements
- Bug fixes with known solutions
- Simple configuration changes
- Utility function additions
- Tasks needing fast iteration

### Use SPIDER for:
- New protocols or protocol variants
- Major changes to existing protocols
- New example projects
- Significant changes to installation process
- Complex features requiring multiple phases
- Architecture changes
- System design decisions

### Skip formal protocols for:
- README typos or minor documentation fixes
- Small bug fixes in templates
- Dependency updates

## Core Workflow

1. **When asked to build NEW FEATURES FOR CODEV**: Start with the Specification phase
2. **Create exactly THREE documents per feature**: spec, plan, and lessons (all with same filename)
3. **Follow the SP(IDE)R phases**: Specify → Plan → (Implement → Defend → Evaluate) → Review
4. **Use multi-agent consultation by default** unless user says "without consultation"

### CRITICAL CONSULTATION CHECKPOINTS (DO NOT SKIP):
- After writing implementation code → STOP → Consult GPT-5 and Gemini Pro
- After writing tests → STOP → Consult GPT-5 and Gemini Pro
- ONLY THEN present results to user for evaluation

## Directory Structure
```
project-root/
├── codev/
│   ├── protocols/           # Development protocols
│   │   ├── spider/         # Multi-phase development with consultation
│   │   ├── spider-solo/    # Single-agent SPIDER variant
│   │   └── tick/           # Fast autonomous implementation
│   ├── specs/              # Feature specifications (WHAT to build)
│   ├── plans/              # Implementation plans (HOW to build)
│   ├── reviews/            # Reviews and lessons learned from each feature
│   ├── resources/          # Reference materials
│   │   └── arch.md         # Architecture documentation (maintained by agent)
│   └── agents/             # AI agent definitions (universal location)
│       ├── spider-protocol-updater.md
│       ├── architecture-documenter.md
│       └── codev-updater.md
├── AGENTS.md              # This file (universal AI agent instructions)
├── CLAUDE.md              # Claude Code-specific (identical to AGENTS.md)
└── [project code]
```

## File Naming Convention

Use sequential numbering with descriptive names:
- Specification: `codev/specs/0001-feature-name.md`
- Plan: `codev/plans/0001-feature-name.md`
- Review: `codev/reviews/0001-feature-name.md`

**Note**: Sequential numbering is shared across all protocols (SPIDER, SPIDER-SOLO, TICK)

## Multi-Agent Consultation

**DEFAULT BEHAVIOR**: Consultation is ENABLED by default with:
- **Gemini 2.5 Pro** (gemini-2.5-pro) for deep analysis
- **GPT-5 Codex** (gpt-5-codex) for coding and architecture perspective

To disable: User must explicitly say "without multi-agent consultation"

**Consultation Checkpoints**:
1. **Specification Phase**: After draft and after human review
2. **Planning Phase**: After plan creation and after human review
3. **Implementation Phase**: After code implementation
4. **Defend Phase**: After test creation
5. **Evaluation Phase**: After evaluation completion
6. **Review Phase**: After review document

## Spider Protocol Updater Agent

The `spider-protocol-updater` agent helps evolve the SPIDER protocol by analyzing implementations in other repositories and identifying improvements to incorporate back into the main protocol.

**When to use**:
- Periodic review of SPIDER implementations in other repositories
- When notified of significant SPIDER improvements in external projects
- To check if a specific repository has protocol enhancements worth adopting

**How to invoke**:
```bash
# Ask Claude to check a specific repository
"Check the ansari-project/webapp repo for any SPIDER improvements we should adopt"

# Or for periodic reviews
"It's been a month since we last checked for SPIDER improvements in other repos"
```

**What the agent does**:
1. Analyzes remote GitHub repositories implementing SPIDER
2. Compares their protocol.md with our canonical version
3. Reviews their lessons learned and review documents
4. Classifies improvements as Universal, Domain-specific, Experimental, or Anti-pattern
5. Recommends specific protocol updates with justification

**Agent location**: `codev/agents/spider-protocol-updater.md`

## Architecture Documenter Agent

The `architecture-documenter` agent maintains comprehensive architecture documentation (`codev/resources/arch.md`) that serves as the definitive reference for understanding the project's structure, components, and design decisions.

**When to use**:
- After significant implementation milestones
- When new features are completed or modules added
- During code reviews to capture architectural patterns
- When specifications introduce new architectural components
- Periodically during active development for up-to-date documentation

**How it's used**:
- Automatically invoked at the end of TICK protocol reviews
- Can be manually invoked for architecture updates
- Maintains directory structure, utilities, design patterns, and integration points

**What the agent does**:
1. Reviews specs, plans, and reviews for architectural information
2. Scans the actual implementation to verify documented structure
3. Maintains comprehensive `arch.md` with:
   - Complete directory structure
   - All utility functions and helpers
   - Key architectural patterns
   - Component relationships
   - Technology stack details
4. Ensures documentation matches actual codebase state

**Agent location**: `codev/agents/architecture-documenter.md`

## Codev Updater Agent

The `codev-updater` agent keeps your Codev installation current with the latest improvements from the main repository while preserving your project work.

**When to use**:
- Periodic framework updates (monthly recommended)
- When new protocols are released (like TICK)
- When agents receive improvements or bug fixes
- When protocol templates are enhanced
- To check for available updates

**How to invoke**:
```bash
# Update to latest version
"Please update my codev framework to the latest version"

# Check for available updates
"Are there any updates available for codev?"
```

**What the agent does**:
1. Checks current installation and identifies installed components
2. Fetches latest version from the main codev repository
3. **Creates backups** of current installation
4. Updates protocols, agents, and templates
5. **Preserves all user work** (specs, plans, reviews)
6. Provides update report and rollback instructions

**Safety features**:
- Always creates timestamped backups before updating
- Never modifies user's specs, plans, or reviews
- Preserves CLAUDE.md customizations
- Provides clear rollback instructions if needed
- Verifies successful update before completing

**Agent location**: `codev/agents/codev-updater.md`

## Git Workflow

### 🚨 ABSOLUTE PROHIBITION: NEVER USE `git add -A` or `git add .` 🚨

**THIS IS A CRITICAL SECURITY REQUIREMENT - NO EXCEPTIONS**

**BANNED COMMANDS (NEVER USE THESE)**:
```bash
git add -A        # ❌ ABSOLUTELY FORBIDDEN
git add .         # ❌ ABSOLUTELY FORBIDDEN
git add --all     # ❌ ABSOLUTELY FORBIDDEN
```

**WHY THIS IS CRITICAL**:
- Can expose API keys, secrets, and credentials
- May commit large data files or sensitive personal configs
- Could reveal private information in temporary files
- Has caused security incidents in the past

**MANDATORY APPROACH - ALWAYS ADD FILES EXPLICITLY**:
```bash
# ✅ CORRECT - Always specify exact files
git add codev/specs/0001-feature.md
git add src/components/TodoList.tsx
git add tests/helpers/common.bash

# ✅ CORRECT - Can use specific patterns if careful
git add codev/specs/*.md
git add tests/*.bats
```

**BEFORE EVERY COMMIT**:
1. Run `git status` to see what will be added
2. Add each file or directory EXPLICITLY by name
3. Never use shortcuts that could add unexpected files
4. If you catch yourself typing `git add -A` or `git add .`, STOP immediately

### Commit Messages
```
[Spec 0001] Initial specification draft
[Spec 0001] Specification with multi-agent review
[Spec 0001][Phase: user-auth] feat: Add password hashing
```

### Branch Naming
```
spider/0001-feature-name/phase-name
```

## Consultation Guidelines

When the user requests "Consult" or "consultation" (including variations like "ultrathink and consult"), this specifically means:
- Use Gemini 2.5 Pro (gemini-2.5-pro) for deep analysis
- Use GPT-5 Codex (gpt-5-codex) for coding and architecture perspective
- Both models should be consulted unless explicitly specified otherwise

## Important Notes

1. **ALWAYS check `codev/protocols/spider/protocol.md`** for detailed phase instructions
2. **Use provided templates** from `codev/protocols/spider/templates/`
3. **Document all deviations** from the plan with reasoning
4. **Create atomic commits** for each phase completion
5. **Maintain >90% test coverage** where possible

## Lessons Learned from Test Infrastructure (Spec 0001)

### Critical Requirements

1. **Multi-Agent Consultation is MANDATORY**:
   - MUST consult GPT-5 AND Gemini Pro after implementation
   - MUST get FINAL approval from ALL experts on FIXED versions
   - Consultation happens BEFORE presenting to user, not after
   - Skipping consultation leads to rework and missed issues

2. **Test Environment Isolation**:
   - **NEVER touch real $HOME directories** in tests
   - Always use XDG sandboxing: `export XDG_CONFIG_HOME="$TEST_PROJECT/.xdg"`
   - Tests must be hermetic - no side effects on user environment
   - Use failing shims instead of removing from PATH

3. **Strong Assertions**:
   - Never use `|| true` patterns that mask failures
   - Avoid `assert true` - be specific about expectations
   - Create control tests to verify default behavior
   - Prefer behavior testing over implementation testing

4. **Platform Compatibility**:
   - Test on both macOS and Linux
   - Handle stat command differences
   - Use portable shell constructs
   - Gracefully handle missing dependencies

5. **Review Phase Requirements**:
   - Update ALL documentation (README, CLAUDE.md, specs, plans)
   - Review for systematic issues across the project
   - Update protocol documents based on lessons learned
   - Create comprehensive lessons learned document

## For Detailed Instructions

**READ THE FULL PROTOCOL**: `codev/protocols/spider/protocol.md`

This contains:
- Detailed phase descriptions
- Required evidence for each phase
- Expert consultation requirements
- Templates and examples
- Best practices

---

*Remember: Context drives code. When in doubt, write more documentation rather than less.*
