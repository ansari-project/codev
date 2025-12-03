/**
 * State management for Agent Farm
 * Persists dashboard state to disk
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DashboardState, ArchitectState, Builder, UtilTerminal, Annotation } from './types.js';
import { getConfig, ensureDirectories } from './utils/index.js';

const STATE_FILE = 'state.json';

function getStatePath(): string {
  const config = getConfig();
  return resolve(config.stateDir, STATE_FILE);
}

function getDefaultState(): DashboardState {
  return {
    architect: null,
    builders: [],
    utils: [],
    annotations: [],
  };
}

/**
 * Load state from disk
 */
export async function loadState(): Promise<DashboardState> {
  const statePath = getStatePath();

  if (!existsSync(statePath)) {
    return getDefaultState();
  }

  try {
    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as DashboardState;
  } catch {
    return getDefaultState();
  }
}

/**
 * Save state to disk
 */
export async function saveState(state: DashboardState): Promise<void> {
  const config = getConfig();
  await ensureDirectories(config);

  const statePath = getStatePath();
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

/**
 * Update architect state
 */
export async function setArchitect(architect: ArchitectState | null): Promise<void> {
  const state = await loadState();
  state.architect = architect;
  await saveState(state);
}

/**
 * Add or update a builder
 */
export async function upsertBuilder(builder: Builder): Promise<void> {
  const state = await loadState();
  const index = state.builders.findIndex((b) => b.id === builder.id);

  if (index >= 0) {
    state.builders[index] = builder;
  } else {
    state.builders.push(builder);
  }

  await saveState(state);
}

/**
 * Remove a builder
 */
export async function removeBuilder(id: string): Promise<void> {
  const state = await loadState();
  state.builders = state.builders.filter((b) => b.id !== id);
  await saveState(state);
}

/**
 * Add a utility terminal
 */
export async function addUtil(util: UtilTerminal): Promise<void> {
  const state = await loadState();
  state.utils.push(util);
  await saveState(state);
}

/**
 * Remove a utility terminal
 */
export async function removeUtil(id: string): Promise<void> {
  const state = await loadState();
  state.utils = state.utils.filter((u) => u.id !== id);
  await saveState(state);
}

/**
 * Add an annotation
 */
export async function addAnnotation(annotation: Annotation): Promise<void> {
  const state = await loadState();
  state.annotations.push(annotation);
  await saveState(state);
}

/**
 * Remove an annotation
 */
export async function removeAnnotation(id: string): Promise<void> {
  const state = await loadState();
  state.annotations = state.annotations.filter((a) => a.id !== id);
  await saveState(state);
}

/**
 * Clear all state
 */
export async function clearState(): Promise<void> {
  await saveState(getDefaultState());
}
