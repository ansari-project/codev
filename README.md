# Codev: Context-First Development

A methodology framework for building software where context drives development, not the other way around.

## Quick Start

Tell your AI agent:
```
Apply Codev to this repo following the instructions at https://github.com/ansari-project/codev/blob/main/INSTALL.md
```

## What is Codev?

Codev is a development methodology that treats **natural language context as code**. Instead of writing code first and documenting later, you start with clear specifications that both humans and AI agents can understand and execute.

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

See Codev in action with these real-world examples:

### [Todo Manager - VIBE](https://github.com/ansari-project/todo-manager-vibe)
- Built using a **VIBE-style prompt** approach
- Shows rapid prototyping with conversational AI interaction
- Demonstrates how a simple prompt can drive development
- Good for comparison with structured protocol approach

### [Todo Manager - SPIDER](https://github.com/ansari-project/todo-manager-spider)
- Built using the **SPIDER protocol** with full document-driven development
- Demonstrates all phases: Specify → Plan → (IDE Loop) → Review
- Shows how lessons learned improve the protocol
- Complete with specs, plans, and review documents
- Multi-agent consultation throughout the process

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

## Protocol Improvement Process

### Spider-Protocol-Updater Agent

When SPIDER implementations in other repositories discover improvements, we can incorporate them back into the main protocol using the `spider-protocol-updater` agent (requires Claude Code with the Task tool):

```bash
# Check a repository for SPIDER improvements
# The agent will analyze their implementation and suggest protocol updates
```

To invoke the agent, ask Claude: "Check [repository-url] for SPIDER improvements"

The agent will:
1. Analyze the repository's SPIDER implementation
2. Compare it against our current protocol
3. Identify valuable improvements and lessons learned
4. Suggest specific protocol updates with justification

Example repositories to monitor:
- `ansari-project/todo-manager-spider` - SPIDER protocol implementation with lessons learned
- Your own SPIDER projects that discovered better patterns

## Contributing

We welcome contributions:
- New protocols beyond SP(IDE)R
- Improved templates
- Integration tools
- Case studies
- SPIDER protocol improvements from your implementations

## License

MIT - See LICENSE file for details

---

*Built with Codev - where context drives code*