/**
 * Core types for Agent Farm
 */

export interface Builder {
  id: string;
  name: string;
  port: number;
  pid: number;
  status: 'spawning' | 'implementing' | 'blocked' | 'pr-ready' | 'complete';
  phase: string;
  worktree: string;
  branch: string;
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
  project: string;
  noRole?: boolean;
}
