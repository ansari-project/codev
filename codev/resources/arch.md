# Codev Architecture Documentation

## Overview

Codev is a context-driven development methodology framework that treats natural language specifications as first-class code. This repository serves a dual purpose: it is both the canonical source of the Codev framework AND a self-hosted instance where Codev uses its own methodology to develop itself.

## Technology Stack

### Core Technologies
- **Shell/Bash**: Primary scripting language for installation and testing
- **Markdown**: Documentation format for specs, plans, reviews, and agent definitions
- **Git**: Version control with explicit commit strategy for each protocol phase
- **YAML**: Configuration format for protocol manifests

### Testing Framework
- **bats-core**: Bash Automated Testing System (vendored in `tests/lib/`)
- **bats-support**: Helper functions for bats tests
- **bats-assert**: Assertion helpers for test validation
- **bats-file**: File system assertion helpers

### Supported Platforms
- macOS (Darwin)
- Linux (GNU/Linux)
- Requires: Bash 4.0+, Git, standard Unix utilities

## Repository Dual Nature

This repository has a unique dual structure:

### 1. `codev/` - Our Instance (Self-Hosted Development)
This is where the Codev project uses Codev to develop itself:
- **Location**: `/Users/mwk/Development/ansari-project/codev/codev/`
- **Purpose**: Development of Codev features using Codev methodology
- **Contains**:
  - `specs/` - Feature specifications for Codev itself
  - `plans/` - Implementation plans for Codev features
  - `reviews/` - Lessons learned from Codev development
  - `resources/` - Reference materials (this file, llms.txt, etc.)
  - `protocols/` - Working copies of protocols for development
  - `agents/` - Agent definitions (canonical location)

**Example**: `codev/specs/0001-test-infrastructure.md` documents the test infrastructure feature we built for Codev.

### 2. `codev-skeleton/` - Template for Other Projects
This is what gets distributed to users when they install Codev:
- **Location**: `/Users/mwk/Development/ansari-project/codev/codev-skeleton/`
- **Purpose**: Clean template for new Codev installations
- **Contains**:
  - `protocols/` - Protocol definitions (SPIDER, SPIDER-SOLO, TICK)
  - `specs/` - Empty directory (users create their own)
  - `plans/` - Empty directory (users create their own)
  - `reviews/` - Empty directory (users create their own)
  - `resources/` - Empty directory (users add their own)
  - `agents/` - Agent definitions (copied during installation)

**Key Distinction**: Skeleton directories are empty placeholders; codev/ contains our actual work.

## Complete Directory Structure

```
codev/                                  # Project root
├── codev/                              # Our self-hosted instance
│   ├── protocols/                      # Working copies for development
│   │   ├── spider/                     # Multi-phase with consultation
│   │   │   ├── protocol.md             # SPIDER protocol definition
│   │   │   ├── templates/              # Document templates
│   │   │   │   ├── spec.md
│   │   │   │   ├── plan.md
│   │   │   │   └── review.md
│   │   │   └── manifest.yaml           # Protocol metadata
│   │   ├── spider-solo/                # Single-agent variant
│   │   │   ├── protocol.md             # SPIDER-SOLO protocol
│   │   │   ├── templates/              # Simplified templates
│   │   │   │   ├── spec.md
│   │   │   │   ├── plan.md
│   │   │   │   └── review.md
│   │   │   └── manifest.yaml
│   │   └── tick/                       # Fast autonomous protocol
│   │       ├── protocol.md             # TICK protocol definition
│   │       ├── templates/              # Lightweight templates
│   │       │   ├── spec.md
│   │       │   ├── plan.md
│   │       │   └── review.md
│   │       └── manifest.yaml
│   ├── specs/                          # Our feature specifications
│   │   └── 0001-test-infrastructure.md # Test suite specification
│   ├── plans/                          # Our implementation plans
│   │   └── 0001-test-infrastructure.md # Test suite plan
│   ├── reviews/                        # Our lessons learned
│   │   └── 0001-test-infrastructure.md # Test suite review
│   ├── resources/                      # Our reference materials
│   │   ├── arch.md                     # This file
│   │   └── llms.txt                    # LLM-friendly documentation
│   └── agents/                         # Agent definitions (canonical)
│       ├── spider-protocol-updater.md  # Protocol evolution agent
│       ├── architecture-documenter.md  # Architecture documentation agent
│       └── codev-updater.md            # Framework update agent
├── codev-skeleton/                     # Template for distribution
│   ├── protocols/                      # Same structure as codev/protocols/
│   │   ├── spider/
│   │   ├── spider-solo/
│   │   └── tick/
│   ├── specs/                          # Empty (placeholder with .gitkeep)
│   │   └── .gitkeep                    # Ensures directory is tracked in git
│   ├── plans/                          # Empty (placeholder)
│   ├── reviews/                        # Empty (placeholder)
│   ├── resources/                      # Empty (placeholder)
│   └── agents/                         # Agent templates for installation
│       ├── spider-protocol-updater.md
│       ├── architecture-documenter.md
│       └── codev-updater.md
├── .claude/                            # Claude Code-specific directory (self-hosted only)
│   └── agents/                         # Agents for Claude Code (installed from codev/agents/)
│       ├── spider-protocol-updater.md  # Protocol evolution agent
│       ├── architecture-documenter.md  # Architecture documentation agent
│       └── codev-updater.md            # Framework update agent
├── tests/                              # Test infrastructure
│   ├── lib/                            # Vendored test frameworks
│   │   ├── bats-core/                  # Core test runner
│   │   ├── bats-support/               # Helper functions
│   │   ├── bats-assert/                # Assertions
│   │   └── bats-file/                  # File assertions
│   ├── helpers/                        # Test utilities
│   │   ├── common.bash                 # Setup, teardown, assertions
│   │   └── mock_mcp.bash               # MCP simulation
│   ├── fixtures/                       # Test data
│   ├── 00_framework.bats               # Framework validation
│   ├── 01_framework_validation.bats    # Core framework tests
│   ├── 02_runner_behavior.bats         # Test runner behavior
│   ├── 03_test_helpers.bats            # Helper function tests
│   ├── 10_fresh_spider.bats            # SPIDER installation tests
│   ├── 11_fresh_spider_solo.bats       # SPIDER-SOLO installation tests
│   ├── 12_existing_claude_md.bats      # CLAUDE.md preservation tests
│   ├── 20_claude_execution.bats        # Claude CLI integration tests
│   ├── 20_codev_updater.bats           # Updater agent tests
│   └── README.md                       # Test documentation
├── scripts/                            # Utility scripts
│   ├── run-tests.sh                    # Fast tests (no integration)
│   ├── run-integration-tests.sh        # All tests including Claude CLI
│   └── install-hooks.sh                # Install git pre-commit hooks
├── hooks/                              # Git hook templates
│   └── pre-commit                      # Pre-commit hook (runs test suite)
├── examples/                           # Example projects
│   └── todo-manager/                   # Demo Todo Manager app
├── docs/                               # Additional documentation
│   └── why.md                          # Background and rationale
├── AGENTS.md                           # Universal AI agent instructions
├── CLAUDE.md                           # Claude Code-specific (identical to AGENTS.md)
├── INSTALL.md                          # Installation instructions for agents
├── README.md                           # Project overview
└── LICENSE                             # MIT license
```

## Core Components

### 1. Development Protocols

#### SPIDER Protocol (`codev/protocols/spider/`)
**Purpose**: Multi-phase development with multi-agent consultation

**Phases**:
1. **Specify** - Define requirements with multi-agent review
2. **Plan** - Break work into phases with multi-agent review
3. **IDE Loop** (per phase):
   - **Implement** - Build the code
   - **Defend** - Write comprehensive tests
   - **Evaluate** - Verify requirements and get approval
4. **Review** - Document lessons learned with multi-agent consultation

**Key Features**:
- Multi-agent consultation at each major checkpoint
- Default models: Gemini 2.5 Pro + GPT-5
- Multiple user approval points
- Comprehensive documentation requirements
- Suitable for complex features (>300 lines)

**Files**:
- `protocol.md` - Complete protocol specification
- `templates/spec.md` - Specification template
- `templates/plan.md` - Planning template
- `templates/review.md` - Review template

#### SPIDER-SOLO Protocol (`codev/protocols/spider-solo/`)
**Purpose**: Single-agent variant of SPIDER for environments without multi-agent support

**Key Differences from SPIDER**:
- Self-review instead of multi-agent consultation
- Same phase structure (Specify → Plan → IDE → Review)
- Simplified templates without consultation sections
- Faster execution (no external agent coordination)
- Best for prototyping and exploration

#### TICK Protocol (`codev/protocols/tick/`)
**Purpose**: **T**ask **I**dentification, **C**oding, **K**ickout - Fast autonomous implementation

**Workflow**:
1. **Specification** (autonomous) - Define task
2. **Planning** (autonomous) - Create single-phase plan
3. **Implementation** (autonomous) - Execute plan
4. **Review** (with multi-agent consultation) - Document and validate

**Key Features**:
- Single autonomous execution from spec to implementation
- Multi-agent consultation ONLY at review phase
- Two user checkpoints: start and end
- Suitable for simple tasks (<300 lines)
- Architecture documentation updated automatically at review

**Selection Criteria**:
- Use TICK for: Bug fixes, simple features, utilities, configuration
- Use SPIDER for: Complex features, architecture changes, unclear requirements

### 2. Agent System

Codev includes specialized AI agents for workflow automation. Agents are installed conditionally based on the development environment:

#### Agent Installation Architecture

Codev uses **tool-agnostic agent installation** that detects the development environment and installs agents to the appropriate location for optimal integration.

**Conditional Installation Logic** (from `INSTALL.md`):
```bash
# Detect Claude Code and install to appropriate location
if command -v claude &> /dev/null; then
    # Claude Code detected - install to .claude/agents/
    mkdir -p .claude/agents
    cp -r codev-skeleton/agents/* ./.claude/agents/
    echo "✓ Agents installed to .claude/agents/ (Claude Code detected)"
else
    # Other tools - agents remain in codev/agents/
    # (already present from skeleton copy)
    echo "✓ Agents installed to codev/agents/ (universal location)"
fi
```

**Agent Locations by Environment**:
- **Claude Code users**: `.claude/agents/` (native integration via Claude Code's agent system)
- **Other tools** (Cursor, Copilot, etc.): `codev/agents/` (universal location via AGENTS.md standard)
- **Canonical source**: `codev/agents/` in this repository (self-hosted development)

**Design Rationale**:
1. **Native integration when available** - Claude Code's `.claude/agents/` provides built-in agent execution
2. **Universal fallback** - Other tools can reference `codev/agents/` via AGENTS.md standard
3. **Single source of truth** - All agents originate from `codev/agents/` in the main repository
4. **No tool lock-in** - Works with any AI coding assistant that supports AGENTS.md standard

#### Available Agents

##### spider-protocol-updater
**Purpose**: Protocol evolution through community learning

**Capabilities**:
- Analyzes SPIDER implementations in other repositories
- Compares remote implementations with canonical protocol
- Reviews lessons learned across projects
- Classifies improvements (Universal, Domain-specific, Experimental, Anti-pattern)
- Recommends protocol updates with justification

**Location**: `codev/agents/spider-protocol-updater.md`

**Usage**:
```
"Check the ansari-project/webapp repo for SPIDER improvements"
"Scan recent SPIDER implementations for protocol enhancements"
```

##### architecture-documenter
**Purpose**: Maintain comprehensive architecture documentation

**Capabilities**:
- Reviews specs, plans, and reviews for architectural information
- Scans implementation to verify documented structure matches reality
- Maintains `codev/resources/arch.md` (this file)
- Documents directory structure, utilities, patterns, and components
- Automatically invoked at end of TICK protocol reviews

**Location**: `codev/agents/architecture-documenter.md`

**Usage**:
- Automatically triggered by TICK protocol
- Manually: "Update the architecture documentation"

**What it maintains**:
- Complete directory structure
- All utility functions and helpers
- Key architectural patterns
- Component relationships
- Technology stack details

##### codev-updater
**Purpose**: Framework updates with safety and preservation

**Capabilities**:
- Checks for updates to protocols, agents, and templates
- Creates timestamped backups before updating
- Updates framework components from main repository
- Preserves user specs, plans, reviews (never modified)
- Provides rollback instructions

**Location**: `codev/agents/codev-updater.md`

**Usage**:
```
"Please update my codev framework to the latest version"
"Are there any updates available for codev?"
```

**Safety Features**:
- Backups created before any changes
- User work never modified
- CLAUDE.md customizations preserved
- Clear rollback procedures
- Verification before completion

### 3. Test Infrastructure

**Location**: `tests/`

**Framework**: bats-core (Bash Automated Testing System)

**Architecture**:
- **Zero external dependencies** - All frameworks vendored locally
- **Platform portable** - Works on macOS and Linux without changes
- **XDG sandboxing** - Tests never touch real user directories
- **Graceful degradation** - Skips tests when dependencies unavailable

#### Test Organization

**Framework Tests (00-09)**:
- Core framework validation
- Runner behavior verification
- Helper function tests

**Protocol Tests (10-19)**:
- SPIDER protocol installation (Zen present)
- SPIDER-SOLO protocol installation (Zen absent)
- CLAUDE.md preservation and updates
- Directory structure validation
- Protocol content verification

**Integration Tests (20+)**:
- Claude CLI execution with isolation flags
- Real agent invocation tests
- Codev updater validation

**Total Coverage**: 64 tests, ~2000 lines of test code

#### Test Helpers (`tests/helpers/`)

##### common.bash
**Purpose**: Shared test utilities and assertions

**Key Functions**:
- `setup_test_project()` - Creates isolated temporary test directory
- `teardown_test_project()` - Cleans up test artifacts (guaranteed via trap)
- `install_from_local()` - Installs Codev from local skeleton
- `create_claude_md()` - Creates CLAUDE.md with specified content
- `assert_codev_structure()` - Validates directory structure
- `assert_spider_protocol()` - Validates SPIDER protocol files
- `assert_spider_solo_protocol()` - Validates SPIDER-SOLO protocol files
- `file_contains()` - Checks file for literal string match

**Agent Installation Logic**:
```bash
# Mimics INSTALL.md conditional agent installation
# This test helper replicates production behavior
if command -v claude &> /dev/null; then
    # Claude Code present - install agents to .claude/agents/
    mkdir -p "$target_dir/.claude/agents"
    cp "$source_dir/agents/"*.md "$target_dir/.claude/agents/" 2>/dev/null || true
fi
# Note: For non-Claude Code environments, agents remain in codev/agents/
# from the skeleton copy (universal location for AGENTS.md-compatible tools)
```

**Implementation Details**:
- Detects Claude Code via `command -v claude` check
- Installs agents conditionally based on detection result
- Handles both Claude Code and non-Claude Code environments gracefully
- Never overwrites existing agent files (2>/dev/null || true pattern)

##### mock_mcp.bash
**Purpose**: Simulate Zen MCP server presence/absence

**Key Functions**:
- `mock_mcp_present()` - Simulates Zen MCP availability
- `mock_mcp_absent()` - Simulates Zen MCP unavailability
- `remove_mcp_from_path()` - Removes MCP from PATH
- `restore_path()` - Restores original PATH

**Strategy**: Uses failing shims instead of PATH removal for realistic testing

#### Test Execution

**Fast Tests** (excludes integration):
```bash
./scripts/run-tests.sh
```
- Runs in <30 seconds
- No Claude CLI required
- Core functionality validation

**All Tests** (includes integration):
```bash
./scripts/run-all-tests.sh
```
- Includes Claude CLI tests
- Requires `claude` command
- Full end-to-end validation

#### Test Isolation Strategy

**XDG Sandboxing** (prevents touching real user config):
```bash
export XDG_CONFIG_HOME="$TEST_PROJECT/.xdg"
export XDG_DATA_HOME="$TEST_PROJECT/.local/share"
export XDG_CACHE_HOME="$TEST_PROJECT/.cache"
```

**Claude CLI Isolation**:
```bash
claude --strict-mcp-config --mcp-config '[]' --settings '{}'
```
- `--strict-mcp-config` - Enforces strict MCP configuration
- `--mcp-config '[]'` - No MCP servers
- `--settings '{}'` - No user preferences

**Temporary Directories**:
- Each test gets isolated `mktemp -d` directory
- Cleanup guaranteed via `teardown()` trap
- No persistence between tests

## Installation Architecture

**Entry Point**: `INSTALL.md` - Instructions for AI agents to install Codev

**Installation Flow**:
1. **Prerequisite Check**: Detect Zen MCP server availability
2. **Protocol Selection**: SPIDER (Zen present) or SPIDER-SOLO (Zen absent)
3. **Directory Creation**: Create `codev/` structure in target project
4. **Skeleton Copy**: Copy protocol definitions, templates, and agents
5. **Conditional Agent Installation**:
   - Detect if Claude Code is available (`command -v claude`)
   - If yes: Install agents to `.claude/agents/`
   - If no: Agents remain in `codev/agents/` (universal location)
6. **AGENTS.md/CLAUDE.md Creation/Update**:
   - Check if files exist
   - Append Codev sections to existing files
   - Create new files if needed (both AGENTS.md and CLAUDE.md)
   - Both files contain identical content
7. **Verification**: Validate installation completeness

**Key Principles**:
- All Codev files go INSIDE `codev/` directory (not project root)
- Agents installed conditionally based on tool detection
- AGENTS.md follows [AGENTS.md standard](https://agents.md/) for cross-tool compatibility
- CLAUDE.md provides native Claude Code support (identical content)
- Uses local skeleton (no network dependency)
- Preserves existing CLAUDE.md content

## Data Flow

### Specification → Plan → Implementation → Review

**Document Flow**:
1. **Specification** (`codev/specs/####-feature.md`)
   - Defines WHAT to build
   - Created by developer or AI agent
   - Multi-agent reviewed (SPIDER) or self-reviewed (SPIDER-SOLO)
   - Committed before planning

2. **Plan** (`codev/plans/####-feature.md`)
   - Defines HOW to build
   - Breaks specification into phases (SPIDER) or single phase (TICK)
   - Lists files to create/modify
   - Multi-agent reviewed (SPIDER) or self-reviewed (SPIDER-SOLO)
   - Committed before implementation

3. **Implementation** (actual code in project)
   - Follows plan phases
   - Each phase: Implement → Defend (tests) → Evaluate
   - Committed per phase (SPIDER) or single commit (TICK)
   - Multi-agent consultation at checkpoints (SPIDER) or review only (TICK)

4. **Review** (`codev/reviews/####-feature.md`)
   - Documents lessons learned
   - Identifies systematic issues
   - Updates protocol if needed
   - Multi-agent reviewed (both SPIDER and TICK)
   - Triggers architecture documentation update (TICK)
   - Final commit in feature workflow

**File Naming Convention**:
```
codev/specs/####-descriptive-name.md
codev/plans/####-descriptive-name.md
codev/reviews/####-descriptive-name.md
```
- Sequential numbering shared across all protocols
- Same identifier for spec, plan, review

## Git Commit Strategy

### SPIDER Protocol
**Commits per Feature**:
1. `[Spec ####] Initial specification draft`
2. `[Spec ####] Specification with multi-agent review`
3. `[Plan ####] Initial implementation plan`
4. `[Plan ####] Plan with multi-agent review`
5. Per Phase:
   - `[Spec ####][Phase: name] feat: Implementation`
   - `[Spec ####][Phase: name] test: Defend phase tests`
   - `[Spec ####][Phase: name] docs: Evaluation complete`
6. `[Spec ####] Review document with lessons learned`

### TICK Protocol
**Commits per Task**:
1. `TICK Spec: [descriptive-name]`
2. `TICK Plan: [descriptive-name]`
3. `TICK Impl: [descriptive-name]`
4. `TICK Review: [descriptive-name]` (includes multi-agent consultation)

Additional:
- `TICK Fixes: [descriptive-name]` (if changes requested)

## Development Infrastructure

### Pre-Commit Hooks

**Location**: `hooks/pre-commit`

**Purpose**: Automated quality assurance through test execution before commits

**Installation**:
```bash
./scripts/install-hooks.sh
```

**Behavior**:
- Runs fast test suite (via `./scripts/run-tests.sh`) before allowing commits
- Exits with error if any tests fail
- Provides clear feedback on test status
- Can be bypassed with `git commit --no-verify` (not recommended)

**Design Rationale**:
1. **Catch regressions early** - Find issues before they reach the repository
2. **Maintain quality** - Ensure all commits pass the test suite
3. **Fast feedback** - Uses fast tests (not integration tests) for quick iteration
4. **Optional but recommended** - Manual installation respects developer choice

**Installation Script** (`scripts/install-hooks.sh`):
- Copies `hooks/pre-commit` to `.git/hooks/pre-commit`
- Makes hook executable
- Provides clear feedback on installation success
- Safe to run multiple times (idempotent)

### Test-Driven Development

Codev itself follows test-driven development practices:
- **64 comprehensive tests** covering all functionality
- **Fast test suite** (<30 seconds) for rapid iteration
- **Integration tests** for end-to-end validation
- **Platform compatibility** testing (macOS and Linux)
- **Pre-commit hooks** for continuous quality assurance

**Test Organization Philosophy**:
- Framework tests (00-09) validate core infrastructure
- Protocol tests (10-19) verify installation and configuration
- Integration tests (20+) validate real-world usage
- All tests hermetic and isolated (XDG sandboxing)

## Key Design Decisions

### 1. Context-First Philosophy
**Decision**: Natural language specifications are first-class artifacts

**Rationale**:
- AI agents understand natural language natively
- Human-AI collaboration requires shared context
- Specifications are more maintainable than code comments
- Enables multi-agent consultation on intent, not just implementation

### 2. Self-Hosted Development
**Decision**: Codev uses Codev to develop itself

**Rationale**:
- Real-world usage validates methodology
- Pain points are experienced by maintainers first
- Continuous improvement from actual use cases
- Documentation reflects reality, not theory

### 3. Dual Repository Structure
**Decision**: Separate `codev/` (our work) from `codev-skeleton/` (template)

**Rationale**:
- Clear separation of concerns
- Users get clean template without our development artifacts
- We can evolve protocols while using them
- No risk of user specs polluting template

### 4. Vendored Test Dependencies
**Decision**: Include bats-core and helpers directly in repository

**Rationale**:
- Zero installation dependencies for contributors
- Consistent test environment across systems
- No dependency on external package managers
- Version control ensures stability

### 5. XDG Sandboxing for Tests
**Decision**: All tests use XDG environment variables to isolate configuration

**Rationale**:
- Prevents accidental modification of user directories
- Tests are hermetic and reproducible
- No side effects on host system
- Safety-first testing approach

### 6. Shell-Based Testing
**Decision**: Use bash/bats instead of Python/pytest

**Rationale**:
- Tests the actual shell commands from INSTALL.md
- No language dependencies beyond bash
- Directly validates installation instructions
- Simple for shell-savvy developers to understand

### 7. Tool-Agnostic Agent Installation
**Decision**: Conditional installation - `.claude/agents/` (Claude Code) OR `codev/agents/` (other tools)

**Rationale**:
- **Environment detection** - Automatically adapts to available tooling
- **Native integration** - Claude Code gets `.claude/agents/` for built-in agent execution
- **Universal fallback** - Other tools (Cursor, Copilot) use `codev/agents/` via AGENTS.md
- **Single source** - `codev/agents/` is canonical in this repository (self-hosted)
- **No lock-in** - Works with any AI coding assistant supporting AGENTS.md standard
- **Graceful degradation** - Installation succeeds regardless of environment

**Implementation Details**:
- Detection via `command -v claude &> /dev/null`
- Silent error handling (`2>/dev/null || true`) for missing agents
- Clear user feedback on installation location
- Test infrastructure mirrors production behavior

### 8. AGENTS.md Standard + CLAUDE.md Synchronization
**Decision**: Maintain both AGENTS.md (universal) and CLAUDE.md (Claude Code-specific) with identical content

**Rationale**:
- AGENTS.md follows [AGENTS.md standard](https://agents.md/) for cross-tool compatibility
- CLAUDE.md provides native Claude Code support
- Identical content ensures consistent behavior across tools
- Users of any AI coding assistant get appropriate file format

### 9. Multi-Agent Consultation by Default
**Decision**: SPIDER and TICK default to consulting GPT-5 and Gemini 2.5 Pro

**Rationale**:
- Multiple perspectives catch issues single agent misses
- Prevents blind spots and confirmation bias
- Improves code quality and completeness
- User must explicitly disable (opt-out, not opt-in)

### 10. TICK Protocol for Fast Iteration
**Decision**: Create lightweight protocol for simple tasks

**Rationale**:
- SPIDER is excellent but heavy for simple tasks
- Fast iteration needed for bug fixes and utilities
- Single autonomous execution reduces overhead
- Multi-agent review at end maintains quality
- Fills gap between informal changes and full SPIDER

### 11. Pre-Commit Hooks for Quality Assurance
**Decision**: Provide optional pre-commit hooks that run test suite

**Rationale**:
- **Early detection** - Catch regressions before they reach repository
- **Continuous quality** - Ensure all commits pass tests
- **Fast feedback** - Use fast tests (not integration) for quick iteration
- **Developer choice** - Manual installation respects autonomy
- **Escape hatch** - Can bypass with --no-verify when needed
- **Self-hosting validation** - Codev validates itself before commits

**Implementation**:
- Hooks stored in `hooks/` directory (not `.git/hooks/` - not tracked)
- Installation script (`scripts/install-hooks.sh`) copies to `.git/hooks/`
- Runs `./scripts/run-tests.sh` (fast tests, ~30 seconds)
- Clear feedback on pass/fail
- Instructions for bypassing when necessary

## Integration Points

### External Services
- **GitHub**: Repository hosting, version control
- **AI Model Providers**:
  - Anthropic Claude (Sonnet, Opus)
  - OpenAI GPT-5
  - Google Gemini 2.5 Pro

### External Tools
- **Claude Code**: Native integration via `.claude/agents/`
- **Cursor**: Via AGENTS.md standard
- **GitHub Copilot**: Via AGENTS.md standard
- **Other AI coding assistants**: Via AGENTS.md standard
- **Zen MCP Server**: Optional for multi-agent features

### Internal Dependencies
- **Git**: Version control and history
- **Bash**: Shell scripting and installation
- **Markdown**: All documentation format
- **YAML**: Protocol configuration

## Development Patterns

### 1. Protocol-Driven Development
Every feature follows a protocol (SPIDER, SPIDER-SOLO, or TICK):
- Start with specification (WHAT)
- Create plan (HOW)
- Implement in phases or single execution
- Document lessons learned

### 2. Multi-Agent Consultation
Default consultation pattern:
```
1. Agent performs work
2. STOP - consult GPT-5 and Gemini Pro
3. Apply feedback
4. Get FINAL approval from experts
5. THEN present to user
```

### 3. Fail-Fast Principle
From `CLAUDE.md`:
- Fast failures are MANDATORY
- NEVER implement fallbacks
- When condition can't be met, fail immediately with clear error
- Error messages explain what failed and why

### 4. Explicit File Staging
Git workflow:
```bash
# ✅ CORRECT - Always specify exact files
git add codev/specs/0001-feature.md
git add src/components/TodoList.tsx

# ❌ FORBIDDEN
git add -A
git add .
git add --all
```

**Rationale**: Prevents accidental commit of sensitive files, API keys, or large data files

### 5. Document Naming Convention
```
####-descriptive-name.md
```
- Four-digit sequential number
- Kebab-case descriptive name
- Shared across spec, plan, review
- Numbers never reused

## File Naming Conventions

### Specification Files
```
codev/specs/####-feature-name.md
```

### Plan Files
```
codev/plans/####-feature-name.md
```

### Review Files
```
codev/reviews/####-feature-name.md
```

### Test Files
```
tests/##_description.bats
```
- Two-digit prefix for ordering
- Underscore separator
- Descriptive name
- .bats extension

### Agent Files
```
codev/agents/agent-name.md
```
- Kebab-case names
- .md extension (markdown format)
- Agent frontmatter with name, description, model, color

## Utility Functions & Helpers

### Test Helpers (`tests/helpers/common.bash`)

#### setup_test_project()
**Purpose**: Create isolated temporary test directory

**Returns**: Path to test directory

**Usage**:
```bash
TEST_PROJECT=$(setup_test_project)
```

#### teardown_test_project(directory)
**Purpose**: Clean up test artifacts

**Parameters**:
- `directory` - Path to test directory

**Usage**:
```bash
teardown_test_project "$TEST_PROJECT"
```

#### install_from_local(target_dir)
**Purpose**: Install Codev from local skeleton with conditional agent installation

**Parameters**:
- `target_dir` - Installation target directory

**Returns**: 0 on success, 1 on failure

**Behavior**:
- Copies `codev-skeleton/` to `target_dir/codev/`
- Conditionally installs agents based on Claude Code detection
- Verifies installation success

**Usage**:
```bash
install_from_local "$TEST_PROJECT"
```

#### create_claude_md(directory, content)
**Purpose**: Create CLAUDE.md with specified content

**Parameters**:
- `directory` - Target directory
- `content` - CLAUDE.md content

**Usage**:
```bash
create_claude_md "$TEST_PROJECT" "# My Project\n\nInstructions..."
```

#### assert_codev_structure(directory)
**Purpose**: Validate Codev directory structure exists

**Parameters**:
- `directory` - Directory to check

**Usage**:
```bash
assert_codev_structure "$TEST_PROJECT"
```

#### file_contains(file, text)
**Purpose**: Check if file contains literal string

**Parameters**:
- `file` - File path
- `text` - Text to search for (literal match)

**Returns**: 0 if found, 1 if not found

**Usage**:
```bash
file_contains "$TEST_PROJECT/CLAUDE.md" "Codev Methodology"
```

### Test Helpers (`tests/helpers/mock_mcp.bash`)

#### mock_mcp_present()
**Purpose**: Simulate Zen MCP server availability

**Usage**:
```bash
mock_mcp_present
```

#### mock_mcp_absent()
**Purpose**: Simulate Zen MCP server unavailability

**Usage**:
```bash
mock_mcp_absent
```

## Cross-Tool Compatibility

### AGENTS.md Standard
Codev supports the [AGENTS.md standard](https://agents.md/) for universal AI coding assistant compatibility:

**Supported Tools**:
- Claude Code (via CLAUDE.md)
- Cursor (via AGENTS.md)
- GitHub Copilot (via AGENTS.md)
- Continue.dev (via AGENTS.md)
- Other AGENTS.md-compatible tools

**File Synchronization**:
- Both `AGENTS.md` and `CLAUDE.md` maintained
- Identical content in both files
- AGENTS.md is canonical for non-Claude Code tools
- CLAUDE.md provides native Claude Code support

### Agent Location Strategy
**Detection and Installation**:
```bash
if command -v claude &> /dev/null; then
    # Claude Code: Install to .claude/agents/
    AGENT_DIR=".claude/agents"
else
    # Other tools: Use codev/agents/
    AGENT_DIR="codev/agents"
fi
```

**Benefits**:
- Tool-agnostic architecture
- Native integration where available
- Fallback to universal location
- No tool lock-in

## Platform Compatibility

### macOS Specific
- Uses BSD `stat` command: `stat -f "%Lp"`
- gtimeout from coreutils for timeout support
- Default mktemp behavior compatible

### Linux Specific
- Uses GNU `stat` command: `stat -c "%a"`
- Native `timeout` command available
- Standard mktemp available

### Portable Patterns
```bash
# Platform-agnostic permission checking
if [[ "$OSTYPE" == "darwin"* ]]; then
  perms=$(stat -f "%Lp" "$file")
else
  perms=$(stat -c "%a" "$file")
fi

# Timeout command detection
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
fi
```

## Security Considerations

### Test Isolation
- XDG sandboxing prevents touching real user directories
- Temporary directories isolated per test
- No persistent state between tests
- Cleanup guaranteed via teardown traps

### Git Commit Safety
- Explicit file staging required (no `git add -A` or `git add .`)
- Prevents accidental commit of sensitive files
- Clear file-by-file staging

### Claude CLI Isolation
- `--strict-mcp-config` prevents MCP server loading
- `--mcp-config '[]'` ensures no external servers
- `--settings '{}'` prevents user settings leakage
- API keys explicitly unset during testing

### Codev Updater Safety
- Always creates backups before updating
- Never modifies user specs, plans, or reviews
- Provides rollback instructions
- Verifies successful update before completing

## Performance Characteristics

### Test Suite
- **Fast Tests**: <30 seconds (no Claude CLI)
- **All Tests**: ~2-5 minutes (with Claude CLI integration)
- **Total Tests**: 64 tests, ~2000 lines
- **Coverage**: Framework validation, protocol installation, agent testing, updater validation
- **Parallelization**: Tests are independent and can run in parallel
- **Execution Speed**: Average ~0.5 seconds per test (fast suite)

### Protocol Execution Times
- **TICK**: ~4 minutes for simple tasks
- **SPIDER-SOLO**: ~15-30 minutes depending on complexity
- **SPIDER**: ~30-60 minutes depending on complexity and multi-agent consultation

### Installation
- **Network**: Not required (uses local skeleton)
- **Time**: <1 minute for basic installation
- **Space**: ~500KB for protocols and templates

## Troubleshooting

### Common Issues

#### Tests Hanging
**Cause**: Missing timeout utility for Claude tests

**Solution**:
```bash
brew install coreutils  # macOS
```

#### Permission Errors
**Cause**: Test directories not writable

**Solution**:
```bash
chmod -R u+w /tmp/codev-test.*
```

#### Agent Not Found
**Cause**: Wrong agent location for tool

**Solution**:
- Claude Code: Check `.claude/agents/`
- Other tools: Check `codev/agents/`

#### CLAUDE.md Not Updated
**Cause**: Installation didn't detect existing file

**Solution**: Manually append Codev section from INSTALL.md

## Maintenance

### Regular Tasks
1. **Update arch.md** - After significant changes (via architecture-documenter agent)
2. **Sync AGENTS.md and CLAUDE.md** - Keep content identical
3. **Update protocols** - Based on lessons learned
4. **Run tests** - Before committing changes (automated via pre-commit hook)
5. **Update skeleton** - Keep template current with protocol changes

### Pre-Commit Hook Maintenance
1. **Keep hooks in sync** - `hooks/pre-commit` should match `.git/hooks/pre-commit`
2. **Test hook behavior** - Verify hook runs correctly before committing hook changes
3. **Update installation script** - Modify `scripts/install-hooks.sh` if hook changes
4. **Document bypass cases** - Update README with when `--no-verify` is acceptable

### Versioning
- Protocols have version numbers in manifest.yaml
- Agents have version history in git
- Framework version tracked via git tags

## Contributing

### Adding New Protocols
1. Create directory in `codev-skeleton/protocols/new-protocol/`
2. Write `protocol.md` with complete specification
3. Create templates in `templates/` subdirectory
4. Add manifest.yaml with metadata
5. Update INSTALL.md to reference new protocol
6. Test installation with new protocol
7. Document in README.md

### Adding New Tests
1. Create `.bats` file in `tests/` directory
2. Use appropriate numbering prefix (00-09, 10-19, 20+)
3. Include setup/teardown with XDG sandboxing
4. Use test helpers from `helpers/`
5. Document any special requirements
6. Ensure test is hermetic and isolated

### Updating Agents
1. Modify agent file in `codev/agents/`
2. Sync changes to `codev-skeleton/agents/`
3. Update agent documentation in AGENTS.md/CLAUDE.md
4. Test agent invocation
5. Document changes in git commit

## Success Metrics

A well-maintained Codev architecture should enable:
- **Quick Understanding**: New developers understand structure in <15 minutes
- **Fast Location**: Find relevant files in <2 minutes
- **Easy Extension**: Add new protocols or agents in <1 hour
- **Reliable Testing**: Tests pass consistently on all platforms
- **Safe Updates**: Framework updates never break user work

---

## Recent Infrastructure Changes (2025-10-20)

### Test Infrastructure Completion
- **Total tests increased** from 52 to 64 (64/64 passing)
- **Test code expanded** from ~1500 to ~2000 lines
- **Full coverage** of framework, protocols, agents, and updater functionality

### Agent Installation Refactoring
- **Implemented tool-agnostic installation** with conditional logic
- **Claude Code detection** via `command -v claude` check
- **Dual installation paths** - `.claude/agents/` (Claude Code) or `codev/agents/` (universal)
- **Test helpers updated** to mirror production installation behavior
- **Self-hosted restoration** - `.claude/agents/` now present in main repo for our use

### Pre-Commit Hook Infrastructure
- **Added `hooks/pre-commit`** - Runs test suite before commits
- **Added `scripts/install-hooks.sh`** - Installation script for git hooks
- **Quality assurance** - Catches regressions before they reach repository
- **Fast feedback** - Uses fast test suite (<30 seconds)
- **Optional installation** - Respects developer choice

### Directory Structure Updates
- **`codev-skeleton/specs/.gitkeep`** - Ensures empty specs directory is tracked
- **`hooks/` directory** - Contains pre-commit hook template
- **`scripts/install-hooks.sh`** - Hook installation automation
- **`.claude/agents/`** - Restored for self-hosted development

### Key Design Improvements
- **Environment-aware installation** - Detects and adapts to tooling
- **Improved test isolation** - Conditional agent installation in tests
- **Better developer experience** - Pre-commit hooks for continuous quality
- **Enhanced maintainability** - Clear separation of hook template and installed hook

---

**Last Updated**: 2025-10-20 (via architecture-documenter agent)
**Version**: Post-test-infrastructure completion (Spec 0001)
**Next Review**: After next significant feature implementation or protocol update
