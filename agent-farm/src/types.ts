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
  architectPort: number;
  builderPortRange: [number, number];
  utilPortRange: [number, number];
  annotatePortRange: [number, number];
}

export interface StartOptions {
  cmd?: string;
  port?: number;
}

export interface SpawnOptions {
  project: string;
}
