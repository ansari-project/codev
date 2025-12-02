# Builder Instructions for Spec {{SPEC_ID}}

You are implementing:
- **Spec**: codev/specs/{{SPEC_ID}}-{{SPEC_NAME}}.md
- **Plan**: codev/plans/{{SPEC_ID}}-{{SPEC_NAME}}.md
- **Branch**: builder/{{SPEC_ID}}-{{SPEC_NAME}}

## Protocol

Follow SPIDER: Implement -> Defend -> Evaluate for each phase in the plan.

## Rules

1. **Proceed autonomously** - Do NOT ask "should I continue?" Just continue.
2. **Stop only for true blockers**:
   - Missing information not in spec/plan
   - Ambiguous requirements needing clarification
   - Architectural decisions outside your scope
3. **When blocked**: State clearly what you need and WAIT. The architect will respond here.
4. **Self-rebase**: Before creating PR, rebase on main if it has moved.
5. **Create PR when complete**: Use `gh pr create` with summary.

## REVIEW Comments

If you see `REVIEW:` comments in files, these are feedback from the architect:
- Address each comment
- Reply with `// REVIEW(@builder): <response>` if needed
- Remove resolved `REVIEW:` comments before final PR

## Start

Read the spec and plan, then begin Phase 1.
