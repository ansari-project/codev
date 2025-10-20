# TICK Protocol
**T**ask **I**dentification, **C**oding, **K**ickout

## Overview
TICK is a streamlined development protocol for rapid, autonomous implementation. Unlike SPIDER's multi-phase approach with intermediate reviews, TICK runs in a single autonomous step from specification to implementation, with multi-agent consultation only at the review phase.

**Core Principle**: Fast iteration for simple tasks - spec, plan, implement, review. No intermediate checkpoints. Multi-agent validation at the end.

## When to Use TICK

### Use TICK for:
- Small features (< 300 lines of code)
- Well-defined tasks with clear requirements
- Bug fixes with known solutions
- Straightforward refactoring
- Configuration changes with logic
- Simple API endpoints
- Utility function additions

### Use SPIDER instead for:
- Complex features requiring multiple phases
- Architecture changes
- Unclear requirements needing exploration
- Performance optimization initiatives
- System design decisions
- Features requiring stakeholder alignment

## Protocol Workflow

### Single Autonomous Step

**Total Duration**: One continuous execution from start to finish

**Phases** (executed sequentially without user intervention):
1. **Specification** - Define what needs to be built
2. **Planning** - Create single-phase implementation plan
3. **Implementation** - Execute the plan
4. **Review** - Document what was done and lessons learned

**User Checkpoints**:
- **Start**: User provides task description
- **End**: User reviews completed work and provides feedback

## Detailed Workflow

### 1. Specification (Autonomous)

**Input**: User task description

**Agent Actions**:
1. Analyze the task requirements
2. Identify scope and constraints
3. Define success criteria
4. Generate specification document
5. **COMMIT**: "TICK Spec: [descriptive-name]"

**Output**: `codev/specs/####-descriptive-name.md`

**Template**: `templates/spec.md`

**Key Sections**:
- Problem statement
- Scope (in/out)
- Success criteria
- Assumptions
- No multi-agent consultation
- No user review at this stage

### 2. Planning (Autonomous)

**Input**: Generated specification

**Agent Actions**:
1. Break work into logical steps (NOT phases)
2. Identify file changes needed
3. Define implementation order
4. Generate plan document
5. **COMMIT**: "TICK Plan: [descriptive-name]"

**Output**: `codev/plans/####-descriptive-name.md`

**Template**: `templates/plan.md`

**Key Sections**:
- Implementation steps (sequential)
- Files to create/modify
- Testing approach
- Single-phase execution (no breaking into phases)
- No time estimates
- No user review at this stage

### 3. Implementation (Autonomous)

**Input**: Generated plan

**Agent Actions**:
1. Execute implementation steps in order
2. Write code following plan
3. Test functionality
4. **COMMIT**: "TICK Impl: [descriptive-name]"

**Output**: Working code committed to repository

**Notes**:
- Follow fail-fast principles from AGENTS.md/CLAUDE.md
- Test before committing
- No user approval needed during implementation
- Single commit for all changes

### 4. Review (User Checkpoint)

**Input**: Completed implementation

**Agent Actions**:
1. Generate review document with:
   - What was implemented
   - Challenges encountered
   - Deviations from plan
   - Lessons learned
2. **Multi-Agent Consultation** (DEFAULT - MANDATORY):
   - Consult GPT-5 AND Gemini Pro
   - Focus: Code quality, missed issues, improvements
   - Update review with consultation feedback
3. **Update Architecture Documentation**:
   - Use architecture-documenter agent to update `codev/resources/arch.md`
   - Document new modules, utilities, or architectural changes
   - Ensure arch.md reflects current codebase state
4. **COMMIT**: "TICK Review: [descriptive-name]" (includes consultation findings and arch.md updates)
5. **PRESENT TO USER**: Show summary with consultation insights and ask for feedback

**Output**: `codev/reviews/####-descriptive-name.md`

**Template**: `templates/review.md`

**⚠️ BLOCKING**: Cannot present to user without consultation (unless explicitly disabled)

**User Actions**:
- Review completed work
- Provide feedback
- Request changes OR approve

**If Changes Requested**:
- Agent makes changes
- Commits: "TICK Fixes: [descriptive-name]"
- Updates review document
- Repeats until user approval

## File Naming Convention

All three files share the same sequential identifier and name:
- `specs/0001-feature-name.md`
- `plans/0001-feature-name.md`
- `reviews/0001-feature-name.md`

Sequential numbering continues across SPIDER and TICK protocols.

## Git Commit Strategy

**TICK uses 4 commits per task**:
1. Specification: `TICK Spec: Add user authentication`
2. Plan: `TICK Plan: Add user authentication`
3. Implementation: `TICK Impl: Add user authentication`
4. Review (includes multi-agent consultation): `TICK Review: Add user authentication`

Additional commits if changes requested:
- `TICK Fixes: Add user authentication` (can be multiple)

## Key Differences from SPIDER

| Aspect | SPIDER | TICK |
|--------|--------|------|
| User checkpoints | Multiple (after spec, plan, each phase) | Two (start, end) |
| Multi-agent consultation | Throughout (spec, plan, implementation, review) | End only (review) |
| Implementation phases | Multiple | Single |
| Review timing | Continuous | End only |
| Complexity | High | Low |
| Speed | Slower, thorough | Fast, autonomous |

## Protocol Selection Guide

**Choose TICK when**:
- Task is well-defined
- < 300 lines of code
- Low risk of errors
- Fast iteration needed
- Requirements are clear

**Choose SPIDER when**:
- Requirements unclear
- > 300 lines of code
- High complexity
- Stakeholder alignment needed
- Architecture changes

## Example TICK Workflow

**User**: "Add a health check endpoint to the API"

**Agent**:
1. Generates spec (30 seconds)
   - `specs/0002-api-health-check.md`
   - Commit: "TICK Spec: API health check"
2. Generates plan (30 seconds)
   - `plans/0002-api-health-check.md`
   - Commit: "TICK Plan: API health check"
3. Implements (2 minutes)
   - Creates `/api/health` endpoint
   - Tests endpoint
   - Commit: "TICK Impl: API health check"
4. Reviews and presents (1 minute)
   - `reviews/0002-api-health-check.md`
   - Commit: "TICK Review: API health check"
   - Shows user the working endpoint

**User**: Reviews, approves or requests changes

**Total Time**: ~4 minutes for simple task

## Benefits

1. **Speed**: No intermediate approvals means faster delivery
2. **Simplicity**: Straightforward workflow, easy to understand
3. **Autonomy**: Agent executes without constant human intervention
4. **Documentation**: Still maintains spec, plan, review for reference
5. **Lightweight**: Minimal overhead for simple tasks

## Limitations

1. **No course correction**: Can't adjust mid-implementation
2. **No multi-perspective**: Single agent viewpoint only
3. **Risk**: May implement wrong solution if spec unclear
4. **Scope creep**: Easy to go beyond intended scope
5. **No validation**: No intermediate checks until end

## Best Practices

1. **Clear Task Description**: User provides detailed initial description
2. **Test Before Review**: Agent must test functionality before presenting
3. **Honest Review**: Document all issues and deviations in review
4. **Quick Iterations**: If changes needed, make them fast
5. **Know When to Switch**: If task becomes complex, switch to SPIDER

## Template Usage

All templates are located in `codev/protocols/tick/templates/`:
- `spec.md` - Specification template
- `plan.md` - Plan template
- `review.md` - Review template

These are simplified versions of SPIDER templates without consultation sections.
