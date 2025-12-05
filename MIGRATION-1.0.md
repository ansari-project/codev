# Migration Guide: Upgrading to Codev v1.0.x

This guide covers migrating an existing codev installation to v1.0.x.

## Scenario: Existing Codev Project → v1.0.x

You have a project that previously installed codev (from codev-skeleton) and want to upgrade.

## Prerequisites

Before migrating, ensure all dependencies are installed. See **[DEPENDENCIES.md](codev-skeleton/DEPENDENCIES.md)** for complete installation instructions.

**Quick check:**

```bash
# Run the doctor script
./codev/bin/codev-doctor

# Or check manually
which node && node --version    # Need 18+
which tmux && tmux -V           # Need 3.0+
which ttyd && ttyd --version    # Need 1.7+
which git && git --version      # Need 2.5+
which gh && gh auth status      # Need authenticated
which python3 && python3 --version  # Need 3.10+
which claude || which gemini || which codex  # Need at least one
```

---

## What Gets Preserved vs Merged vs Deleted

**PRESERVED (your work - never touched):**
```
codev/specs/           # Your specifications
codev/plans/           # Your implementation plans
codev/reviews/         # Your review documents
codev/projectlist.md   # Your project tracking
codev/resources/       # Your architecture docs (arch.md, etc.)
codev/config.json      # Your custom configuration (if exists)
```

**MERGED (AI compares old vs new, preserves local customizations):**
```
codev/bin/             # CLI scripts - usually safe to replace
codev/protocols/       # May have local modifications to protocols
codev/templates/       # May have local UI customizations
codev/roles/           # May have customized role prompts
CLAUDE.md              # May have project-specific instructions
AGENTS.md              # May have project-specific instructions
```

**DELETED (obsolete artifacts from pre-1.0):**
```
codev/builders.md              # Old state file (now .agent-farm/state.json)
.architect.pid                 # Old process tracking
.architect.log                 # Old log file
.builders/                     # Old worktrees (will be recreated)
codev/bin/architect            # Old bash script
```

---

## Migration Process (AI-Assisted)

Migration should be performed by an AI assistant (Claude, etc.) that can:
1. Read both old and new versions of files
2. Identify local customizations worth preserving
3. Merge intelligently rather than blindly overwriting

### Step 1: Stop Running Processes

```bash
pkill -f 'agent-farm' 2>/dev/null
pkill -f 'ttyd.*42' 2>/dev/null
tmux kill-server 2>/dev/null
```

### Step 2: Clean Up Obsolete Files

```bash
cd /path/to/your/project

# Remove old state files
rm -f codev/builders.md
rm -f .architect.pid .architect.log

# Remove old worktrees (they'll be recreated)
rm -rf .builders/
git worktree prune

# Remove old agent-farm state
rm -rf .agent-farm/
```

### Step 3: AI Merges Framework Components

The AI should compare each file/directory and merge appropriately:

**For `codev/bin/`**: Usually safe to replace entirely (scripts are standard).

**For `codev/protocols/`**: Check if user modified any protocol files. If so, merge the changes. If not, replace.

**For `codev/templates/`**: Check for UI customizations (colors, layout, etc.). Merge any customizations into new templates.

**For `codev/roles/`**: Check for customized role prompts. Preserve any project-specific instructions.

**For `CLAUDE.md` and `AGENTS.md`**: These often have project-specific sections. Merge new codev instructions while preserving project-specific content.

### Step 4: Install agent-farm

**Option A: Use global agent-farm (recommended for most users)**

If you have the codev source repo, you can run agent-farm from there:
```bash
# Add alias to your shell profile
alias af='/path/to/codev/agent-farm/dist/index.js'

# Or symlink the wrapper script
ln -s /path/to/codev/codev/bin/agent-farm /usr/local/bin/af
```

**Option B: Copy agent-farm to project (for isolated/portable installs)**

Only if you need a fully self-contained project:
```bash
cp -r /path/to/codev/agent-farm .
cd agent-farm && npm install && npm run build && cd ..
```

### Step 5: Update .gitignore

Ensure your `.gitignore` includes:

```
# Agent Farm
.agent-farm/
.builders/

# If using local agent-farm copy
agent-farm/node_modules/
agent-farm/dist/

# Consultation logs
.consult/
```

### Step 6: Configure AI Commands (Optional)

Create or update `codev/config.json` to customize AI CLI commands:

```json
{
  "shell": {
    "architect": "claude --dangerously-skip-permissions",
    "builder": "claude --dangerously-skip-permissions",
    "shell": "bash"
  }
}
```

**Configuration options:**
- `shell.architect`: Command for architect terminal (default: `claude`)
- `shell.builder`: Command for builder terminals (default: `claude`)
- `shell.shell`: Command for utility shells (default: `bash`)
- `--dangerously-skip-permissions`: Skip permission prompts (use at your own risk)

You can also override these via CLI flags: `--architect-cmd`, `--builder-cmd`, `--shell-cmd`

### Step 7: Update Templates (projectlist.md, CLAUDE.md, AGENTS.md)

Several templates have been improved in v1.0.x. Update your project's versions while preserving your content:

**projectlist.md improvements:**
- YAML format with structured fields (id, title, summary, status, priority, dependencies, tags)
- Lifecycle stages: conceived → specified → planned → implementing → implemented → committed → integrated
- Terminal states: abandoned, on-hold
- Active projects sorted to the top
- Tags for categorization
- Dependencies tracking

```bash
# Compare your projectlist with the new template
diff codev/projectlist.md /path/to/codev/codev-skeleton/projectlist.md
```

**CLAUDE.md / AGENTS.md improvements:**
- Updated protocol documentation
- Architect-Builder pattern with new CLI commands
- Consult tool documentation for multi-agent consultation
- Git workflow restrictions (explicit file staging, no squash merges)
- Release process guidelines

The AI migration assistant should merge these template improvements while preserving your project-specific content (specs, plans, reviews, project entries).

### Step 8: Verify Installation

```bash
# Check CLI works
./codev/bin/agent-farm --help

# Run health check
./codev/bin/codev-doctor

# Test starting the dashboard
./codev/bin/agent-farm start
```

---

## Post-Migration Checklist

- [ ] Dependencies installed (ttyd, tmux, node 18+, git, gemini-cli, codex)
- [ ] `./codev/bin/agent-farm --help` shows available commands
- [ ] `./codev/bin/codev-doctor` passes all checks (AI CLIs show "working")
- [ ] Dashboard starts with `./codev/bin/agent-farm start`
- [ ] Your specs in `codev/specs/` are intact
- [ ] Your plans in `codev/plans/` are intact
- [ ] Your reviews in `codev/reviews/` are intact
- [ ] `codev/projectlist.md` updated to new YAML format
- [ ] `codev/config.json` created with shell commands configured
- [ ] `CLAUDE.md` / `AGENTS.md` updated with latest protocol docs
- [ ] Any local customizations were preserved during merge

---

## AI Migration Prompt

When asking an AI to perform the migration, use this prompt:

```
I need to migrate my project from an older version of codev to v1.0.x.

Source codev repo: /path/to/codev
My project: /path/to/my/project

Please:
1. Check prerequisites (ttyd, tmux, node, git, gemini-cli, codex)
2. Clean up obsolete files (builders.md, .architect.pid, .builders/, etc.)
3. Compare my codev/protocols/, codev/templates/, codev/roles/ with the
   new versions in codev-skeleton/ and merge any local customizations
4. Compare my CLAUDE.md/AGENTS.md with codev-skeleton/ versions and
   merge, preserving my project-specific content
5. Update codev/projectlist.md to the new YAML format:
   - Convert existing projects to new schema (id, title, summary, status, etc.)
   - Add lifecycle stages and tags
   - Sort active projects to the top
6. Create codev/config.json with shell command configuration
7. Update codev/bin/ with new scripts (agent-farm, codev-doctor, consult)
8. Run codev-doctor to verify all dependencies work
9. Test agent-farm start/stop

Do NOT blindly overwrite - check for local modifications first.
Preserve all existing project entries when updating projectlist.md.
```

---

## Troubleshooting

### Port already in use

```bash
./codev/bin/agent-farm ports cleanup
```

### Old state causing issues

```bash
rm -rf .agent-farm/
rm -rf ~/.agent-farm/ports.json
```

### agent-farm command not found

Check that `codev/bin/agent-farm` exists and points to a valid agent-farm installation. The wrapper script should reference either a local `agent-farm/` directory or a global installation.
