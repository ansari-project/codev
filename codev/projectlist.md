# Project List

Centralized tracking of all projects with status, priority, and dependencies.

## Project Lifecycle

Every project goes through stages. Not all projects reach completion:

**Active Lifecycle:**
1. **conceived** - Initial idea captured, ready for specification
2. **specified** - Detailed specification written (codev/specs/NNNN-name.md exists)
3. **planned** - Implementation plan created (codev/plans/NNNN-name.md exists)
4. **implementing** - Actively being worked on (one or more phases in progress)
5. **implemented** - Code complete, all phases done, tests passing locally
6. **committed** - Merged to develop branch, ready for production deployment
7. **integrated** - Merged to main, deployed to production, validated, reviewed (codev/reviews/NNNN-name.md exists), and **explicitly approved by project owner**

**Terminal States:**
- **abandoned** - Project canceled/rejected, will not be implemented (explain reason in notes)
- **on-hold** - Temporarily paused, may resume later (explain reason in notes)

## Format

```yaml
projects:
  - id: "NNNN"              # Four-digit project number
    title: "Brief title"
    summary: "One-sentence description of what this project does"
    status: conceived|specified|planned|implementing|implemented|committed|integrated|abandoned|on-hold
    priority: high|medium|low
    files:
      spec: codev/specs/NNNN-name.md       # Required after "specified"
      plan: codev/plans/NNNN-name.md       # Required after "planned"
      review: codev/reviews/NNNN-name.md   # Required after "integrated"
    dependencies: []         # List of project IDs this depends on
    tags: []                # Categories (e.g., auth, billing, ui)
    notes: ""               # Optional notes about status or decisions
```

## Numbering Rules

1. **Sequential**: Use next available number (0001-9999)
2. **Reservation**: Add entry to this file FIRST before creating spec
3. **Renumbering**: If collision detected, newer project gets renumbered
4. **Gaps OK**: Deleted projects leave gaps (don't reuse numbers)

## Usage Guidelines

### When to Add a Project

Add a project entry when:
- You have a concrete idea worth tracking
- The work is non-trivial (not just a bug fix or typo)
- You want to reserve a number before writing a spec

### Status Transitions

```
conceived → specified → planned → implementing → implemented → committed → integrated
    ↓           ↓          ↓           ↓              ↓            ↓
    └───────────┴──────────┴───────────┴──────────────┴────────────┴──→ abandoned
    └───────────┴──────────┴───────────┴──────────────┴────────────┴──→ on-hold
```

### Priority Guidelines

- **high**: Critical path, blocking other work, or significant business value
- **medium**: Important but not urgent, can wait for high-priority work
- **low**: Nice to have, polish, or speculative features

### Tags

Use consistent tags across projects for filtering:
- `auth`, `security` - Authentication and security features
- `ui`, `ux` - User interface and experience
- `api`, `architecture` - Backend and system design
- `testing`, `infrastructure` - Development and deployment
- `billing`, `credits` - Payment and monetization
- `features` - New user-facing functionality

---

## Projects

```yaml
projects:
  - id: "0001"
    title: "Test Infrastructure"
    summary: "BATS-based test framework for Codev installation and protocols"
    status: integrated
    priority: high
    files:
      spec: codev/specs/0001-test-infrastructure.md
      plan: codev/plans/0001-test-infrastructure.md
      review: codev/reviews/0001-test-infrastructure.md
    dependencies: []
    tags: [testing, infrastructure]
    notes: "64 tests passing, pre-commit hook installed"

  - id: "0002"
    title: "Architect-Builder Pattern"
    summary: "Multi-agent orchestration with git worktrees for parallel development"
    status: integrated
    priority: high
    files:
      spec: codev/specs/0002-architect-builder.md
      plan: codev/plans/0002-architect-builder.md
      review: null
    dependencies: []
    tags: [architecture, agents]
    notes: "Bash CLI implemented, superseded by 0005 TypeScript CLI"

  - id: "0003"
    title: "End of Day Reporter"
    summary: "Automated summary of development activity for daily standups"
    status: on-hold
    priority: low
    files:
      spec: codev/specs/0003-end-of-day-reporter.md
      plan: null
      review: null
    dependencies: []
    tags: [automation, reporting]
    notes: "Paused per project owner"

  - id: "0004"
    title: "Dashboard Nav UI"
    summary: "Enhanced navigation and UX for the agent-farm dashboard"
    status: integrated
    priority: medium
    files:
      spec: codev/specs/0004-dashboard-nav-ui.md
      plan: codev/plans/0004-dashboard-nav-ui.md
      review: null
    dependencies: ["0005"]
    tags: [ui, dashboard]
    notes: "Integrated with TypeScript CLI"

  - id: "0005"
    title: "TypeScript CLI"
    summary: "Migrate architect CLI from bash to TypeScript with npm distribution"
    status: integrated
    priority: high
    files:
      spec: codev/specs/0005-typescript-cli.md
      plan: codev/plans/0005-typescript-cli.md
      review: codev/reviews/0005-typescript-cli.md
    dependencies: ["0002"]
    tags: [cli, typescript, npm]
    notes: "Published as agent-farm@0.1.0 to npm"

  - id: "0006"
    title: "Tutorial Mode"
    summary: "Interactive onboarding for new Codev users"
    status: specified
    priority: low
    files:
      spec: codev/specs/0006-tutorial-mode.md
      plan: null
      review: null
    dependencies: []
    tags: [documentation, onboarding]
    notes: ""
```

  - id: "0007"
    title: "Split-Pane Dashboard"
    summary: "Architect always visible on left, tabbed interface on right for files/builders/shells"
    status: integrated
    priority: medium
    files:
      spec: codev/specs/0007-split-pane-dashboard.md
      plan: codev/plans/0007-split-pane-dashboard.md
      review: null
    dependencies: ["0005"]
    tags: [ui, dashboard]
    notes: "Supersedes 0004 left-nav approach"

  - id: "0008"
    title: "Architecture Consolidation"
    summary: "Eliminate brittleness by consolidating triple implementation to single TypeScript source"
    status: integrated
    priority: high
    files:
      spec: codev/specs/0008-architecture-consolidation.md
      plan: codev/plans/0008-architecture-consolidation.md
      review: codev/reviews/0008-architecture-consolidation.md
    dependencies: ["0005"]
    tags: [architecture, cli, refactoring]
    notes: "Completed 2025-12-03. Single TypeScript CLI, config.json, global port registry with file locking"

  - id: "0009"
    title: "Terminal File Click to Annotate"
    summary: "Click on file paths in terminal output to open them in the annotation viewer"
    status: planned
    priority: medium
    files:
      spec: codev/specs/0009-terminal-file-click.md
      plan: codev/plans/0009-terminal-file-click.md
      review: null
    dependencies: ["0007"]
    tags: [ui, dashboard, dx]
    notes: "TICK protocol. Uses postMessage between ttyd iframe and dashboard for link handling"

  - id: "0010"
    title: "Annotation Editor"
    summary: "Add edit button to annotation viewer with basic inline editing capabilities"
    status: conceived
    priority: medium
    files:
      spec: null
      plan: null
      review: null
    dependencies: ["0007"]
    tags: [ui, dashboard, editing]
    notes: "Basic text editing within annotation viewer"

  - id: "0011"
    title: "Multi-Instance Support"
    summary: "Better support for running multiple agent-farm instances with directory-aware titles and meta-dashboard"
    status: conceived
    priority: medium
    files:
      spec: null
      plan: null
      review: null
    dependencies: ["0007"]
    tags: [ui, dashboard, multi-project]
    notes: "Include directory name in dashboard title, create meta-dashboard showing all running architects and their states"

  - id: "0012"
    title: "Hide tmux Status Bar"
    summary: "Cleaner dashboard UI by removing the tmux status bar from embedded terminals"
    status: conceived
    priority: low
    files:
      spec: null
      plan: null
      review: null
    dependencies: []
    tags: [ui, dashboard]
    notes: "tmux status bar adds visual noise, hide it for cleaner look"

  - id: "0013"
    title: "Document OS Dependencies"
    summary: "Clarify and document all operating system dependencies required to run agent-farm"
    status: conceived
    priority: medium
    files:
      spec: null
      plan: null
      review: null
    dependencies: []
    tags: [documentation, installation]
    notes: "Need tmux, ttyd, and what else? Make requirements clear in README/INSTALL"

  - id: "0014"
    title: "Flexible Builder Spawning"
    summary: "Generalize spawn command to accept natural language instructions, not just project specs"
    status: conceived
    priority: high
    files:
      spec: null
      plan: null
      review: null
    dependencies: ["0005"]
    tags: [cli, agents, architecture]
    notes: "Rename to 'af spawn'. Support: (1) natural language tasks, (2) random Claude sessions, (3) protocol invocation (e.g., 'af spawn --protocol cleanup'). See codev/resources/conceptual-model.md"

  - id: "0015"
    title: "Cleanup Protocol"
    summary: "Multi-phase protocol for systematic codebase cleanup: Audit → Prune → Validate → Sync"
    status: conceived
    priority: medium
    files:
      spec: null
      plan: null
      review: null
    dependencies: []
    tags: [protocols, maintenance]
    notes: "See codev/resources/conceptual-model.md for why this is a Protocol not a Role. Phases: dead code audit, pruning, migration validation, doc sync (architecture-documenter + CLAUDE.md↔AGENTS.md)"

  - id: "0016"
    title: "Clarify Builder Role Definition"
    summary: "Resolved: Kept 'Builder' name but clarified it encompasses remodel, repair, maintain - not just new construction"
    status: integrated
    priority: medium
    files:
      spec: null
      plan: null
      review: null
    dependencies: []
    tags: [documentation, naming]
    notes: "Decided to keep 'Builder' after consulting Pro and Codex. Updated codev/resources/conceptual-model.md with expanded definition. 'Building' = build, remodel, repair, extend, validate, document, maintain."

  - id: "0017"
    title: "Platform Portability Layer"
    summary: "Implement transpilation from .codev/ source to platform-specific configs (CLAUDE.md, GEMINI.md, AGENTS.md)"
    status: conceived
    priority: low
    files:
      spec: null
      plan: null
      review: null
    dependencies: []
    tags: [architecture, portability]
    notes: "Enable codev to work across Claude Code, Gemini CLI, and Codex CLI. See codev/resources/conceptual-model.md for architecture."

## Next Available Number

**0018** - Reserve this number for your next project

---

## Quick Reference

### View by Status
To see all projects at a specific status, search for `status: <status>` in this file.

### View by Priority
To see high-priority work, search for `priority: high`.

### Check Dependencies
Before starting a project, verify its dependencies are at least `implemented`.

### Protocol Selection
- **SPIDER/SPIDER-SOLO**: Most projects (formal spec → plan → implement → review)
- **TICK**: Small, well-defined tasks (< 300 lines)
- **EXPERIMENT**: Research/prototyping before committing to a project
