/**
 * Rename command - rename a builder or utility terminal
 */

import { renameBuilder, renameUtil } from '../state.js';
import { logger, fatal } from '../utils/logger.js';

interface RenameOptions {
  id: string;
  name: string;
}

/**
 * Rename a builder or utility terminal
 */
export function rename(options: RenameOptions): void {
  const { id, name } = options;

  if (!name.trim()) {
    fatal('Name cannot be empty');
  }

  // Try to rename as builder first
  const oldBuilderName = renameBuilder(id, name);
  if (oldBuilderName !== null) {
    logger.success(`Renamed builder "${id}"`);
    logger.kv('Old name', oldBuilderName);
    logger.kv('New name', name);
    return;
  }

  // Try to rename as util
  const oldUtilName = renameUtil(id, name);
  if (oldUtilName !== null) {
    logger.success(`Renamed utility "${id}"`);
    logger.kv('Old name', oldUtilName);
    logger.kv('New name', name);
    return;
  }

  // Not found
  fatal(`No builder or utility found with ID: ${id}`);
}
