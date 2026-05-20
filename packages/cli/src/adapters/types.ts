import type { AdapterRunResult, SourceTool, Category } from '../core/types.js';

export interface ProjectContext {
  root: string;
  /** User-supplied ignore patterns. */
  ignore: string[];
  /** When true, prefer Docker-image execution where supported. */
  preferDocker?: boolean;
}

export interface ScannerAdapter {
  id: SourceTool;
  name: string;
  category: Category;
  /** Short blurb shown in `doctor` / report metadata. */
  description: string;
  /** Where to learn more / install instructions. */
  homepage: string;

  /** Decide whether this adapter is applicable to this project. */
  applicable(project: ProjectContext): Promise<boolean>;

  /** Check whether the underlying tool is installed and usable. */
  available(): Promise<{ ok: boolean; version?: string; hint?: string }>;

  /** Run the adapter and return normalized findings. */
  run(project: ProjectContext): Promise<AdapterRunResult>;
}
