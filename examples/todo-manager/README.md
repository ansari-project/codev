# Todo Manager Tutorial: Document-Driven Development with SP(IDE)R

## What This Tutorial Demonstrates

This tutorial shows how SP(IDE)R protocol uses **documents as the primary interface** for human-AI collaboration. Instead of back-and-forth chat, the agent creates structured documents that you review and comment on directly. The entire development process is captured in just three documents per feature.

## The Initial Prompt

Copy and paste this exact prompt into Claude (or another AI assistant):

```
I want to build a Todo Manager application using the Codev SP(IDE)R protocol.

Requirements:
- Use Next.js 14+ with TypeScript and App Router
- Deploy-ready for Vercel (serverless-friendly)
- Features: Create, read, update, delete todos with priority levels (low/medium/high), due dates, and status (pending/completed)
- Include filtering by status and priority
- Create an MCP server wrapper around the API for AI agent access
- Follow the SP(IDE)R protocol with multi-agent consultation enabled

Please start with the Specification phase. Create the specification document with your clarifying questions included.
```

## The Document Flow

### Document 1: The Specification (`codev/specs/0001-todo-manager.md`)

The agent will create a comprehensive specification document that includes:

```markdown
# Specification: Todo Manager

## Clarifying Questions Asked
- Q: Should this support multiple users or single user?
  A: [Your answer here]
- Q: What database preference - SQLite, PostgreSQL, or in-memory?
  A: [Your answer here]
- Q: Should todos support subtasks or attachments?
  A: [Your answer here]
- Q: Do we need real-time synchronization across devices?
  A: [Your answer here]
- Q: Any specific design system or UI framework preference?
  A: [Your answer here]

## Problem Statement
[Agent fills this based on your requirements and answers]

## Solution Approaches

### Approach 1: Server-Side Rendered with API Routes
[Details about Next.js App Router approach]

### Approach 2: Static Site with Client-Side State
[Details about JAMstack approach]

### Approach 3: Full-Stack with Real-Time Updates
[Details about WebSocket-based approach]

## Success Criteria
- [ ] All CRUD operations functional
- [ ] Filtering works correctly
- [ ] MCP server can access all operations
- [ ] Tests pass with >90% coverage
- [ ] Deploys successfully to Vercel

## Expert Consultation Log
- GPT-5 feedback: [Incorporated feedback on architecture]
- Gemini Pro feedback: [Incorporated feedback on testing strategy]
```

**Your Role**:
1. Answer the clarifying questions directly in the document
2. Add comments like `<!-- I prefer SQLite for simplicity -->`
3. Approve with: "Specification approved, proceed to planning"

**Git History Created**:
```
[Spec 0001] Initial specification draft
[Spec 0001] Specification with multi-agent review
[Spec 0001] Specification with user feedback
[Spec 0001] Final approved specification
```

### Document 2: The Plan (`codev/plans/0001-todo-manager.md`)

Once you approve the spec, the agent creates:

```markdown
# Plan: Todo Manager

## Specification
Link to: codev/specs/0001-todo-manager.md

## Phases

### Phase 1: Walking Skeleton
**Status**: pending
**Objective**: Basic Next.js setup with minimal todo display
**Deliverables**:
- [ ] Next.js project initialized
- [ ] Basic API route for GET /api/todos
- [ ] Simple todo list display
- [ ] In-memory storage

### Phase 2: Complete CRUD Operations
**Status**: pending
**Depends on**: Phase 1
**Objective**: Full create, read, update, delete functionality
**Deliverables**:
- [ ] POST /api/todos endpoint
- [ ] PUT /api/todos/[id] endpoint
- [ ] DELETE /api/todos/[id] endpoint
- [ ] UI forms for all operations
- [ ] SQLite database integration

### Phase 3: Filtering and Priority System
**Status**: pending
**Depends on**: Phase 2
**Objective**: Add filtering by status and priority
[...]

### Phase 4: MCP Server Integration
**Status**: pending
**Depends on**: Phase 2
**Objective**: Create MCP wrapper for AI access
[...]

## Expert Consultation Log
- GPT-5: Suggested breaking Phase 2 into smaller commits
- Gemini Pro: Recommended adding error handling phase
```

**Your Role**:
1. Review the phases
2. Add comments like `<!-- Add keyboard shortcuts to Phase 3 -->`
3. Approve with: "Plan approved, begin implementation"

**Git History Created**:
```
[Spec 0001] Initial plan draft
[Spec 0001] Plan with multi-agent review
[Spec 0001] Plan with user feedback
[Spec 0001] Final approved plan
```

### During Implementation: The Phase Cycle

Each phase follows a strict cycle with evaluation and discussion:

#### Phase 1 Completion Example:

**After implementation**, the agent updates the plan:

```markdown
### Phase 1: Walking Skeleton
**Status**: completed ✓
**Completed**: 2024-01-15
**Actual Deliverables**:
- [x] Next.js project initialized
- [x] Basic API route for GET /api/todos
- [x] Simple todo list display
- [x] In-memory storage

**Evaluation Discussion**:
Agent: "Phase 1 complete. The walking skeleton is functional at localhost:3000.
Tests pass with 95% coverage. GPT-5 notes we should add error boundaries.
Gemini Pro suggests TypeScript strict mode for Phase 2.
Any changes needed before I commit and proceed to Phase 2?"

User: "Add error boundary to the main layout before committing."

Agent: "Added error boundary. Committing Phase 1."

**Commit**: [Spec 0001][Phase: skeleton] feat: Walking skeleton with basic todo display
**Notes**: Added error boundary based on evaluation feedback
```

#### Phase 2 Progress Example:

```markdown
### Phase 2: Complete CRUD Operations
**Status**: in-progress
**Started**: 2024-01-15
**Progress**:
- [x] POST /api/todos endpoint
- [x] PUT /api/todos/[id] endpoint
- [x] DELETE /api/todos/[id] endpoint
- [x] UI forms for all operations
- [x] SQLite database integration

**Mid-Phase Checkpoint**:
Agent: "CRUD operations complete. Ready for evaluation.
All tests passing. Coverage at 92%.
GPT-5 identified potential SQL injection risk - fixed.
Gemini Pro suggests adding optimistic UI updates."

User: "Good catch on SQL injection. Add the optimistic updates."

Agent: "Optimistic updates added. Phase 2 evaluation complete."

**Commit**: [Spec 0001][Phase: crud] feat: Complete CRUD with SQLite
**Status**: completed ✓
```

**Key Points**:
- **Every phase ends with evaluation discussion** before commit
- **Multi-agent review happens** during evaluation
- **User has final say** before phase is committed
- **Each phase gets one atomic commit** capturing all work
- **Plan document preserves** the evaluation discussion

### Document 3: Lessons Learned (`codev/ref/lessons/0001-todo-manager.md`)

After completion:

```markdown
# Lessons Learned: Todo Manager

## What Went Well
- Next.js App Router simplified API development
- MCP integration was straightforward
- Multi-agent review caught security issues early

## What Was Challenging
- SQLite setup in Vercel required workarounds
- TypeScript strict mode revealed type issues

## Deviations from Plan
- Added Phase 2.5 for error handling (GPT-5 suggestion)
- Combined Phases 4 and 5 due to overlap

## Process Improvements
- Start with stricter TypeScript from Phase 1
- Include error handling in each phase, not separate

## Metrics
- Test Coverage: 94%
- Phases Completed: 5/5
- Timeline: 2 hours (estimated 1.5)
```

## The Complete Document Set

After the entire process, you have exactly **three documents** that tell the complete story:

1. **`codev/specs/0001-todo-manager.md`** - What we built and why
2. **`codev/plans/0001-todo-manager.md`** - How we built it (with status updates)
3. **`codev/ref/lessons/0001-todo-manager.md`** - What we learned

## How to Use This Tutorial

1. **Start**: Paste the prompt into Claude
2. **Review**: Read the specification document the agent creates
3. **Comment**: Add your feedback directly in the document
4. **Approve**: Say "approved" to move to the next phase
5. **Monitor**: Watch the plan document update as phases complete
6. **Evaluate**: After each phase, discuss what was built before committing
7. **Learn**: Review the lessons document at the end

### The Evaluation Rhythm

After each implementation phase:
1. Agent completes the code
2. Agent runs tests and gets multi-agent review
3. **DISCUSSION**: Agent presents what was built, test results, and expert feedback
4. **YOUR DECISION**: Request changes or approve
5. **COMMIT**: Agent commits the phase with descriptive message
6. **PROCEED**: Move to next phase or address issues

## Key Insight: Documents Over Dialogue

Traditional approach:
```
User: "I want a todo app"
AI: "What features?"
User: "CRUD operations"
AI: "What database?"
User: "SQLite"
[... 50 more messages ...]
```

SP(IDE)R approach:
```
User: "Build a todo app with SP(IDE)R"
AI: Creates comprehensive spec document with all questions
User: Reviews and comments once
AI: Updates and proceeds
```

The document-driven approach:
- **Reduces back-and-forth** from dozens of messages to 3-4 document reviews
- **Creates permanent artifacts** that document all decisions
- **Enables async collaboration** - review documents when convenient
- **Maintains context** - everything is in the documents, not scattered in chat
- **Supports version control** - Git tracks every document evolution

## Try It Now

1. Copy the prompt above
2. Paste into Claude
3. Watch as it creates `codev/specs/0001-todo-manager.md`
4. Review the document, add your comments
5. Approve and watch the plan emerge
6. See implementation update the plan in real-time

The entire todo app will be built through just these three documents, with your input captured as comments and document approvals rather than chat messages.