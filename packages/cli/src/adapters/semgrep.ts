/**
 * Semgrep adapter — runs `semgrep scan` with the OWASP Top 10 ruleset and
 * normalizes its JSON output into OwaspFinding.
 */

import type { OwaspFinding, AdapterRunResult, Severity } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';

const SEMGREP_SEVERITY: Record<string, Severity> = {
  ERROR: 'high',
  WARNING: 'medium',
  INFO: 'low',
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

interface SemgrepResult {
  results?: Array<{
    check_id: string;
    path: string;
    start: { line: number; col?: number };
    end?: { line: number };
    extra: {
      message: string;
      severity: string;
      lines?: string;
      metadata?: {
        cwe?: string | string[];
        owasp?: string | string[];
        references?: string[];
        confidence?: string;
      };
      fix?: string;
    };
  }>;
}

export const semgrepAdapter: ScannerAdapter = {
  id: 'semgrep',
  name: 'Semgrep',
  category: 'sast',
  description: 'Fast open-source SAST. Runs the p/owasp-top-ten ruleset.',
  homepage: 'https://semgrep.dev',

  async applicable() {
    return true;
  },

  async available() {
    if (!(await which('semgrep'))) {
      return { ok: false, hint: 'Install: pipx install semgrep  (or)  brew install semgrep' };
    }
    const r = await exec('semgrep', ['--version'], { timeoutMs: 10_000 });
    return { ok: r.code === 0, version: r.stdout.trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'semgrep', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const r = await exec(
      'semgrep',
      ['scan', '--config', 'p/owasp-top-ten', '--json', '--quiet', '--error', '--metrics=off', '--disable-version-check'],
      { cwd: project.root, timeoutMs: 5 * 60_000 },
    );

    // Semgrep exits 1 when findings exist — that's not an error.
    if (r.code !== 0 && r.code !== 1) {
      return {
        tool: 'semgrep',
        ok: false,
        durationMs: performance.now() - t0,
        findings: [],
        error: r.stderr.slice(0, 500) || `semgrep exit ${r.code}`,
      };
    }

    let parsed: SemgrepResult = {};
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      // fall through with empty results
    }

    const findings: OwaspFinding[] = (parsed.results ?? []).map((res) => {
      const sev =
        SEMGREP_SEVERITY[res.extra.severity?.toUpperCase()] ?? 'medium';
      const cwe = arrify(res.extra.metadata?.cwe).map(normalizeCwe);
      const confidence =
        (res.extra.metadata?.confidence?.toLowerCase() as 'low' | 'medium' | 'high') ?? 'medium';
      return {
        id: res.check_id,
        sourceTool: 'semgrep',
        category: 'sast',
        title: res.check_id.split('.').pop() ?? res.check_id,
        description: res.extra.message,
        severity: sev,
        confidence,
        cwe,
        file: res.path,
        line: res.start.line,
        column: res.start.col,
        endLine: res.end?.line,
        evidence: res.extra.lines,
        remediation: res.extra.fix ?? 'See Semgrep rule documentation for remediation guidance.',
        references: res.extra.metadata?.references ?? [
          `https://semgrep.dev/r/${encodeURIComponent(res.check_id)}`,
        ],
        fingerprint: '',
      };
    });

    return {
      tool: 'semgrep',
      ok: true,
      durationMs: performance.now() - t0,
      findings,
      diagnostics: { version: avail.version, exit: r.code },
    };
  },
};

function arrify(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeCwe(s: string): string {
  const m = s.match(/CWE[-\s]?(\d+)/i);
  return m ? `CWE-${m[1]}` : s;
}
