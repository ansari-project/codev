/**
 * Tutorial Step 1: Welcome & Project Detection
 * Introduces Codev/Agent Farm and detects the project environment
 */

import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

export const welcomeStep: Step = {
  id: 'welcome',
  title: 'Welcome & Project Detection',

  async run(ctx: StepContext): Promise<StepResult> {
    prompts.content('Welcome to Agent Farm! This tutorial will help you get started');
    prompts.content('with structured AI-assisted development.\n');

    // Show what we detected
    prompts.content('About your project:');
    prompts.bullet(`Project: ${ctx.projectName}`);
    prompts.bullet(`Type: ${ctx.projectType === 'other' ? 'Unknown' : ctx.projectType}`);
    prompts.bullet(`Git repository: ${ctx.hasGit ? 'Yes' : 'No'}`);
    prompts.bullet(`Codev initialized: ${ctx.hasCodev ? 'Yes' : 'No'}`);
    console.log();

    // Warn if not in a git repo
    if (!ctx.hasGit) {
      prompts.warn('This directory is not a git repository.');
      prompts.content('Codev works best with git for version control and worktrees.');
      console.log();
      const shouldContinue = await prompts.confirm('Continue anyway?');
      if (!shouldContinue) {
        prompts.info('Run `git init` to initialize a repository, then run `af tutorial` again.');
        return { status: 'aborted' };
      }
    }

    // Explain what Codev/Agent Farm is
    prompts.content('\nWhat is Agent Farm?\n');
    prompts.content('Agent Farm helps you work with AI coding assistants more effectively by:');
    prompts.bullet('Organizing work into specs, plans, and reviews');
    prompts.bullet('Using structured protocols (SPIDER, TICK) for development');
    prompts.bullet('Enabling the Architect/Builder pattern for parallel work');
    prompts.bullet('Maintaining project context and documentation');
    console.log();

    prompts.content('Key concepts:');
    prompts.bullet('Spec: What you want to build (the goal)');
    prompts.bullet('Plan: How you\'ll build it (the approach)');
    prompts.bullet('Review: What you learned (lessons and improvements)');
    console.log();

    const ready = await prompts.confirm('Ready to set up Codev in your project?');
    if (!ready) {
      return { status: 'aborted' };
    }

    return { status: 'completed' };
  },
};
