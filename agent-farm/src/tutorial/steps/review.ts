/**
 * Tutorial Step 6: Review & Next Steps
 * Covers the review process and points to further resources
 */

import type { Step, StepContext, StepResult } from '../runner.js';
import * as prompts from '../prompts.js';

export const reviewStep: Step = {
  id: 'review',
  title: 'Review & Next Steps',

  async run(ctx: StepContext): Promise<StepResult> {
    prompts.content('The final step in any project is the review!\n');
    prompts.content('A review documents what you learned and what could be improved.\n');

    prompts.content('Review documents typically include:');
    prompts.bullet('What went well');
    prompts.bullet('What could be improved');
    prompts.bullet('Lessons learned for future work');
    prompts.bullet('Updates to make to protocols or documentation');
    console.log();

    // Annotation viewer
    prompts.content('The Annotation Viewer\n');
    prompts.content('Agent Farm includes an annotation viewer for reviewing code:\n');
    prompts.code(`# Open a file for annotation
af annotate src/path/to/file.ts

# This opens a web viewer where you can:
# - See the code with syntax highlighting
# - Add review comments to specific lines
# - Edit the file directly`);
    console.log();

    prompts.content('Review comments are stored in the files:');
    prompts.code(`// REVIEW(@architect): Consider error handling here
// REVIEW(@builder): Fixed - added try/catch`);
    console.log();

    // Project tracking
    prompts.content('Project Tracking\n');
    prompts.content('Keep track of your projects in codev/projectlist.md:');
    prompts.bullet('Lists all specs with their status');
    prompts.bullet('Shows dependencies between projects');
    prompts.bullet('Tracks what\'s in progress vs completed');
    console.log();

    // Resources
    prompts.content('Where to Learn More\n');
    prompts.bullet('CLAUDE.md / AGENTS.md - Project-specific AI instructions');
    prompts.bullet('codev/protocols/ - Full protocol documentation');
    prompts.bullet('codev/resources/arch.md - Architecture documentation');
    prompts.bullet('`af --help` - All available CLI commands');
    console.log();

    // Quick reference
    prompts.content('Quick Reference:\n');
    prompts.code(`# Essential commands
af start              # Start architect dashboard
af spawn -p 0001      # Spawn builder for spec
af status             # Check agent status
af annotate <file>    # Open annotation viewer
af tutorial --status  # Check tutorial progress
af tutorial --reset   # Reset tutorial

# Workflow
1. Write spec in codev/specs/
2. Create plan in codev/plans/
3. Implement (TICK or Builder)
4. Review and document lessons
5. Update projectlist.md`);
    console.log();

    await prompts.pressEnter();

    // Final message
    prompts.content('\nYou\'ve completed the Agent Farm tutorial!\n');
    prompts.content('Remember:');
    prompts.bullet('Start small - use TICK for simple tasks');
    prompts.bullet('Document as you go - specs and plans save time');
    prompts.bullet('Review your work - lessons learned improve future work');
    prompts.bullet('Use the dashboard - it makes managing builders easier');
    console.log();

    prompts.success('Happy building!');
    console.log();

    return { status: 'completed' };
  },
};
