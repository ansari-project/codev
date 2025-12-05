/**
 * Simple prompt utilities for the tutorial
 * Uses readline for interactive input
 */

import * as readline from 'node:readline';
import chalk from 'chalk';

/**
 * Create readline interface for prompts
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a yes/no confirmation question
 */
export async function confirm(message: string, defaultValue = true): Promise<boolean> {
  const rl = createInterface();
  const hint = defaultValue ? '[Y/n]' : '[y/N]';

  return new Promise((resolve) => {
    rl.question(`${message} ${chalk.gray(hint)} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultValue);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * Ask for free-form text input
 */
export async function prompt(message: string, defaultValue?: string): Promise<string> {
  const rl = createInterface();
  const hint = defaultValue ? chalk.gray(` [${defaultValue}]`) : '';

  return new Promise((resolve) => {
    rl.question(`${message}${hint}: `, (answer) => {
      rl.close();
      const value = answer.trim();
      resolve(value || defaultValue || '');
    });
  });
}

/**
 * Ask user to select from a list of options
 */
export async function select(message: string, options: string[]): Promise<string> {
  const rl = createInterface();

  console.log(message);
  options.forEach((opt, i) => {
    console.log(`  ${chalk.cyan(`${i + 1}.`)} ${opt}`);
  });

  return new Promise((resolve) => {
    rl.question(chalk.gray('Enter number: '), (answer) => {
      rl.close();
      const index = parseInt(answer.trim(), 10) - 1;
      if (index >= 0 && index < options.length) {
        resolve(options[index]);
      } else {
        // Default to first option on invalid input
        resolve(options[0]);
      }
    });
  });
}

/**
 * Wait for user to press Enter to continue
 */
export async function pressEnter(message = 'Press Enter to continue...'): Promise<void> {
  const rl = createInterface();

  return new Promise((resolve) => {
    rl.question(chalk.gray(message), () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Print a section header
 */
export function section(title: string): void {
  console.log();
  console.log(chalk.bold.cyan('━'.repeat(50)));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan('━'.repeat(50)));
  console.log();
}

/**
 * Print content text (with proper wrapping)
 */
export function content(text: string): void {
  console.log(text);
}

/**
 * Print a bullet point
 */
export function bullet(text: string): void {
  console.log(`  ${chalk.gray('•')} ${text}`);
}

/**
 * Print a numbered step
 */
export function step(num: number, text: string): void {
  console.log(`  ${chalk.cyan(`${num}.`)} ${text}`);
}

/**
 * Print highlighted text (e.g., for commands)
 */
export function highlight(text: string): void {
  console.log(chalk.yellow(`  ${text}`));
}

/**
 * Print a success message
 */
export function success(text: string): void {
  console.log(chalk.green(`  ✓ ${text}`));
}

/**
 * Print a warning message
 */
export function warn(text: string): void {
  console.log(chalk.yellow(`  ⚠ ${text}`));
}

/**
 * Print an info message
 */
export function info(text: string): void {
  console.log(chalk.blue(`  ℹ ${text}`));
}

/**
 * Print a code block
 */
export function code(text: string): void {
  const lines = text.split('\n');
  console.log(chalk.gray('  ┌' + '─'.repeat(48)));
  for (const line of lines) {
    console.log(chalk.gray('  │ ') + chalk.white(line));
  }
  console.log(chalk.gray('  └' + '─'.repeat(48)));
}
