/**
 * Stop command - stops all agent farm processes
 */

import { loadState, clearState } from '../state.js';
import { logger } from '../utils/logger.js';
import { killProcess, isProcessRunning } from '../utils/shell.js';

/**
 * Stop all agent farm processes
 */
export async function stop(): Promise<void> {
  const state = loadState();

  logger.header('Stopping Agent Farm');

  let stopped = 0;

  // Stop architect
  if (state.architect) {
    logger.info(`Stopping architect (PID: ${state.architect.pid})`);
    try {
      if (await isProcessRunning(state.architect.pid)) {
        await killProcess(state.architect.pid);
        stopped++;
      }
    } catch (error) {
      logger.warn(`Failed to stop architect: ${error}`);
    }
  }

  // Stop all builders
  for (const builder of state.builders) {
    logger.info(`Stopping builder ${builder.id} (PID: ${builder.pid})`);
    try {
      if (await isProcessRunning(builder.pid)) {
        await killProcess(builder.pid);
        stopped++;
      }
    } catch (error) {
      logger.warn(`Failed to stop builder ${builder.id}: ${error}`);
    }
  }

  // Stop all utils
  for (const util of state.utils) {
    logger.info(`Stopping util ${util.id} (PID: ${util.pid})`);
    try {
      if (await isProcessRunning(util.pid)) {
        await killProcess(util.pid);
        stopped++;
      }
    } catch (error) {
      logger.warn(`Failed to stop util ${util.id}: ${error}`);
    }
  }

  // Stop all annotations
  for (const annotation of state.annotations) {
    logger.info(`Stopping annotation ${annotation.id} (PID: ${annotation.pid})`);
    try {
      if (await isProcessRunning(annotation.pid)) {
        await killProcess(annotation.pid);
        stopped++;
      }
    } catch (error) {
      logger.warn(`Failed to stop annotation ${annotation.id}: ${error}`);
    }
  }

  // Clear state
  clearState();

  logger.blank();
  if (stopped > 0) {
    logger.success(`Stopped ${stopped} process(es)`);
  } else {
    logger.info('No processes were running');
  }
}
