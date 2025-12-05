/**
 * Tutorial Step 3: First Spec Walkthrough
 * Guides user through creating their first specification
 */

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

function generateSpec(title: string, description: string, projectType: string): string {
  const projectContext = projectType === 'nodejs'
    ? 'Node.js/TypeScript'
    : projectType === 'python'
    ? 'Python'
    : 'your project';

  return `# Specification: ${title}

## Overview

${description}

## Goals

1. [Primary goal for this feature]
2. [Secondary goal]
3. [Success criteria]

## Technical Requirements

### Context

This feature will be implemented in a ${projectContext} codebase.

### Implementation Notes

[Add technical details here]

## User Experience

[Describe how users will interact with this feature]

## Success Criteria

- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] Tests pass
- [ ] Documentation updated

## Open Questions

1. [Any decisions that need to be made]
2. [Unknowns to investigate]

---

*Created via Agent Farm tutorial*
`;
}

export const firstSpecStep: Step = {
  id: 'first-spec',
  title: 'Write Your First Spec',

  async run(ctx: StepContext): Promise<StepResult> {
    prompts.content('Now let\'s create your first specification!\n');
    prompts.content('A spec is a document that describes WHAT you want to build.');
    prompts.content('It should be clear enough that anyone (human or AI) can understand the goal.\n');

    prompts.content('Good specs include:');
    prompts.bullet('Clear goals and success criteria');
    prompts.bullet('Technical requirements and constraints');
    prompts.bullet('User experience considerations');
    prompts.bullet('Open questions that need answers');
    console.log();

    // Ask what they want to build
    prompts.content('Think of something small you\'d like to add to your project.');
    prompts.content('Start small! A good first spec might be:');
    prompts.bullet('Add a utility function');
    prompts.bullet('Fix a small bug');
    prompts.bullet('Add a configuration option');
    prompts.bullet('Improve error handling');
    console.log();

    const title = await prompts.prompt('What do you want to build? (short title)');

    if (!title) {
      prompts.info('Using example: "Add logging utility"');
      const exampleTitle = 'Add logging utility';
      const exampleDesc = 'Create a simple logging utility that provides consistent log formatting across the application.';

      prompts.content('\nHere\'s what a basic spec looks like:');
      prompts.code(generateSpec(exampleTitle, exampleDesc, ctx.projectType).slice(0, 500) + '...');
      console.log();

      await prompts.pressEnter();
      return {
        status: 'completed',
        responses: { specTitle: exampleTitle, specSkipped: 'true' },
      };
    }

    const description = await prompts.prompt('Describe it in one sentence');

    // Generate the spec
    const specContent = generateSpec(title, description || `Implement ${title}`, ctx.projectType);

    // Show preview
    prompts.content('\nHere\'s your spec:\n');
    console.log(specContent.slice(0, 800));
    if (specContent.length > 800) {
      console.log('...\n');
    }

    const shouldSave = await prompts.confirm('Save this spec to codev/specs/tutorial-example.md?');

    if (shouldSave) {
      const specsDir = resolve(ctx.projectPath, 'codev', 'specs');
      const specPath = resolve(specsDir, 'tutorial-example.md');

      try {
        // Ensure specs directory exists
        if (!existsSync(specsDir)) {
          const { mkdirSync } = await import('node:fs');
          mkdirSync(specsDir, { recursive: true });
        }

        await writeFile(specPath, specContent);
        prompts.success(`Saved to codev/specs/tutorial-example.md`);
      } catch (error) {
        prompts.warn(`Failed to save: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      prompts.info('Spec not saved. You can create it manually later.');
    }

    console.log();
    prompts.content('Tips for writing good specs:');
    prompts.bullet('Be specific about what success looks like');
    prompts.bullet('Include constraints and non-goals');
    prompts.bullet('List open questions explicitly');
    prompts.bullet('Keep it focused - one feature per spec');
    console.log();

    await prompts.pressEnter();
    return {
      status: 'completed',
      responses: { specTitle: title, specDescription: description },
    };
  },
};
