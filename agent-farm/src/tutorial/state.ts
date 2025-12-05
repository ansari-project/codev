/**
 * Tutorial state management
 * Persists tutorial progress to disk
 */

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { TutorialState } from '../types.js';
import { getConfig, ensureDirectories } from '../utils/index.js';

const TUTORIAL_STATE_FILE = 'tutorial.json';

function getTutorialStatePath(): string {
  const config = getConfig();
  return resolve(config.stateDir, TUTORIAL_STATE_FILE);
}

function getDefaultTutorialState(): TutorialState {
  const config = getConfig();
  return {
    projectPath: config.projectRoot,
    currentStep: 'welcome',
    completedSteps: [],
    userResponses: {},
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Load tutorial state from disk
 */
export async function loadTutorialState(): Promise<TutorialState | null> {
  const statePath = getTutorialStatePath();

  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as TutorialState;
  } catch {
    return null;
  }
}

/**
 * Save tutorial state to disk
 */
export async function saveTutorialState(state: TutorialState): Promise<void> {
  const config = getConfig();
  await ensureDirectories(config);

  // Update lastActiveAt on every save
  state.lastActiveAt = new Date().toISOString();

  const statePath = getTutorialStatePath();
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * Reset tutorial state (delete the file)
 */
export async function resetTutorialState(): Promise<void> {
  const statePath = getTutorialStatePath();

  if (existsSync(statePath)) {
    await unlink(statePath);
  }
}

/**
 * Get or create tutorial state
 */
export async function getOrCreateTutorialState(): Promise<TutorialState> {
  const existing = await loadTutorialState();
  if (existing) {
    return existing;
  }

  const newState = getDefaultTutorialState();
  await saveTutorialState(newState);
  return newState;
}

/**
 * Mark a step as completed and advance to the next step
 */
export async function completeStep(
  state: TutorialState,
  stepId: string,
  nextStepId: string | null,
  responses?: Record<string, string>
): Promise<TutorialState> {
  if (!state.completedSteps.includes(stepId)) {
    state.completedSteps.push(stepId);
  }

  if (nextStepId) {
    state.currentStep = nextStepId;
  }

  if (responses) {
    state.userResponses = { ...state.userResponses, ...responses };
  }

  await saveTutorialState(state);
  return state;
}
