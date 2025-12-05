/**
 * Tutorial command handler
 * Interactive onboarding for new users
 */

import type { TutorialOptions } from '../types.js';
import { logger } from '../utils/logger.js';
import { resetTutorialState } from '../tutorial/state.js';
import { runTutorial, showStatus, skipCurrentStep, type Step } from '../tutorial/runner.js';

// Import all tutorial steps
import { welcomeStep } from '../tutorial/steps/welcome.js';
import { setupStep } from '../tutorial/steps/setup.js';
import { firstSpecStep } from '../tutorial/steps/first-spec.js';
import { planningStep } from '../tutorial/steps/planning.js';
import { implementationStep } from '../tutorial/steps/implementation.js';
import { reviewStep } from '../tutorial/steps/review.js';

/**
 * All tutorial steps in order
 */
const TUTORIAL_STEPS: Step[] = [
  welcomeStep,
  setupStep,
  firstSpecStep,
  planningStep,
  implementationStep,
  reviewStep,
];

/**
 * Main tutorial command
 */
export async function tutorial(options: TutorialOptions): Promise<void> {
  // Handle --reset flag
  if (options.reset) {
    await resetTutorialState();
    logger.success('Tutorial progress reset. Run `af tutorial` to start fresh.');
    return;
  }

  // Handle --status flag
  if (options.status) {
    await showStatus(TUTORIAL_STEPS);
    return;
  }

  // Handle --skip flag
  if (options.skip) {
    await skipCurrentStep(TUTORIAL_STEPS);
    return;
  }

  // Default: run the tutorial
  await runTutorial(TUTORIAL_STEPS);
}
