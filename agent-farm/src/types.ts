/**
 * Core types for Agent Farm
 */

export type BuilderType = 'spec' | 'task' | 'protocol' | 'shell' | 'worktree';

export interface Builder {
  id: string;
  name: string;
  port: number;
  pid: number;
  status: 'spawning' | 'implementing' | 'blocked' | 'pr-ready' | 'complete';
  phase: string;
  worktree: string;
  branch: string;
  tmuxSession?: string;
  type: BuilderType;
  taskText?: string;      // For task mode (display in dashboard)
  protocolName?: string;  // For protocol mode
}

export interface UtilTerminal {
  id: string;
  name: string;
  port: number;
  pid: number;
  tmuxSession?: string;
}

export interface Annotation {
  id: string;
  file: string;
  port: number;
  pid: number;
  parent: {
    type: 'architect' | 'builder' | 'util';
    id?: string;
  };
}

export interface ArchitectState {
  port: number;
  pid: number;
  cmd: string;
  startedAt: string;
  tmuxSession?: string;
}

export interface DashboardState {
  architect: ArchitectState | null;
  builders: Builder[];
  utils: UtilTerminal[];
  annotations: Annotation[];
}

export interface Config {
  projectRoot: string;
  codevDir: string;
  buildersDir: string;
  stateDir: string;
  templatesDir: string;
  serversDir: string;
  bundledRolesDir: string;
  dashboardPort: number;
  architectPort: number;
  builderPortRange: [number, number];
  utilPortRange: [number, number];
  annotatePortRange: [number, number];
}

// Session tracking for tmux
export interface TmuxSession {
  name: string;
  pid: number;
}

export interface StartOptions {
  cmd?: string;
  port?: number;
  noRole?: boolean;
}

export interface SpawnOptions {
  // Mode flags (mutually exclusive)
  project?: string;     // Spec-based mode: --project / -p
  task?: string;        // Task mode: --task
  protocol?: string;    // Protocol mode: --protocol
  shell?: boolean;      // Shell mode: --shell (no worktree, no prompt)
  worktree?: boolean;   // Worktree mode: --worktree (worktree, no prompt)

  // Task mode options
  files?: string[];     // Context files for task mode: --files

  // General options
  noRole?: boolean;
  instruction?: string;
}

export interface SendOptions {
  builder?: string;     // Builder ID (required unless --all)
  message?: string;     // Message to send
  all?: boolean;        // Send to all builders
  file?: string;        // File to include in message
  interrupt?: boolean;  // Send Ctrl+C first to ensure prompt is ready
  raw?: boolean;        // Skip structured formatting
  noEnter?: boolean;    // Don't send Enter after message
}

/**
 * User-facing config.json structure
 */
export interface UserConfig {
  shell?: {
    architect?: string | string[];
    builder?: string | string[];
    shell?: string | string[];
  };
  templates?: {
    dir?: string;
  };
  roles?: {
    dir?: string;
  };
}

/**
 * Resolved shell commands (after processing config hierarchy)
 */
export interface ResolvedCommands {
  architect: string;
  builder: string;
  shell: string;
}

/**
 * Tutorial state for interactive onboarding
 */
export interface TutorialState {
  projectPath: string;
  currentStep: string;
  completedSteps: string[];
  userResponses: Record<string, string>;
  startedAt: string;
  lastActiveAt: string;
}

export interface TutorialOptions {
  reset?: boolean;
  skip?: boolean;
  status?: boolean;
}
