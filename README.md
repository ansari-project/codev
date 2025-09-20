# Codev: Context-First Development

A methodology framework for building software where context drives development, not the other way around.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ansari-project/codev.git

# Install in your project
cd your-project
../codev/install.sh

# Tell your AI agent
"Follow the Codev methodology in CLAUDE.md"
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
- **I**mplement → **D**efend → **E**valuate - Iterative development loop
- **R**eview - Capture lessons and improve the methodology

### Why "Defend"?

We chose "Defend" over "Test" because it emphasizes **writing tests that protect your code**. Tests aren't just validation—they're defensive fortifications against bugs and regressions.

## Project Structure

```
your-project/
├── codev/
│   ├── protocols/
│   │   └── spider/          # The SP(IDE)R protocol
│   │       ├── protocol.md  # Detailed protocol documentation
│   │       ├── manifest.yaml
│   │       └── templates/   # Document templates
│   ├── specs/              # WHAT to build
│   ├── plans/              # HOW to build
│   └── ref/                # Research & lessons learned
├── CLAUDE.md               # AI agent instructions
└── [your code]
```

## Key Features

### 📄 Document-Driven Development
- Three documents per feature: spec, plan, lessons
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

### For New Projects

```bash
# Run the installation script
./install.sh

# This creates:
# - codev/ directory structure
# - CLAUDE.md with AI instructions
# - Example specifications
# - Protocol templates
```

### For Existing Projects

1. Copy the `codev/` directory to your project root
2. Copy `CLAUDE.md` to your project root
3. Customize `CLAUDE.md` with your project-specific instructions

## Usage

### With AI Agents (Recommended)

Tell your AI agent (Claude, GPT-4, etc.):

> "Follow the Codev methodology described in CLAUDE.md. Use the SP(IDE)R protocol."

The agent will:
1. Ask clarifying questions
2. Create a specification document
3. Generate an implementation plan
4. Execute the IDE loop for each phase
5. Document lessons learned

### Manual Usage

1. **Create a Specification**
   - Use template: `codev/protocols/spider/templates/spec.md`
   - Save as: `codev/specs/0001-feature-name.md`

2. **Develop a Plan**
   - Use template: `codev/protocols/spider/templates/plan.md`
   - Save as: `codev/plans/0001-feature-name.md`

3. **Execute IDE Loop**
   - **I**mplement: Write code for the phase
   - **D**efend: Write comprehensive tests
   - **E**valuate: Verify requirements are met

4. **Review & Learn**
   - Use template: `codev/protocols/spider/templates/lessons.md`
   - Save as: `codev/ref/lessons/0001-feature-name.md`

## Multi-Agent Consultation

Enable AI consultation at key decision points:

```yaml
# In your specification
multi_agent: true
models:
  - gpt-5
  - gemini-2.5-pro
```

The protocol will automatically consult multiple models for:
- Specification review
- Plan validation
- Code quality assessment
- Test coverage analysis

## Examples

### Todo Manager Tutorial

See `examples/todo-manager/` for a complete walkthrough showing:
- How specifications capture all requirements
- How plans break work into phases
- How the IDE loop ensures quality
- How lessons improve future development

### Quick Example

```markdown
# Specification: User Authentication

## Problem Statement
Users need secure authentication with email/password

## Success Criteria
- [ ] Users can register with email
- [ ] Passwords are hashed with bcrypt
- [ ] Sessions persist across requests
- [ ] Rate limiting prevents brute force

## Solution Approaches
### Approach 1: JWT Tokens
- Pros: Stateless, scalable
- Cons: Can't revoke easily

### Approach 2: Session cookies
- Pros: Easy revocation
- Cons: Requires session store
```

## Best Practices

### For Specifications
- Start with clarifying questions
- Include at least 3 solution approaches
- Define measurable success criteria
- Document all assumptions

### For Plans
- Keep phases under 5 days
- Each phase should be independently valuable
- Include rollback strategies
- Note dependencies explicitly

### For Implementation
- Follow the plan but document deviations
- Maintain >90% test coverage
- Keep commits atomic and well-described
- Update docs as you code

## Configuration

### Customizing Templates

Templates in `codev/protocols/spider/templates/` can be modified to fit your team's needs:

- `spec.md` - Specification structure
- `plan.md` - Planning format
- `lessons.md` - Retrospective template
- `review.md` - Review checklist

### Protocol Configuration

Edit `manifest.yaml` to customize:
- Phase requirements
- Git integration
- Validation rules
- Expert consultation settings

## Contributing

We welcome contributions:
- New protocols beyond SP(IDE)R
- Improved templates
- Integration tools
- Case studies

## Philosophy

> "Software is not just code—it's understanding problems, designing solutions, and building systems that serve human needs. Codev makes this process explicit, traceable, and collaborative."

## Resources

- [Full Protocol Documentation](codev/protocols/spider/protocol.md)
- [Example Specifications](codev/specs/)
- [Todo Manager Tutorial](examples/todo-manager/)

## License

MIT - See LICENSE file for details

## Support

- Issues: [GitHub Issues](https://github.com/ansari-project/codev/issues)
- Discussions: [GitHub Discussions](https://github.com/ansari-project/codev/discussions)
- Examples: See `examples/` directory

---

*Built with Codev - where context drives code*