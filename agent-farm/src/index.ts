#!/usr/bin/env node

/**
 * Agent Farm CLI
 * A multi-agent orchestration tool for software development
 */

import { Command } from 'commander';
import { start, stop } from './commands/index.js';
import { logger } from './utils/logger.js';
import { getConfig, setCliOverrides, getResolvedCommands, initializePorts } from './utils/config.js';

const program = new Command();

program
  .name('agent-farm')
  .description('Multi-agent orchestration for software development')
  .version('0.1.0');

// Global options for command overrides
program
  .option('--architect-cmd <command>', 'Override architect command (takes precedence over config.json)')
  .option('--builder-cmd <command>', 'Override builder command (takes precedence over config.json)')
  .option('--shell-cmd <command>', 'Override shell command (takes precedence over config.json)');

// Process global options before commands
program.hook('preAction', async (thisCommand) => {
  const opts = thisCommand.opts();
  const overrides: Record<string, string> = {};

  if (opts.architectCmd) overrides.architect = opts.architectCmd;
  if (opts.builderCmd) overrides.builder = opts.builderCmd;
  if (opts.shellCmd) overrides.shell = opts.shellCmd;

  if (Object.keys(overrides).length > 0) {
    setCliOverrides(overrides);
  }

  // Initialize port allocation for this project
  await initializePorts();
});

// Start command
program
  .command('start')
  .description('Start the architect dashboard')
  .option('-c, --cmd <command>', 'Command to run in architect terminal (shorthand for --architect-cmd)')
  .option('-p, --port <port>', 'Port for architect terminal')
  .option('--no-role', 'Skip loading architect role prompt')
  .action(async (options) => {
    try {
      // -c flag overrides config if provided (for backward compatibility)
      const commands = getResolvedCommands();
      await start({
        cmd: options.cmd || commands.architect,
        port: options.port ? parseInt(options.port, 10) : undefined,
        noRole: !options.role,
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

// Spawn command
program
  .command('spawn')
  .description('Spawn a new builder in various modes')
  .option('-p, --project <id>', 'Spawn builder for a spec (e.g., -p 0009)')
  .option('--task <text>', 'Spawn builder with a task description')
  .option('--protocol <name>', 'Spawn builder to run a protocol (e.g., cleanup)')
  .option('--shell', 'Spawn a bare Claude session (no prompt, no worktree)')
  .option('--worktree', 'Spawn worktree session (worktree+branch, no prompt)')
  .option('--files <files>', 'Context files for task mode (comma-separated)')
  .option('--no-role', 'Skip loading role prompt')
  .addHelpText('after', `
Examples:
  # Spec mode (existing behavior)
  af spawn -p 0009                              # Spawn for spec 0009

  # Task mode (ad-hoc tasks)
  af spawn --task "Fix the login bug"           # Simple task
  af spawn --task "Refactor auth" --files src/auth.ts,src/login.ts

  # Protocol mode (run a protocol)
  af spawn --protocol cleanup                   # Run cleanup protocol
  af spawn --protocol experiment                # Run experiment protocol

  # Worktree mode (isolated branch, no prompt)
  af spawn --worktree                           # Worktree for quick fixes

  # Shell mode (bare session)
  af spawn --shell                              # Just Claude, no prompt/worktree
`)
  .action(async (options) => {
    const { spawn } = await import('./commands/spawn.js');
    try {
      const files = options.files ? options.files.split(',').map((f: string) => f.trim()) : undefined;
      await spawn({
        project: options.project,
        task: options.task,
        protocol: options.protocol,
        shell: options.shell,
        worktree: options.worktree,
        files,
        noRole: !options.role,
      });
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

// Cleanup command - remove builder worktree and branch
program
  .command('cleanup')
  .description('Clean up a builder worktree and branch after PR merge')
  .requiredOption('-p, --project <id>', 'Builder ID to clean up')
  .option('-f, --force', 'Force cleanup even if branch not merged')
  .action(async (options) => {
    const { cleanup } = await import('./commands/cleanup.js');
    try {
      await cleanup({ project: options.project, force: options.force });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Send command - send instructions to running builders
program
  .command('send [builder] [message]')
  .description('Send instructions to a running builder')
  .option('--all', 'Send to all builders')
  .option('--file <path>', 'Include file content in message')
  .option('--interrupt', 'Send Ctrl+C first to interrupt current activity')
  .option('--raw', 'Skip structured message formatting')
  .option('--no-enter', 'Do not send Enter after message')
  .action(async (builder, message, options) => {
    const { send } = await import('./commands/send.js');
    try {
      await send({
        builder,
        message,
        all: options.all,
        file: options.file,
        interrupt: options.interrupt,
        raw: options.raw,
        noEnter: !options.enter,
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Ports command - manage global port registry
const portsCmd = program
  .command('ports')
  .description('Manage global port registry');

portsCmd
  .command('list')
  .description('List all port allocations')
  .action(async () => {
    const { listAllocations } = await import('./utils/port-registry.js');
    const allocations = listAllocations();

    if (allocations.length === 0) {
      logger.info('No port allocations found.');
      return;
    }

    logger.header('Port Allocations');
    for (const alloc of allocations) {
      const status = alloc.exists ? '' : ' (missing)';
      logger.info(`${alloc.basePort}-${alloc.basePort + 99}: ${alloc.path}${status}`);
    }
  });

portsCmd
  .command('cleanup')
  .description('Remove stale port allocations (deleted projects)')
  .action(async () => {
    const { cleanupStaleEntries } = await import('./utils/port-registry.js');
    const result = await cleanupStaleEntries();

    if (result.removed.length === 0) {
      logger.info('No stale entries found.');
    } else {
      logger.success(`Removed ${result.removed.length} stale entries:`);
      for (const path of result.removed) {
        logger.info(`  - ${path}`);
      }
    }
    logger.info(`Remaining allocations: ${result.remaining}`);
  });

program.parse();
