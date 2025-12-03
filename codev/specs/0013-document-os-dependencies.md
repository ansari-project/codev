# Specification: Document OS Dependencies

## Metadata
- **ID**: 0013-document-os-dependencies
- **Protocol**: TICK
- **Status**: specified
- **Created**: 2025-12-03
- **Priority**: medium

## Problem Statement

Agent-farm requires several OS-level dependencies that aren't clearly documented:
- tmux (terminal multiplexer)
- ttyd (web terminal)
- Node.js (runtime)
- git (worktrees)

Users often encounter cryptic errors when dependencies are missing.

## Current State

- README mentions some dependencies casually
- No installation instructions
- No version requirements
- Errors like "ttyd not found" without guidance

## Desired State

1. **Clear documentation** of all dependencies
2. **Installation instructions** per platform (macOS, Linux, Windows WSL)
3. **Version requirements** where applicable
4. **Startup checks** that verify dependencies with helpful errors

## Success Criteria

- [ ] README has "Prerequisites" section with all dependencies
- [ ] Installation commands for macOS (brew) and Linux (apt/dnf)
- [ ] Version requirements documented
- [ ] `af start` checks dependencies and shows helpful errors
- [ ] `af doctor` command to verify installation (optional)

## Technical Approach

### Documentation (README.md)

```markdown
## Prerequisites

Agent Farm requires the following:

| Dependency | Version | macOS | Ubuntu/Debian | Purpose |
|------------|---------|-------|---------------|---------|
| Node.js | >= 18 | `brew install node` | `apt install nodejs` | Runtime |
| tmux | >= 3.0 | `brew install tmux` | `apt install tmux` | Terminal sessions |
| ttyd | >= 1.7 | `brew install ttyd` | See below | Web terminal |
| git | >= 2.5 | (pre-installed) | `apt install git` | Worktrees |

### Installing ttyd on Linux

```bash
# Ubuntu/Debian
sudo apt install build-essential cmake git libjson-c-dev libwebsockets-dev
git clone https://github.com/tsl0922/ttyd.git
cd ttyd && mkdir build && cd build
cmake .. && make && sudo make install
```
```

### Dependency Checks (in start.ts)

```typescript
async function checkDependencies(): Promise<void> {
  const deps = [
    { name: 'node', minVersion: '18.0.0', check: 'node --version' },
    { name: 'tmux', minVersion: '3.0', check: 'tmux -V' },
    { name: 'ttyd', minVersion: '1.7', check: 'ttyd --version' },
    { name: 'git', minVersion: '2.5', check: 'git --version' },
  ];

  for (const dep of deps) {
    if (!(await commandExists(dep.name))) {
      fatal(`${dep.name} not found. Install with: brew install ${dep.name} (macOS)`);
    }
  }
}
```

## Scope

### In Scope
- README documentation
- Dependency checks in `af start`

### Out of Scope
- Automated installation
- Docker container
- Windows native support

## Test Scenarios

1. Fresh machine without ttyd - `af start` shows install instructions
2. Old tmux version - warning shown (if version check implemented)
3. All deps present - normal startup

## Expert Consultation
**Date**: 2025-12-03
**Models Consulted**: GPT-5 Codex, Gemini 2.5 Pro
**Feedback Incorporated**:
- Add explicit minimum version constraints (tmux/ttyd have protocol changes between versions)
- Consider `check-env` script for programmatic validation (not just docs)
- Risk of documentation drift - keep README and actual checks in sync

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
