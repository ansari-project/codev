/**
 * Logging utilities for Agent Farm
 */

import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('[info]'), message);
  },

  success(message: string): void {
    console.log(chalk.green('[ok]'), message);
  },

  warn(message: string): void {
    console.log(chalk.yellow('[warn]'), message);
  },

  error(message: string): void {
    console.error(chalk.red('[error]'), message);
  },

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[debug]'), message);
    }
  },

  /**
   * Print a header/title
   */
  header(title: string): void {
    console.log();
    console.log(chalk.bold(title));
    console.log(chalk.gray('─'.repeat(title.length)));
  },

  /**
   * Print a key-value pair
   */
  kv(key: string, value: string | number): void {
    console.log(`  ${chalk.gray(key + ':')} ${value}`);
  },

  /**
   * Print a blank line
   */
  blank(): void {
    console.log();
  },

  /**
   * Print a table row
   */
  row(cols: string[], widths: number[]): void {
    const padded = cols.map((col, i) => col.padEnd(widths[i] || 10));
    console.log('  ' + padded.join('  '));
  },
};

/**
 * Fatal error - logs and exits
 */
export function fatal(message: string): never {
  logger.error(message);
  process.exit(1);
}
