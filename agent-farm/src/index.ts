#!/usr/bin/env node

/**
 * Agent Farm CLI
 * A multi-agent orchestration tool for software development
 */

import { Command } from 'commander';
import { start, stop } from './commands/index.js';
import { logger } from './utils/logger.js';

const program = new Command();

program
  .name('agent-farm')
  .description('Multi-agent orchestration for software development')
  .version('0.1.0');

// Start command
program
  .command('start')
  .description('Start the architect dashboard')
  .option('-c, --cmd <command>', 'Command to run in architect terminal', 'claude')
  .option('-p, --port <port>', 'Port for architect terminal', '7680')
  .action(async (options) => {
    try {
      await start({
        cmd: options.cmd,
        port: parseInt(options.port, 10),
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop all agent farm processes')
  .action(async () => {
    try {
      await stop();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Status command (placeholder)
program
  .command('status')
  .description('Show status of all agents')
  .action(async () => {
    const { status } = await import('./commands/status.js');
    try {
      await status();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Spawn command (placeholder)
program
  .command('spawn')
  .description('Spawn a new builder for a project')
  .requiredOption('-p, --project <id>', 'Project/spec ID to work on')
  .action(async (options) => {
    const { spawn } = await import('./commands/spawn.js');
    try {
      await spawn({ project: options.project });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Util/Shell command - spawns a utility terminal
program
  .command('util')
  .alias('shell')
  .description('Spawn a utility shell terminal')
  .option('-n, --name <name>', 'Name for the shell terminal')
  .action(async (options) => {
    const { util } = await import('./commands/util.js');
    try {
      await util({ name: options.name });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Annotate command (placeholder)
program
  .command('annotate <file>')
  .description('Open file annotation viewer')
  .action(async (file) => {
    const { annotate } = await import('./commands/annotate.js');
    try {
      await annotate({ file });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
