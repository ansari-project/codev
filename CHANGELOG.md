# Changelog

All notable changes to the Codev project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-05 "Architect"

First stable release with full architect-builder workflow.

### Breaking Changes

- **Removed bash architect scripts**: `codev/bin/architect` and `codev-skeleton/bin/architect` have been deleted. All functionality is now in the TypeScript `agent-farm` implementation.
- **Removed npx distribution**: The `npx agent-farm` command is no longer supported. Use `./codev/bin/agent-farm` instead.
- **New state file location**: State is now stored in `.agent-farm/state.json` instead of `codev/builders.md`.
- **Clean slate required**: Existing worktrees and state files must be manually deleted before using the new version.

### Migration Guide

1. Stop any running architect/builder processes
2. Delete old state files:
   ```bash
   rm -f codev/builders.md
   rm -f .architect.pid .architect.log
   ```
3. Delete existing worktrees:
   ```bash
   rm -rf .builders/
   git worktree prune
   ```
4. Build the new agent-farm:
   ```bash
   cd agent-farm && npm install && npm run build && cd ..
   ```
5. Update your scripts to use `./codev/bin/agent-farm` instead of `./codev/bin/architect` or `npx agent-farm`

### Added

- **Tower Dashboard** (`af tower`): Centralized view of all agent-farm instances
  - Shows running instances with status indicators
  - Recent projects list with one-click Start
  - Directory autocomplete for launching new instances
  - Works with any directory (falls back to global agent-farm)

- **Consult Tool** (`codev/bin/consult`): Unified CLI for multi-agent consultation
  - Supports Gemini (gemini-cli), Codex, and Claude
  - Stateless invocations with timing logs
  - Consultant role as collaborative partner

- **Flexible Builder Spawning** (`af spawn`): Five spawn modes
  - `--project`: Spec-driven builder (existing behavior)
  - `--task`: Ad-hoc task with natural language
  - `--protocol`: Run a protocol (cleanup, experiment)
  - `--worktree`: Isolated branch without prompt
  - `--shell`: Bare Claude session

- **Send Instructions to Builder** (`af send`): Architect-to-builder communication
  - Send follow-up instructions to running builders
  - Support for file attachments and interrupts
  - Broadcast to all builders with `--all`

- **Annotation Editor**: Edit files inline from the dashboard
  - Toggle between View and Edit modes
  - Auto-save on blur, Cancel restores disk state

- **Tab Bar Status Indicators**: At-a-glance builder status
  - Color dots showing working/idle/error states
  - Accessibility support with shapes and tooltips

- **Multi-Instance Support**: Directory-aware dashboard titles
  - Browser tabs show "AF: project-name"
  - Long paths truncated cleanly

- **Tutorial Mode** (`af tutorial`): Interactive onboarding
  - Step-by-step introduction to agent-farm
  - Progress tracking with skip/reset options

- **Cleanup Protocol**: Systematic codebase maintenance
  - Four phases: AUDIT → PRUNE → VALIDATE → SYNC
  - Dry-run by default, soft-delete with 30-day retention

- **OS Dependencies Documentation**: `codev-doctor` health check
  - Validates ttyd, tmux, node, git installations
  - Clear instructions for missing dependencies

- **Global port registry** (`~/.agent-farm/ports.json`): Each project gets its own 100-port block to prevent conflicts
- **config.json support**: Customize architect, builder, and shell commands
- **CLI command overrides**: `--architect-cmd`, `--builder-cmd`, `--shell-cmd` flags
- **Safe worktree cleanup**: Checks for uncommitted changes before deletion
- **Orphaned session handling**: Stale tmux sessions auto-cleaned on startup
- **Ports management**: `af ports list` and `af ports cleanup` commands
- **Roles directory** (`codev/roles/`): Architect and builder role prompts

### Changed

- **Single implementation**: All functionality in TypeScript `agent-farm` package
- **Template location**: Templates read from `codev/templates/` at runtime
- **Port scheme**: Deterministic port blocks per project

### Removed

- `codev/bin/architect` (bash script) - replaced by `codev/bin/agent-farm`
- `codev-skeleton/bin/architect` - replaced by `codev-skeleton/bin/agent-farm`
- `agent-farm/templates/` - templates now only in `codev/templates/`
- `codev/builders.md` - replaced by `.agent-farm/state.json`
- npm package distribution - use local installation

### Fixed

- Port collisions between multiple projects
- State corruption from concurrent access
- Template path resolution issues
- Process management reliability
- Annotation server startup wait
- Stale process detection in dashboard state

## [0.2.0] - 2025-12-03 "Foundation"

Initial release establishing core infrastructure.

### Added

- **Test Infrastructure**: BATS-based test framework (64 tests)
- **Architect-Builder Pattern**: Multi-agent orchestration with git worktrees
- **TypeScript CLI**: `agent-farm` package
- **Split-Pane Dashboard**: Architect always visible, tabbed right pane
- **Architecture Consolidation**: Single TypeScript source of truth
- **Terminal File Click**: Click paths in terminal to open annotation viewer

### Infrastructure

- Pre-commit hooks for test validation
- Global port registry with file locking
- XDG-compliant test sandboxing

---

[Unreleased]: https://github.com/cluesmith/codev/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cluesmith/codev/releases/tag/v1.0.0
[0.2.0]: https://github.com/cluesmith/codev/releases/tag/v0.2.0
