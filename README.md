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
│   ├── lessons/            # Lessons learned
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

## Contributing

We welcome contributions:
- New protocols beyond SP(IDE)R
- Improved templates
- Integration tools
- Case studies

## License

MIT - See LICENSE file for details

---

*Built with Codev - where context drives code*