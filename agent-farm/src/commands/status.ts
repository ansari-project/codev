/**
 * Status command - shows status of all agents
 */

import { loadState } from '../state.js';
import { logger } from '../utils/logger.js';
import { isProcessRunning } from '../utils/shell.js';
import chalk from 'chalk';

/**
 * Display status of all agent farm processes
 */
export async function status(): Promise<void> {
  const state = loadState();

  logger.header('Agent Farm Status');

  // Architect status
  if (state.architect) {
    const running = await isProcessRunning(state.architect.pid);
    const statusText = running ? chalk.green('running') : chalk.red('stopped');
    logger.kv('Architect', `${statusText} (PID: ${state.architect.pid}, port: ${state.architect.port})`);
    logger.kv('  Command', state.architect.cmd);
    logger.kv('  Started', state.architect.startedAt);
  } else {
    logger.kv('Architect', chalk.gray('not running'));
  }

  logger.blank();

  // Builders
  if (state.builders.length > 0) {
    logger.info('Builders:');
    const widths = [12, 20, 10, 12, 10, 6];

    logger.row(['ID', 'Name', 'Type', 'Status', 'Phase', 'Port'], widths);
    logger.row(['──', '────', '────', '──────', '─────', '────'], widths);

    for (const builder of state.builders) {
      const running = await isProcessRunning(builder.pid);
      const statusColor = getStatusColor(builder.status, running);
      const typeColor = getTypeColor(builder.type || 'spec');

      logger.row([
        builder.id,
        builder.name.substring(0, 18),
        typeColor(builder.type || 'spec'),
        statusColor(builder.status),
        builder.phase.substring(0, 8),
        String(builder.port),
      ], widths);
    }
  } else {
    logger.info('Builders: none');
  }

  logger.blank();

  // Utils
  if (state.utils.length > 0) {
    logger.info('Utility Terminals:');
    const widths = [8, 20, 8];

    logger.row(['ID', 'Name', 'Port'], widths);
    logger.row(['──', '────', '────'], widths);

    for (const util of state.utils) {
      const running = await isProcessRunning(util.pid);
      const name = running ? util.name : chalk.gray(util.name + ' (stopped)');

      logger.row([
        util.id,
        name.substring(0, 18),
        String(util.port),
      ], widths);
    }
  } else {
    logger.info('Utility Terminals: none');
  }

  logger.blank();

  // Annotations
  if (state.annotations.length > 0) {
    logger.info('Annotations:');
    const widths = [8, 30, 8];

    logger.row(['ID', 'File', 'Port'], widths);
    logger.row(['──', '────', '────'], widths);

    for (const annotation of state.annotations) {
      const running = await isProcessRunning(annotation.pid);
      const file = running ? annotation.file : chalk.gray(annotation.file + ' (stopped)');

      logger.row([
        annotation.id,
        file.substring(0, 28),
        String(annotation.port),
      ], widths);
    }
  } else {
    logger.info('Annotations: none');
  }
}

function getStatusColor(status: string, running: boolean): (text: string) => string {
  if (!running) {
    return chalk.gray;
  }

  switch (status) {
    case 'implementing':
      return chalk.blue;
    case 'blocked':
      return chalk.yellow;
    case 'pr-ready':
      return chalk.green;
    case 'complete':
      return chalk.green;
    default:
      return chalk.white;
  }
}

function getTypeColor(type: string): (text: string) => string {
  switch (type) {
    case 'spec':
      return chalk.cyan;
    case 'task':
      return chalk.magenta;
    case 'protocol':
      return chalk.yellow;
    case 'worktree':
      return chalk.blue;
    case 'shell':
      return chalk.gray;
    default:
      return chalk.white;
  }
}
