# Codev Project Instructions for AI Agents

## Quick Start

You are working in a project that uses the **Codev methodology** with the **SP(IDE)R protocol**.

Key locations:
- Protocol details: `codev/protocols/spider/protocol.md` (READ THIS FIRST)
- Specifications go in: `codev/specs/`
- Plans go in: `codev/plans/`
- Lessons learned go in: `codev/ref/lessons/`

## Core Workflow

1. **When asked to build something**: Start with the Specification phase
2. **Create exactly THREE documents per feature**: spec, plan, and lessons (all with same filename)
3. **Follow the SP(IDE)R phases**: Specify → Plan → (Implement → Defend → Evaluate) → Review
4. **Use multi-agent consultation by default** unless user says "without consultation"

## Directory Structure
```
project-root/
├── codev/
│   ├── protocols/spider/    # Protocol documentation and templates
│   ├── specs/               # Feature specifications (WHAT to build)
│   ├── plans/               # Implementation plans (HOW to build)
│   └── ref/lessons/         # Lessons learned from each feature
├── CLAUDE.md               # This file
└── [project code]
```

## File Naming Convention

Use sequential numbering with descriptive names:
- Specification: `codev/specs/0001-feature-name.md`
- Plan: `codev/plans/0001-feature-name.md`
- Lessons: `codev/ref/lessons/0001-feature-name.md`

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

## For Detailed Instructions

**READ THE FULL PROTOCOL**: `codev/protocols/spider/protocol.md`

This contains:
- Detailed phase descriptions
- Required evidence for each phase
- Expert consultation requirements
- Templates and examples
- Best practices

---

*Remember: Context is king. When in doubt, write more documentation rather than less.*