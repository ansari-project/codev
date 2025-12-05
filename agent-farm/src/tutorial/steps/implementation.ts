/**
 * Tutorial Step 5: Implementation Demo
 * Shows how to implement using TICK or the Architect/Builder pattern
 */

import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

export const implementationStep: Step = {
  id: 'implementation',
  title: 'Implementation Workflow',

  async run(ctx: StepContext): Promise<StepResult> {
    prompts.content('Now let\'s talk about implementation!\n');
    prompts.content('There are two main ways to implement your specs:\n');

    // TICK protocol
    prompts.content('1. TICK Protocol (Simple Tasks)\n');
    prompts.content('For small, well-defined work, just implement directly:');
    prompts.code(`# Work with your AI assistant
"Please implement the spec at codev/specs/0001-tutorial-task.md
following the plan at codev/plans/0001-tutorial-task.md"

# The assistant will:
# 1. Read the spec and plan
# 2. Implement the changes
# 3. Write tests
# 4. Create a PR when done`);
    console.log();

    // Architect/Builder pattern
    prompts.content('2. Architect/Builder Pattern (Complex Work)\n');
    prompts.content('For larger features or parallel development:\n');
    prompts.code(`# Start the dashboard
af start

# Spawn a builder for a spec
af spawn --project 0001

# Or spawn for an ad-hoc task
af spawn --task "Fix the login validation"`);
    console.log();

    prompts.content('The Architect/Builder pattern:');
    prompts.bullet('Architect (you + AI): Creates specs, reviews work');
    prompts.bullet('Builders (autonomous AI): Implement in isolated worktrees');
    prompts.bullet('Each builder gets its own branch and terminal');
    prompts.bullet('Multiple builders can work in parallel');
    console.log();

    // Key commands
    prompts.content('Key Commands:\n');

    prompts.step(1, 'af start       - Launch the architect dashboard');
    prompts.step(2, 'af spawn -p X  - Spawn a builder for spec X');
    prompts.step(3, 'af status      - Check status of all agents');
    prompts.step(4, 'af send X      - Send instructions to a builder');
    prompts.step(5, 'af annotate F  - Open file F in annotation viewer');
    prompts.step(6, 'af stop        - Stop all agent farm processes');
    console.log();

    // Practical advice
    prompts.content('Best Practices:\n');
    prompts.bullet('Start with TICK for simple tasks');
    prompts.bullet('Use Architect/Builder when you have multiple specs');
    prompts.bullet('Keep specs focused - one feature per builder');
    prompts.bullet('Review builder output before merging');
    console.log();

    const wantToTry = await prompts.confirm('Would you like to try starting the dashboard?', false);

    if (wantToTry) {
      prompts.content('\nTo start the dashboard, run in your terminal:\n');
      prompts.highlight('af start');
      console.log();
      prompts.content('This will open a web-based dashboard where you can:');
      prompts.bullet('See the architect terminal');
      prompts.bullet('View spawned builders');
      prompts.bullet('Open files in the annotation viewer');
      console.log();
      prompts.info('The dashboard runs at http://localhost:4200 by default.');
    }

    console.log();
    await prompts.pressEnter();
    return { status: 'completed' };
  },
};
