/**
 * Tutorial Step 4: Planning Phase
 * Shows how to create an implementation plan from a spec
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

function generatePlan(title: string): string {
  return `# Plan: ${title}

## Metadata

- **Spec**: codev/specs/tutorial-example.md
- **Protocol**: TICK
- **Created**: ${new Date().toISOString().split('T')[0]}

## Overview

Implementation approach for "${title}".

## Implementation Steps

### Step 1: [First task]

**Files to modify**:
- \`path/to/file.ts\`

**Changes**:
- [Describe what to do]

### Step 2: [Second task]

**Files to modify**:
- \`path/to/another-file.ts\`

**Changes**:
- [Describe what to do]

### Step 3: Testing

- [ ] Write unit tests
- [ ] Manual testing
- [ ] Update documentation

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to handle it] |

## Testing Checklist

- [ ] Feature works as specified
- [ ] Edge cases handled
- [ ] No regressions

---

*Created via Agent Farm tutorial*
`;
}

export const planningStep: Step = {
  id: 'planning',
  title: 'Create an Implementation Plan',

  async run(ctx: StepContext): Promise<StepResult> {
    prompts.content('Now let\'s create a plan for your spec!\n');
    prompts.content('A plan describes HOW you\'ll implement the spec.');
    prompts.content('It breaks the work into concrete, actionable steps.\n');

    prompts.content('Good plans include:');
    prompts.bullet('Specific files to create or modify');
    prompts.bullet('Step-by-step implementation order');
    prompts.bullet('Testing strategy');
    prompts.bullet('Potential risks and mitigations');
    console.log();

    // Check if spec exists
    const specPath = resolve(ctx.projectPath, 'codev', 'specs', 'tutorial-example.md');
    let specTitle = ctx.state.userResponses.specTitle || 'Tutorial Task';

    if (existsSync(specPath)) {
      try {
        const specContent = await readFile(specPath, 'utf-8');
        const titleMatch = specContent.match(/^#\s+Specification:\s+(.+)$/m);
        if (titleMatch) {
          specTitle = titleMatch[1];
        }
        prompts.success(`Found your spec: "${specTitle}"`);
      } catch {
        // Use default
      }
    } else {
      prompts.info('No spec found at codev/specs/tutorial-example.md');
      prompts.content('We\'ll create an example plan anyway.\n');
    }

    // Explain TICK vs SPIDER
    prompts.content('\nChoosing a Protocol:\n');
    prompts.content('TICK (fast protocol):');
    prompts.bullet('For small, well-defined tasks');
    prompts.bullet('< 300 lines of code');
    prompts.bullet('Straightforward implementation');
    console.log();

    prompts.content('SPIDER (full protocol):');
    prompts.bullet('For complex features');
    prompts.bullet('Multiple phases with reviews');
    prompts.bullet('Multi-agent consultation');
    console.log();

    prompts.info(`For "${specTitle}", TICK is probably the right choice.`);
    console.log();

    // Generate and show plan
    const planContent = generatePlan(specTitle);

    prompts.content('Here\'s a plan template:\n');
    prompts.code(planContent.slice(0, 600) + '...');
    console.log();

    const shouldSave = await prompts.confirm('Save this plan to codev/plans/tutorial-example.md?');

    if (shouldSave) {
      const plansDir = resolve(ctx.projectPath, 'codev', 'plans');
      const planPath = resolve(plansDir, 'tutorial-example.md');

      try {
        if (!existsSync(plansDir)) {
          const { mkdirSync } = await import('node:fs');
          mkdirSync(plansDir, { recursive: true });
        }

        await writeFile(planPath, planContent);
        prompts.success(`Saved to codev/plans/tutorial-example.md`);
      } catch (error) {
        prompts.warn(`Failed to save: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log();
    prompts.content('Multi-Agent Consultation:\n');
    prompts.content('For complex features, SPIDER protocol includes multi-agent review.');
    prompts.content('This means getting input from multiple AI models (e.g., Claude, Gemini, GPT)');
    prompts.content('to catch blind spots and consider alternatives.');
    console.log();

    prompts.info('See codev/protocols/ for details on consultation workflows.');
    console.log();

    await prompts.pressEnter();
    return { status: 'completed' };
  },
};
