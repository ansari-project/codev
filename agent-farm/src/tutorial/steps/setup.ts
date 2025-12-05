/**
 * Tutorial Step 2: Setup Phase
 * Creates codev directory structure and explains it
 */

import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

const AGENTS_MD_TEMPLATE = `# AI Agent Instructions

This file provides instructions to AI coding assistants working on this project.

## Project Overview

[Describe your project here]

## Development Workflow

This project uses Codev for structured AI-assisted development:

- **Specifications** (codev/specs/): What to build
- **Plans** (codev/plans/): How to build it
- **Reviews** (codev/reviews/): Lessons learned

## Available Protocols

- **TICK**: Fast protocol for small, well-defined tasks
- **SPIDER**: Full protocol with consultation for complex features

## Getting Started

1. Check \`codev/projectlist.md\` for current project status
2. Run \`af tutorial\` if you're new to the project
3. See \`codev/protocols/\` for detailed protocol documentation
`;

const PROJECTLIST_TEMPLATE = `# Project List

Track all projects and their status here.

## Active Projects

\`\`\`yaml
projects: []
\`\`\`

## Next Available Number

**0001** - Reserve this number for your next project
`;

export const setupStep: Step = {
  id: 'setup',
  title: 'Project Setup',

  async run(ctx: StepContext): Promise<StepResult> {
    if (ctx.hasCodev) {
      prompts.success('Codev is already set up in this project!');
      console.log();
      prompts.content('Your codev directory structure:');
      prompts.bullet('codev/specs/ - Feature specifications');
      prompts.bullet('codev/plans/ - Implementation plans');
      prompts.bullet('codev/reviews/ - Post-implementation reviews');
      prompts.bullet('codev/protocols/ - Development protocols');
      prompts.bullet('codev/projectlist.md - Project tracking');
      console.log();

      await prompts.pressEnter();
      return { status: 'completed' };
    }

    prompts.content('Let\'s set up the Codev directory structure.\n');
    prompts.content('This will create:');
    prompts.bullet('codev/specs/ - Where you\'ll write feature specifications');
    prompts.bullet('codev/plans/ - Where implementation plans go');
    prompts.bullet('codev/reviews/ - Where you\'ll document lessons learned');
    prompts.bullet('codev/projectlist.md - Master project tracking file');
    console.log();

    const shouldCreate = await prompts.confirm('Create these directories?');
    if (!shouldCreate) {
      prompts.info('You can manually create the codev/ directory later.');
      return { status: 'skipped' };
    }

    // Create directories
    const codevDir = resolve(ctx.projectPath, 'codev');
    const dirs = ['specs', 'plans', 'reviews', 'protocols', 'resources'];

    try {
      if (!existsSync(codevDir)) {
        mkdirSync(codevDir, { recursive: true });
      }

      for (const dir of dirs) {
        const dirPath = resolve(codevDir, dir);
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }
      }

      // Create projectlist.md
      const projectlistPath = resolve(codevDir, 'projectlist.md');
      if (!existsSync(projectlistPath)) {
        await writeFile(projectlistPath, PROJECTLIST_TEMPLATE);
      }

      // Create CLAUDE.md / AGENTS.md if they don't exist
      const claudeMdPath = resolve(ctx.projectPath, 'CLAUDE.md');
      const agentsMdPath = resolve(ctx.projectPath, 'AGENTS.md');

      if (!existsSync(claudeMdPath) && !existsSync(agentsMdPath)) {
        await writeFile(agentsMdPath, AGENTS_MD_TEMPLATE);
        prompts.success('Created AGENTS.md with project instructions');
      }

      prompts.success('Created codev/ directory structure');
      console.log();

      prompts.content('Directory structure:');
      prompts.code(`codev/
├── specs/       # Feature specifications
├── plans/       # Implementation plans
├── reviews/     # Post-implementation reviews
├── protocols/   # Development protocols
├── resources/   # Reference materials
└── projectlist.md`);

    } catch (error) {
      prompts.warn(`Failed to create directories: ${error instanceof Error ? error.message : String(error)}`);
      return { status: 'aborted' };
    }

    console.log();
    prompts.info('Tip: Add AGENTS.md to version control so AI assistants can read it.');
    console.log();

    await prompts.pressEnter();
    return { status: 'completed' };
  },
};
