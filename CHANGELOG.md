# Changelog

All notable changes to the Codev project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- **Global port registry** (`~/.agent-farm/ports.json`): Each project gets its own 100-port block (4200-4299, 4300-4399, etc.) to prevent port conflicts when running multiple architects simultaneously.
- **config.json support**: Customize architect, builder, and shell commands via `codev/config.json` instead of editing scripts.
- **CLI command overrides**: `--architect-cmd`, `--builder-cmd`, `--shell-cmd` flags override config.json values.
- **Safe worktree cleanup**: The `cleanup` command now checks for uncommitted changes and refuses to delete dirty worktrees without `--force`.
- **Orphaned session handling**: On startup, stale tmux sessions from previous runs are automatically detected and cleaned up.
- **Stale artifact warnings**: The system warns about old bash-era files (builders.md, .architect.pid) if present.
- **Ports management commands**: `agent-farm ports list` and `agent-farm ports cleanup` for managing port allocations.
- **Roles directory** (`codev/roles/`): Architect and builder role prompts are now in a dedicated directory.

### Changed

- **Single implementation**: All architect-builder functionality is now in the TypeScript `agent-farm` package.
- **Template location**: Templates are read from `codev/templates/` at runtime (configurable via config.json).
- **Port scheme**: Uses deterministic port blocks per project instead of finding available ports dynamically.

### Removed

- `codev/bin/architect` (bash script) - replaced by `codev/bin/agent-farm`
- `codev-skeleton/bin/architect` - replaced by `codev-skeleton/bin/agent-farm`
- `agent-farm/templates/` - templates are now only in `codev/templates/`
- `codev/builders.md` - replaced by `.agent-farm/state.json`
- npm package distribution - use local installation instead

### Fixed

- Port collisions between multiple projects running simultaneously
- State corruption from concurrent access
- Template path resolution issues
- Process management reliability (tmux sessions are now properly tracked)
