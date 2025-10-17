# Codev: Context-First Development

A development methodology that treats natural language context as code. Instead of writing code first and documenting later, you start with clear specifications that both humans and AI agents can understand and execute.

## Get Started

Tell your AI agent:
```
Apply Codev to this repo following the instructions at https://github.com/ansari-project/codev/blob/main/INSTALL.md
```

Then say "I want to build X using the SPIDER protocol" or "Teach me about Codev". 

## Learn about Codev

### 📺 Quick Introduction (5 minutes)
[![Codev Introduction](https://img.youtube.com/vi/vq_dmfyMHRA/0.jpg)](https://youtu.be/vq_dmfyMHRA)

Watch a brief overview of what Codev is and how it works.

*Generated using [NotebookLM](https://notebooklm.google.com/notebook/e8055d06-869a-40e0-ab76-81ecbfebd634) - Visit the notebook to ask questions about Codev and learn more.*

### 📺 Extended Overview (Full Version)
[![Codev Extended Overview](https://img.youtube.com/vi/8KTHoh4Q6ww/0.jpg)](https://www.youtube.com/watch?v=8KTHoh4Q6ww)

A comprehensive walkthrough of the Codev methodology and its benefits.

### 🎯 Codev Tour - Building a Conversational Todo Manager
See Codev in action! Follow along as we use the SPIDER protocol to build a conversational todo list manager from scratch:

👉 [**Codev Demo Tour**](https://github.com/ansari-project/codev-demo/blob/main/codev-tour.md)

This tour demonstrates:
- How to write specifications that capture all requirements
- How the planning phase breaks work into manageable chunks
- The IDE loop in action (Implement → Defend → Evaluate)
- Multi-agent consultation with GPT-5 and Gemini Pro
- How lessons learned improve future development

## What is Codev?

Codev is a development methodology that treats **natural language context as code**. Instead of writing code first and documenting later, you start with clear specifications that both humans and AI agents can understand and execute.

📖 **Read the full story**: [Why We Created Codev: From Theory to Practice](docs/why.md) - Learn about our journey from theory to implementation and how we built a todo app without directly editing code.

### Core Philosophy

1. **Context Drives Code** - Context definitions flow from high-level specifications down to implementation details
2. **Human-AI Collaboration** - Designed for seamless cooperation between developers and AI agents
3. **Evolving Methodology** - The process itself evolves and improves with each project

## The SP(IDE)R Protocol

Our flagship protocol for structured development:

- **S**pecify - Define what to build in clear, unambiguous language
- **P**lan - Break specifications into executable phases
- **For each phase:** **I**mplement → **D**efend → **E**valuate
  - **Implement**: Build the code to meet phase objectives
  - **Defend**: Write comprehensive tests that protect your code—not just validation, but defensive fortifications against bugs and regressions
  - **Evaluate**: Verify requirements are met, get user approval, then commit
- **R**eview - Capture lessons and improve the methodology

## Project Structure

```
your-project/
├── codev/
│   ├── protocols/
│   │   └── spider/          # The SP(IDE)R protocol
│   │       ├── protocol.md  # Detailed protocol documentation
│   │       ├── manifest.yaml
│   │       └── templates/   # Document templates
│   ├── specs/              # Feature specifications
│   ├── plans/              # Implementation plans
│   ├── reviews/            # Review and lessons learned
│   └── resources/          # Reference materials (llms.txt, etc.)
├── CLAUDE.md               # AI agent instructions
└── [your code]
```

## Key Features

### 📄 Documents Are First-Class Citizens
- Specifications, plans, and lessons all tracked
- All decisions captured in version control
- Clear traceability from idea to implementation

### 🤖 AI-Native Workflow
- Structured formats that AI agents understand
- Multi-agent consultation support (GPT-5, Gemini Pro, etc.)
- Reduces back-and-forth from dozens of messages to 3-4 document reviews

### 🔄 Continuous Improvement
- Every project improves the methodology
- Lessons learned feed back into the process
- Templates evolve based on real experience

## 📚 Example Implementations

Both projects below were given **the exact same prompt** to build a Todo Manager application using **Claude Code with Opus**. The difference? The methodology used:

### [Todo Manager - VIBE](https://github.com/ansari-project/todo-manager-vibe)
- Built using a **VIBE-style prompt** approach
- Shows rapid prototyping with conversational AI interaction
- Demonstrates how a simple prompt can drive development
- Results in working code through chat-based iteration

### [Todo Manager - SPIDER](https://github.com/ansari-project/todo-manager-spider)
- Built using the **SPIDER protocol** with full document-driven development
- Same requirements, but structured through formal specifications and plans
- Demonstrates all phases: Specify → Plan → (IDE Loop) → Review
- Complete with specs, plans, and review documents
- Multi-agent consultation throughout the process

### 📊 Automated Multi-Agent Analysis

**Note**: This comparison was generated through automated analysis by 3 independent AI agents (Claude, GPT-5, and Gemini Pro), not human review. The findings below represent their consensus assessment:

#### Quality Scores (out of 100)
| Aspect | VIBE | SPIDER |
|--------|------|--------|
| **Overall Score** | **12-15** | **92-95** |
| Functionality | 0 | 100 |
| Test Coverage | 0 | 85 |
| Documentation | 0 | 95 |
| Architecture | N/A | 90 |
| Production Readiness | 0 | 85 |

#### Key Differences

**VIBE Implementation:**
- ❌ **3 files total** - Just Next.js boilerplate
- ❌ **0% functionality** - No todo features implemented
- ❌ **0 tests** - No validation or quality assurance
- ❌ **No database** - No data persistence
- ❌ **No API routes** - No backend functionality
- ❌ **No components** - Just default Next.js template

**SPIDER Implementation:**
- ✅ **32 source files** - Complete application structure
- ✅ **100% functionality** - Full CRUD operations
- ✅ **5 test suites** - API, components, database, MCP coverage
- ✅ **SQLite + Drizzle ORM** - Proper data persistence
- ✅ **Complete API** - RESTful endpoints for all operations
- ✅ **Component architecture** - TodoForm, TodoList, TodoItem, ConversationalInterface
- ✅ **MCP integration** - AI-ready with server wrapper
- ✅ **Type safety** - TypeScript + Zod validation
- ✅ **Error handling** - Boundaries and optimistic updates
- ✅ **Documentation** - Specs, plans, and lessons learned

#### Why SPIDER Won

As GPT-5 noted: *"SPIDER's methodology clearly outperformed... Plan-first approach with defined scope, iterative verification, and delivery mindset"*

Gemini Pro explained: *"SPIDER correctly inferred the user's intent... It saves hours, if not days, of setup... It builds code the way a professional team would"*

The verdict from all 3 agents: **Context-driven development ensures completeness**, while conversational approaches can miss the mark entirely despite identical prompts and AI models.

## 🐕 Eating Our Own Dog Food

Codev is **self-hosted** - we use Codev methodology to build Codev itself. This means:

- **Our test infrastructure** is specified in `codev/specs/0001-test-infrastructure.md`
- **Our development process** follows the SP(IDE)R protocol we advocate
- **Our improvements** come from lessons learned using our own methodology

This self-hosting approach ensures:
1. The methodology is battle-tested on real development
2. We experience the same workflow we recommend to users
3. Any pain points are felt by us first and fixed quickly
4. The framework evolves based on actual usage, not theory

You can see this in practice:
- Check `codev/specs/` for our feature specifications
- Review `codev/plans/` for how we break down work
- Learn from `codev/reviews/` to see what we've discovered

### Test Infrastructure

Our comprehensive test suite (52 tests) validates the Codev installation process:

- **Framework**: Shell-based testing with bats-core (zero dependencies)
- **Coverage**: SPIDER protocol, SPIDER-SOLO variant, CLAUDE.md preservation
- **Isolation**: XDG sandboxing ensures tests never touch real user directories
- **CI/CD Ready**: Tests run in seconds with clear TAP output
- **Multi-Platform**: Works on macOS and Linux without modification

Run tests locally:
```bash
# Fast tests (< 30 seconds)
./scripts/run-tests.sh

# All tests including Claude CLI integration
./scripts/run-all-tests.sh
```

See `tests/README.md` for detailed test documentation.

## Installation

Ask your AI agent to:
```
Install Codev by following the instructions at https://github.com/ansari-project/codev/blob/main/INSTALL.md
```

The agent will:
1. Check for prerequisites (Zen MCP server)
2. Create the codev/ directory structure
3. Install the appropriate protocol (SPIDER or SPIDER-SOLO)
4. Set up or update your CLAUDE.md file

## Examples

### Todo Manager Tutorial

See `examples/todo-manager/` for a complete walkthrough showing:
- How specifications capture all requirements
- How plans break work into phases
- How the IDE loop ensures quality
- How lessons improve future development

## Configuration

### Customizing Templates

Templates in `codev/protocols/spider/templates/` can be modified to fit your team's needs:

- `spec.md` - Specification structure
- `plan.md` - Planning format
- `lessons.md` - Retrospective template

## AI Agents

Codev includes three specialized AI agents to enhance your development workflow (requires Claude Code with the Task tool):

### 🔄 Codev-Updater Agent

Keep your Codev installation up-to-date with the latest protocols and improvements:

```bash
# Update your Codev framework
"Please update my codev framework to the latest version"
```

The agent will:
1. Check for updates to protocols (SPIDER, TICK, etc.)
2. Update agents and templates
3. **Preserve your specs, plans, and reviews**
4. Create backups before updating
5. Provide rollback instructions

### 🏗️ Architecture-Documenter Agent

Automatically maintains comprehensive architecture documentation:

```bash
# Invoked automatically at the end of TICK protocol reviews
# Or manually: "Update the architecture documentation"
```

The agent maintains `codev/resources/arch.md` with:
- Complete directory structure
- All utility functions and helpers
- Key architectural patterns
- Component relationships
- Technology stack details

### 🕷️ Spider-Protocol-Updater Agent

Learn from SPIDER implementations across the community:

```bash
# Check a repository for SPIDER improvements
"Check [repository-url] for SPIDER improvements"
```

The agent will:
1. Analyze the repository's SPIDER implementation
2. Compare against current protocol
3. Identify improvements and lessons learned
4. Suggest protocol updates with justification

Example repositories to monitor:
- `ansari-project/todo-manager-spider` - SPIDER implementation with lessons
- Your own SPIDER projects with discovered patterns

## Contributing

We welcome contributions! Please help us improve Codev:

### Filing Issues
- **Bug Reports**: [Open an issue](https://github.com/ansari-project/codev/issues) with clear reproduction steps
- **Feature Requests**: Share your ideas for new features or improvements
- **Documentation**: Report unclear or missing documentation
- **Questions**: Ask for clarification or help with implementation

### Contributing Code
- New protocols beyond SP(IDE)R
- Improved templates
- Integration tools
- Case studies
- SPIDER protocol improvements from your implementations

## License

MIT - See LICENSE file for details

---

*Built with Codev - where context drives code*
