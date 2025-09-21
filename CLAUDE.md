# Codev Project Instructions for AI Agents

## Project Context

**THIS IS THE CODEV SOURCE REPOSITORY - WE ARE SELF-HOSTED**

This project IS Codev itself, and we use our own methodology for development. All new features and improvements to Codev should follow the SPIDER protocol defined in `codev/protocols/spider/protocol.md`.

## Quick Start

You are working in the Codev project itself, using the **SPIDER protocol** with multi-agent consultation.

Key locations:
- Protocol details: `codev/protocols/spider/protocol.md` (READ THIS FIRST)
- Specifications go in: `codev/specs/`
- Plans go in: `codev/plans/`
- Lessons learned go in: `codev/lessons/`

## What Goes Through SPIDER in This Repo

Since this is the Codev source repository, use SPIDER for:
- New protocols or protocol variants
- Major changes to the SPIDER protocol itself
- New example projects
- Significant changes to installation process
- New features for the methodology
- Integration tools or utilities

Skip SPIDER for:
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
│   ├── protocols/spider/    # Protocol documentation and templates
│   ├── specs/               # Feature specifications (WHAT to build)
│   ├── plans/               # Implementation plans (HOW to build)
│   ├── lessons/             # Lessons learned from each feature
│   └── resources/           # Reference materials (llms.txt, guides, etc.)
├── CLAUDE.md               # This file
└── [project code]
```

## File Naming Convention

Use sequential numbering with descriptive names:
- Specification: `codev/specs/0001-feature-name.md`
- Plan: `codev/plans/0001-feature-name.md`
- Lessons: `codev/lessons/0001-feature-name.md`

## Multi-Agent Consultation

**DEFAULT BEHAVIOR**: Consultation is ENABLED by default with:
- **Gemini 2.5 Pro** (gemini-2.5-pro) for deep analysis
- **GPT-5** (gpt-5) for additional perspective

To disable: User must explicitly say "without multi-agent consultation"

**Consultation Checkpoints**:
1. **Specification Phase**: After draft and after human review
2. **Planning Phase**: After plan creation and after human review
3. **Implementation Phase**: After code implementation
4. **Defend Phase**: After test creation
5. **Evaluation Phase**: After evaluation completion
6. **Review Phase**: After review document

## Git Workflow

### CRITICAL Git Safety Rules

**NEVER use `git add -A` or `git add .`** - These are dangerous and can accidentally commit:
- API keys and secrets
- Large data files
- Personal configuration files
- Temporary files or caches

**ALWAYS use specific file additions**:
```bash
# Good - explicit file additions
git add codev/specs/0001-feature.md
git add src/components/TodoList.tsx

# Bad - dangerous bulk additions
git add -A  # NEVER DO THIS
git add .   # NEVER DO THIS
```

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
- Use GPT-5 (gpt-5) for additional perspective
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