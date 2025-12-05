/**
 * Tutorial step runner infrastructure
 * Manages step execution, state, and progress
 */

import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, basename } from 'node:path';
import type { TutorialState } from '../types.js';
import { getConfig } from '../utils/index.js';
import { loadTutorialState, saveTutorialState, getOrCreateTutorialState, completeStep } from './state.js';
import * as prompts from './prompts.js';
import { logger } from '../utils/logger.js';

/**
 * Detected project type
 */
export type ProjectType = 'nodejs' | 'python' | 'other';

/**
 * Context passed to each step function
 */
export interface StepContext {
  state: TutorialState;
  projectPath: string;
  projectName: string;
  projectType: ProjectType;
  hasGit: boolean;
  hasCodev: boolean;
}

/**
 * Result returned by each step
 */
export interface StepResult {
  status: 'completed' | 'skipped' | 'aborted';
  responses?: Record<string, string>;
}

/**
 * Step function signature
 */
export type StepFunction = (ctx: StepContext) => Promise<StepResult>;

/**
 * Step definition
 */
export interface Step {
  id: string;
  title: string;
  run: StepFunction;
}

/**
 * Detect project type based on files present
 */
function detectProjectType(projectPath: string): ProjectType {
  if (existsSync(resolve(projectPath, 'package.json'))) {
    return 'nodejs';
  }
  if (
    existsSync(resolve(projectPath, 'pyproject.toml')) ||
    existsSync(resolve(projectPath, 'setup.py')) ||
    existsSync(resolve(projectPath, 'requirements.txt'))
  ) {
    return 'python';
  }
  return 'other';
}

/**
 * Check if directory is a git repository
 */
function hasGitRepo(projectPath: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: projectPath,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if codev directory exists
 */
function hasCodevDir(projectPath: string): boolean {
  return existsSync(resolve(projectPath, 'codev'));
}

/**
 * Build step context from current state
 */
async function buildContext(state: TutorialState): Promise<StepContext> {
  const config = getConfig();

  return {
    state,
    projectPath: config.projectRoot,
    projectName: basename(config.projectRoot),
    projectType: detectProjectType(config.projectRoot),
    hasGit: hasGitRepo(config.projectRoot),
    hasCodev: hasCodevDir(config.projectRoot),
  };
}

/**
 * Find the index of the current step
 */
function findCurrentStepIndex(steps: Step[], currentStepId: string): number {
  return steps.findIndex((s) => s.id === currentStepId);
}

/**
 * Show tutorial status/progress
 */
export async function showStatus(steps: Step[]): Promise<void> {
  const state = await loadTutorialState();

  if (!state) {
    logger.info('No tutorial in progress. Run `af tutorial` to start.');
    return;
  }

  const currentIndex = findCurrentStepIndex(steps, state.currentStep);

  logger.header('Tutorial Progress');
  logger.kv('Started', new Date(state.startedAt).toLocaleDateString());
  logger.kv('Last active', new Date(state.lastActiveAt).toLocaleDateString());
  logger.blank();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isCompleted = state.completedSteps.includes(step.id);
    const isCurrent = i === currentIndex;

    let prefix = '  ';
    if (isCompleted) {
      prefix = '✓ ';
    } else if (isCurrent) {
      prefix = '→ ';
    }

    const status = isCompleted ? '(completed)' : isCurrent ? '(current)' : '';
    console.log(`${prefix}${i + 1}. ${step.title} ${status}`);
  }

  logger.blank();
  const completed = state.completedSteps.length;
  const total = steps.length;
  logger.info(`Progress: ${completed}/${total} steps completed`);
}

/**
 * Skip to the next step
 */
export async function skipCurrentStep(steps: Step[]): Promise<void> {
  const state = await loadTutorialState();

  if (!state) {
    logger.error('No tutorial in progress. Run `af tutorial` to start.');
    return;
  }

  const currentIndex = findCurrentStepIndex(steps, state.currentStep);

  if (currentIndex < 0) {
    logger.error('Current step not found. Try resetting the tutorial.');
    return;
  }

  if (currentIndex >= steps.length - 1) {
    logger.info('Already at the last step.');
    return;
  }

  const currentStep = steps[currentIndex];
  const nextStep = steps[currentIndex + 1];

  await completeStep(state, currentStep.id, nextStep.id);
  logger.success(`Skipped "${currentStep.title}"`);
  logger.info(`Now at: "${nextStep.title}"`);
}

/**
 * Run the tutorial from current step
 */
export async function runTutorial(steps: Step[]): Promise<void> {
  const state = await getOrCreateTutorialState();
  let ctx = await buildContext(state);

  let currentIndex = findCurrentStepIndex(steps, state.currentStep);

  // If current step not found, start from the beginning
  if (currentIndex < 0) {
    currentIndex = 0;
    state.currentStep = steps[0].id;
    await saveTutorialState(state);
  }

  // Show welcome if resuming
  if (state.completedSteps.length > 0) {
    prompts.section('Resuming Tutorial');
    prompts.info(`You're on step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex].title}`);
    console.log();
    const shouldContinue = await prompts.confirm('Continue from where you left off?');
    if (!shouldContinue) {
      const restart = await prompts.confirm('Start from the beginning?', false);
      if (restart) {
        state.currentStep = steps[0].id;
        state.completedSteps = [];
        state.userResponses = {};
        await saveTutorialState(state);
        currentIndex = 0;
        ctx = await buildContext(state);
      } else {
        logger.info('Tutorial paused. Run `af tutorial` to resume later.');
        return;
      }
    }
  }

  // Run steps sequentially
  while (currentIndex < steps.length) {
    const step = steps[currentIndex];

    prompts.section(`Step ${currentIndex + 1}/${steps.length}: ${step.title}`);

    try {
      const result = await step.run(ctx);

      if (result.status === 'aborted') {
        // Save current position and exit
        await saveTutorialState(ctx.state);
        logger.info('Tutorial paused. Run `af tutorial` to resume.');
        return;
      }

      // Update state with results
      const nextStepId = currentIndex < steps.length - 1 ? steps[currentIndex + 1].id : null;
      ctx.state = await completeStep(ctx.state, step.id, nextStepId, result.responses);

      // Refresh context in case step modified things (like creating codev dir)
      ctx = await buildContext(ctx.state);

      currentIndex++;
    } catch (error) {
      // Handle Ctrl+C gracefully
      if (error instanceof Error && error.message.includes('readline was closed')) {
        console.log();
        await saveTutorialState(ctx.state);
        logger.info('Tutorial paused. Run `af tutorial` to resume.');
        return;
      }
      throw error;
    }
  }

  // Tutorial complete!
  prompts.section('Tutorial Complete!');
  prompts.success('Congratulations! You\'ve completed the Agent Farm tutorial.');
  console.log();
  prompts.content('You now know how to:');
  prompts.bullet('Set up Codev in your project');
  prompts.bullet('Create specifications for new features');
  prompts.bullet('Write implementation plans');
  prompts.bullet('Use the Architect/Builder pattern');
  console.log();
  prompts.content('For more information, check out:');
  prompts.bullet('CLAUDE.md or AGENTS.md in your project');
  prompts.bullet('codev/protocols/ for protocol documentation');
  prompts.bullet('Run `af --help` to see all available commands');
}
