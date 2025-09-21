# SPIDER-SOLO Protocol

## Prerequisites

**No External Dependencies Required**:
- SPIDER-SOLO is a single-agent variant that doesn't require Zen MCP
- All review and validation is done through self-review
- Ideal when multi-agent infrastructure is not available

## Protocol Configuration

### Self-Review Only (NO MULTI-AGENT CONSULTATION)

**DEFAULT BEHAVIOR:**
SPIDER-SOLO uses self-review and human approval only.

**KEY DIFFERENCE FROM SPIDER:**
- No multi-agent consultation at any checkpoint
- All review is done through careful self-examination
- Emphasis on thorough self-validation before presenting to user

**REVIEW APPROACH:**
- Self-review at each checkpoint where SPIDER would consult agents
- Use critical thinking to identify gaps and issues
- Document self-review findings transparently
- Rely on human feedback for validation

## Overview
SPIDER-SOLO is a single-agent variant of the SPIDER protocol that emphasizes specification-driven development with iterative implementation and continuous self-review. It maintains the same structured approach but without multi-agent collaboration.

**Core Principle**: Each feature is tracked through exactly THREE documents - a specification, a plan, and a review with lessons learned - all sharing the same filename and sequential identifier.

## When to Use SPIDER-SOLO

### Use SPIDER-SOLO for:
- New feature development (when Zen MCP is not available)
- Architecture changes (single-agent review)
- Complex refactoring (self-validated)
- System design decisions (human-approved)
- API design and implementation
- Performance optimization initiatives

### Skip SPIDER-SOLO for:
- Simple bug fixes (< 10 lines)
- Documentation updates
- Configuration changes
- Dependency updates
- Emergency hotfixes (but do a lightweight retrospective after)

## Protocol Phases

### S - Specify (Design Exploration with Self-Review)

**Purpose**: Thoroughly explore the problem space and solution options before committing to an approach.

**Workflow Overview**:
1. User provides a prompt describing what they want built
2. Agent generates initial specification document
3. **COMMIT**: "Initial specification draft"
4. Self-review the specification critically
5. Agent updates spec based on self-review
6. **COMMIT**: "Specification after self-review"
7. Human reviews and provides comments for changes
8. Agent makes changes and lists what was modified
9. **COMMIT**: "Specification with user feedback"
10. Final self-review of updated document
11. Final updates based on self-review
12. **COMMIT**: "Final approved specification"
13. Iterate steps 7-12 until user approves and says to proceed to planning

**Important**: Keep documentation minimal - use only THREE core files with the same name:
- `specs/####-descriptive-name.md` - The specification
- `plans/####-descriptive-name.md` - The implementation plan
- `reviews/####-descriptive-name.md` - Review and lessons learned (created during Review phase)

**Process**:
1. **Clarifying Questions** (ALWAYS START HERE)
   - Ask the user/stakeholder questions to understand the problem
   - Probe for hidden requirements and constraints
   - Understand the business context and goals
   - Identify what's in scope and out of scope
   - Continue asking until the problem is crystal clear

2. **Problem Analysis**
   - Clearly articulate the problem being solved
   - Identify stakeholders and their needs
   - Document current state and desired state
   - List assumptions and constraints

3. **Solution Exploration**
   - Generate multiple solution approaches (as many as appropriate)
   - For each approach, document:
     - Technical design
     - Trade-offs (pros/cons)
     - Estimated complexity
     - Risk assessment

4. **Open Questions**
   - List all uncertainties that need resolution
   - Categorize as:
     - Critical (blocks progress)
     - Important (affects design)
     - Nice-to-know (optimization)

5. **Success Criteria**
   - Define measurable acceptance criteria
   - Include performance requirements
   - Specify quality metrics
   - Document test scenarios

6. **Self-Review Process**
   - **First Self-Review** (after initial draft):
     - Critically examine problem clarity and solution completeness
     - Look for missing requirements or edge cases
     - Document self-identified improvements
     - Update specification based on self-review
   - **Second Self-Review** (after human comments):
     - Validate changes align with feedback
     - Ensure specification is comprehensive
     - Final specification refinement

   **Note**: Self-review only - no multi-agent consultation in SOLO variant

**⚠️ IMPORTANT**: Thorough self-review is critical before proceeding

**Output**: Single specification document in `codev/specs/####-descriptive-name.md`
- All self-review findings incorporated directly into this document
- Include a "Self-Review Notes" section summarizing identified improvements
- Version control captures evolution through commits
**Template**: `templates/spec.md`
**Review Required**: Yes - Human approval AFTER self-review

### P - Plan (Structured Decomposition)

**Purpose**: Transform the approved specification into an executable roadmap with clear phases.

**⚠️ CRITICAL: No Time Estimates in the AI Age**
- **NEVER include time estimates** (hours, days, weeks, story points)
- AI-driven development makes traditional time estimates meaningless
- Delivery speed depends on iteration cycles, not calendar time
- Focus on logical dependencies and phase ordering instead
- Measure progress by completed phases, not elapsed time
- The only valid metrics are: "done" or "not done"

**Workflow Overview**:
1. Agent creates initial plan document
2. **COMMIT**: "Initial plan draft"
3. Self-review the plan thoroughly
4. Agent updates plan with self-review findings
5. **COMMIT**: "Plan after self-review"
6. User reviews and requests modifications
7. Agent updates plan based on user feedback
8. **COMMIT**: "Plan with user feedback"
9. Final self-review of updated plan
10. Final updates based on self-review
11. **COMMIT**: "Final approved plan"
12. Iterate steps 6-11 until agreement is reached

**Phase Design Goals**:
Each phase should be:
- A separate piece of work that can be checked in as a unit
- A complete set of functionality
- Self-contained and independently valuable

**Process**:
1. **Phase Definition**
   - Break work into logical phases
   - Each phase must:
     - Have a clear, single objective
     - Be independently testable
     - Deliver observable value
     - Be a complete unit that can be committed
     - End with evaluation discussion and single commit
   - Note dependencies inline, for example:
     ```markdown
     Phase 2: API Endpoints
     - Depends on: Phase 1 (Database Schema)
     - Objective: Create /users and /todos endpoints
     - Evaluation: Test coverage, API design review, performance check
     - Commit: Will create single commit after user approval
     ```

2. **Success Metrics**
   - Define "done" for each phase
   - Include test coverage requirements
   - Specify performance benchmarks
   - Document acceptance tests

3. **Self-Review Process**
   - **First Self-Review** (after plan creation):
     - Assess feasibility and phase breakdown
     - Verify completeness of planned approach
     - Update plan based on self-identified gaps
   - **Second Self-Review** (after human review):
     - Validate adjustments align with feedback
     - Confirm approach is sound
     - Final plan refinement

   **Note**: Self-review only - no multi-agent consultation in SOLO variant

**⚠️ IMPORTANT**: Comprehensive self-review required before proceeding

**Output**: Single plan document in `codev/plans/####-descriptive-name.md`
- Same filename as specification, different directory
- All self-review findings incorporated directly
- Include phase status tracking within this document
- **DO NOT include time estimates** - Focus on deliverables and dependencies, not hours/days
- Version control captures evolution through commits
**Template**: `templates/plan.md`
**Review Required**: Yes - Technical lead approval AFTER self-review

### (IDE) - Implementation Loop

Execute for each phase in the plan. This is a strict cycle that must be completed in order.

**⚠️ MANDATORY**: The I-D-E cycle MUST be completed for EACH PHASE, not just at the end of all phases. Skipping D (Defend) or E (Evaluate) for any phase is a PROTOCOL VIOLATION.

**CRITICAL PRECONDITION**: Before starting any phase, verify the previous phase was committed to git. No phase can begin without the prior phase's commit.

**Phase Completion Process**:
1. **Implement** - Build the code for this phase
2. **Defend** - Write comprehensive tests that guard functionality
3. **Evaluate** - Assess and discuss with user
4. **Commit** - Single atomic commit for the phase (MANDATORY before next phase)
5. **Proceed** - Move to next phase only after commit

**Handling Failures**:
- If **Defend** phase reveals gaps → return to **Implement** to fix
- If **Evaluation** reveals unmet criteria → return to **Implement**
- If user requests changes → return to **Implement**
- If fundamental plan flaws found → mark phase as `blocked` and revise plan

**Commit Requirements**:
- Each phase MUST end with a git commit before proceeding
- Commit message format: `[Spec ####][Phase: name] type: Description`
- No work on the next phase until current phase is committed
- If changes are needed after commit, create a new commit with fixes

#### I - Implement (Build with Discipline)

**Purpose**: Transform the plan into working code with high quality standards.

**Precondition**: Previous phase must be committed (verify with `git log`)

**Requirements**:
1. **Pre-Implementation**
   - Verify previous phase is committed to git
   - Review the phase plan and success criteria
   - Set up the development environment
   - Create feature branch following naming convention
   - Document any plan deviations immediately

2. **During Implementation**
   - Write self-documenting code
   - Follow project style guide strictly
   - Implement incrementally with frequent commits
   - Each commit must:
     - Be atomic (single logical change)
     - Include descriptive message
     - Reference the phase
     - Pass basic syntax checks

3. **Code Quality Standards**
   - No commented-out code
   - No debug prints in final code
   - Handle all error cases explicitly
   - Include necessary logging
   - Follow security best practices

4. **Documentation Requirements**
   - Update API documentation
   - Add inline comments for complex logic
   - Update README if needed
   - Document configuration changes

**Evidence Required**:
- Link to commits
- Code review approval (if applicable)
- No linting errors
- CI pipeline pass link (build/test/lint)

**Self-Review Process**:
- Critically review code quality, patterns, security, best practices
- Look for potential improvements and issues
- Update code based on self-identified concerns before proceeding

#### D - Defend (Write Comprehensive Tests)

**Purpose**: Create comprehensive automated tests that safeguard intended behavior and prevent regressions.

**CRITICAL**: Tests must be written IMMEDIATELY after implementation, NOT retroactively at the end of all phases. This is MANDATORY.

**Requirements**:
1. **Defensive Test Creation**
   - Write unit tests for all new functions
   - Create integration tests for feature flows
   - Develop edge case coverage
   - Build error condition tests
   - Establish performance benchmarks

2. **Test Validation** (ALL MANDATORY)
   - All new tests must pass
   - All existing tests must pass
   - No reduction in overall coverage
   - Performance benchmarks met
   - Security scans pass
   - **Avoid Overmocking**:
     - Test behavior, not implementation details
     - Prefer integration tests over unit tests with heavy mocking
     - Only mock external dependencies (APIs, databases, file systems)
     - Never mock the system under test itself
     - Use real implementations for internal module boundaries

3. **Test Suite Documentation**
   - Document test scenarios
   - Explain complex test setups
   - Note any flaky tests
   - Record performance baselines

**Evidence Required**:
- Test execution logs
- Coverage report (show no reduction)
- Performance test results (if applicable per spec)
- Security scan results (if configured)
- CI test run link with artifacts

**Self-Review Process**:
- Review test coverage completeness and edge cases
- Assess defensive patterns and test strategy
- Write additional tests based on self-identified gaps
- Document review findings for evaluation discussion

#### E - Evaluate (Assess Objectively)

**Purpose**: Verify the implementation fully satisfies the phase requirements and maintains system quality. This is where the critical discussion happens before committing the phase.

**Requirements**:
1. **Functional Evaluation**
   - All acceptance criteria met
   - User scenarios work as expected
   - Edge cases handled properly
   - Error messages are helpful

2. **Non-Functional Evaluation**
   - Performance requirements satisfied
   - Security standards maintained
   - Code maintainability assessed
   - Technical debt documented

3. **Deviation Analysis**
   - Document any changes from plan
   - Explain reasoning for changes
   - Assess impact on other phases
   - Update future phases if needed
   - **Overmocking Check** (MANDATORY):
     - Verify tests focus on behavior, not implementation
     - Ensure at least one integration test per critical path
     - Check that internal module boundaries use real implementations
     - Confirm mocks are only used for external dependencies
     - Tests should survive refactoring that preserves behavior

4. **Final Self-Review Before User Evaluation**
   - Perform thorough self-assessment of the phase
   - Identify and fix any remaining issues
   - **CRITICAL**: Ensure high confidence in the implementation
   - Only proceed to user evaluation after thorough self-validation
   - If any doubts remain, address them FIRST

5. **Evaluation Discussion with User**
   - Present to user: "Phase X complete. Here's what was built: [summary]"
   - Share test results and coverage metrics
   - Share self-review findings and confidence level
   - Ask: "Any changes needed before I commit this phase?"
   - Incorporate user feedback if requested
   - Get explicit approval to proceed

6. **Phase Commit** (MANDATORY - NO EXCEPTIONS)
   - Create single atomic commit for the entire phase
   - Commit message: `[Spec ####][Phase: name] type: Description`
   - Update the plan document marking this phase as complete
   - Push all changes to version control
   - Document any deviations or decisions in the plan
   - **CRITICAL**: Next phase CANNOT begin until this commit is complete
   - Verify commit with `git log` before proceeding

7. **Final Verification**
   - Confirm all self-review findings were addressed
   - Verify all tests pass
   - Check that documentation is updated
   - Ensure no outstanding concerns from user

**Evidence Required**:
- Evaluation checklist completed
- Test results and coverage report
- Self-review notes and findings
- User approval from evaluation discussion
- Updated plan document with:
  - Phase marked complete
  - Evaluation discussion summary
  - Any deviations noted
- Git commit for this phase
- Final CI run link after all fixes

## 📋 PHASE COMPLETION CHECKLIST (MANDATORY BEFORE NEXT PHASE)

**⚠️ STOP: DO NOT PROCEED TO NEXT PHASE UNTIL ALL ITEMS ARE ✅**

### Before Starting ANY Phase:
- [ ] Previous phase is committed to git (verify with `git log`)
- [ ] Plan document shows previous phase as `completed`
- [ ] No outstanding issues from previous phase

### After Implement Phase:
- [ ] All code for this phase is complete
- [ ] Code follows project style guide
- [ ] No commented-out code or debug prints
- [ ] Error handling is implemented
- [ ] Documentation is updated (if needed)
- [ ] Self-review completed (critical examination)
- [ ] Self-identified issues have been fixed

### After Defend Phase:
- [ ] Unit tests written for all new functions
- [ ] Integration tests written for critical paths
- [ ] Edge cases have test coverage
- [ ] All new tests are passing
- [ ] All existing tests still pass
- [ ] No reduction in code coverage
- [ ] Overmocking check completed (tests focus on behavior)
- [ ] Self-review of test coverage completed
- [ ] Test gaps identified and addressed

### After Evaluate Phase:
- [ ] All acceptance criteria from spec are met
- [ ] Performance requirements satisfied
- [ ] Security standards maintained
- [ ] Thorough self-assessment completed
- [ ] High confidence in implementation achieved
- [ ] User evaluation discussion completed
- [ ] User has given explicit approval to proceed
- [ ] Plan document updated with phase status
- [ ] Phase commit created with proper message format
- [ ] Commit pushed to version control
- [ ] Commit verified with `git log`

### ❌ PHASE BLOCKERS (Fix Before Proceeding):
- Any failing tests
- Unresolved self-review concerns
- Missing user approval
- Uncommitted changes
- Incomplete documentation
- Coverage reduction
- Low confidence in implementation

**REMINDER**: Each phase is atomic. You cannot start the next phase until the current phase is fully complete, tested, evaluated, and committed.

### R - Review/Refine/Revise (Continuous Improvement)

**Purpose**: Ensure overall coherence, capture learnings, and improve the methodology.

**Precondition**: All implementation phases must be committed (verify with `git log --oneline | grep "\[Phase"`)

**Process**:
1. **Comprehensive Review**
   - Verify all phases have been committed to git
   - Compare final implementation to original specification
   - Assess overall architecture impact
   - Review code quality across all changes
   - Validate documentation completeness

2. **Refinement Actions**
   - Refactor code for clarity if needed
   - Optimize performance bottlenecks
   - Improve test coverage gaps
   - Enhance documentation

3. **Revision Requirements** (MANDATORY)
   - Update README.md with any new features or changes
   - Update CLAUDE.md with protocol improvements from lessons learned
   - Update specification and plan documents with final status
   - Revise architectural diagrams if needed
   - Update API documentation
   - Modify deployment guides as necessary
   - **CRITICAL**: Update this protocol document based on lessons learned

4. **Systematic Issue Review** (MANDATORY)
   - Review entire project for systematic issues:
     - Repeated problems across phases
     - Process bottlenecks or inefficiencies
     - Missing documentation patterns
     - Technical debt accumulation
     - Testing gaps or quality issues
   - Document systematic findings in lessons learned
   - Create action items for addressing systematic issues

5. **Lessons Learned** (MANDATORY)
   - What went well?
   - What was challenging?
   - What would you do differently?
   - What methodology improvements are needed?
   - What systematic issues were identified?

6. **Methodology Evolution**
   - Propose process improvements based on lessons
   - Update protocol documents with improvements
   - Update templates if needed
   - Share learnings with team
   - Document in `codev/reviews/`
   - **Important**: This protocol should evolve based on each project's learnings

**Output**:
- Single review document in `codev/reviews/####-descriptive-name.md`
- Same filename as spec/plan, captures review and learnings from this feature
- Methodology improvement proposals (update protocol if needed)

**Review Required**: Yes - Team retrospective recommended

## File Naming Conventions

### Specifications and Plans
Format: `####-descriptive-name.md`
- Use sequential numbering (0001, 0002, etc.)
- Same filename in both `specs/` and `plans/` directories
- Example: `0001-user-authentication.md`

## Status Tracking

Status is tracked at the **phase level** within plan documents, not at the document level.

Each phase in a plan should have a status:
- `pending`: Not started
- `in-progress`: Currently being worked on
- `completed`: Phase finished and tested
- `blocked`: Cannot proceed due to external factors

## Git Integration

### Commit Message Format

For specification/plan documents:
```
[Spec ####] <stage>: <description>
```

Examples:
```
[Spec 0001] Initial specification draft
[Spec 0001] Specification after self-review
[Spec 0001] Specification with user feedback
[Spec 0001] Final approved specification
```

For implementation:
```
[Spec ####][Phase: <phase-name>] <type>: <description>

<optional detailed description>
```

Example:
```
[Spec 0001][Phase: user-auth] feat: Add password hashing service

Implements bcrypt-based password hashing with configurable rounds
```

### Branch Naming
```
spider/####-<spec-name>/<phase-name>
```

Example:
```
spider/0001-user-authentication/database-schema
```


## Best Practices

### During Specification
- Use clear, unambiguous language
- Include concrete examples
- Define measurable success criteria
- Link to relevant references

### During Planning
- Keep phases small and focused
- Ensure each phase delivers value
- Note phase dependencies inline (no formal dependency mapping needed)
- Include rollback strategies

### During Implementation
- Follow the plan but document deviations
- Maintain test coverage
- Keep commits atomic and well-described
- Update documentation as you go

### During Review
- Check against original specification
- Document lessons learned
- Propose methodology improvements
- Update estimates for future work

## Templates

Templates for each phase are available in the `templates/` directory:
- `spec.md` - Specification template
- `plan.md` - Planning template (includes phase status tracking)
- `review.md` - Review and lessons learned template

**Remember**: Only create THREE documents per feature - spec, plan, and review with the same filename in different directories.

## Protocol Evolution

This protocol can be customized per project:
1. Fork the protocol directory
2. Modify templates and processes
3. Document changes in `protocol-changes.md`
4. Share improvements back to the community