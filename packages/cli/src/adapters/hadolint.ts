/**
 * Hadolint adapter — Dockerfile linter. Auto-applicable only when at least
 * one Dockerfile exists in the project.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { OwaspFinding, AdapterRunResult, Severity } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';

const HADOLINT_SEVERITY: Record<string, Severity> = {
  error: 'high',
  warning: 'medium',
  info: 'low',
  style: 'info',
};

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'target', 'vendor']);

function findDockerfiles(root: string, maxDepth = 4): string[] {
  const found: string[] = [];
  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) walk(p, depth + 1);
      } else if (/^Dockerfile(\..+)?$/i.test(e.name)) {
        try {
          if (statSync(p).size < 200_000) found.push(p);
        } catch { /* ignore */ }
      }
    }
  }
  walk(root, 0);
  return found;
}

interface HadolintFinding {
  file?: string;
  line: number;
  column?: number;
  level: string;
  code: string;
  message: string;
}

export const hadolintAdapter: ScannerAdapter = {
  id: 'hadolint',
  name: 'Hadolint',
  category: 'container',
  description: 'Dockerfile linter for best-practice and security issues.',
  homepage: 'https://github.com/hadolint/hadolint',

  async applicable(project) {
    return findDockerfiles(project.root).length > 0;
  },

  async available() {
    if (!(await which('hadolint'))) {
      return { ok: false, hint: 'Install: brew install hadolint  (or)  https://github.com/hadolint/hadolint/releases' };
    }
    const r = await exec('hadolint', ['--version'], { timeoutMs: 5000 });
    return { ok: r.code === 0, version: r.stdout.trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'hadolint', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const dockerfiles = findDockerfiles(project.root);
    if (dockerfiles.length === 0) {
      return { tool: 'hadolint', ok: true, durationMs: 0, findings: [], skipped: true, skipReason: 'no Dockerfile found' };
    }

    const findings: OwaspFinding[] = [];
    for (const df of dockerfiles) {
      const r = await exec('hadolint', ['-f', 'json', df], { timeoutMs: 60_000 });
      // Hadolint exits 1 when issues exist.
      if (r.code !== 0 && r.code !== 1) continue;
      let raw: HadolintFinding[] = [];
      try { raw = JSON.parse(r.stdout); } catch { /* skip */ }
      const rel = relative(project.root, df);
      for (const f of raw) {
        findings.push({
          id: f.code,
          sourceTool: 'hadolint',
          category: 'container',
          title: `${f.code}: ${f.message}`,
          description: f.message,
          severity: HADOLINT_SEVERITY[f.level] ?? 'low',
          confidence: 'high',
          file: rel,
          line: f.line,
          column: f.column,
          remediation: `See https://github.com/hadolint/hadolint/wiki/${f.code}`,
          references: [`https://github.com/hadolint/hadolint/wiki/${f.code}`],
          fingerprint: '',
        });
      }
    }

    return {
      tool: 'hadolint',
      ok: true,
      durationMs: performance.now() - t0,
      findings,
      diagnostics: { version: avail.version, dockerfiles: dockerfiles.length },
    };
  },
};
