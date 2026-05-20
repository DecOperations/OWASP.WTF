/**
 * Gitleaks adapter — secrets detection via `gitleaks detect --no-git`.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { OwaspFinding, AdapterRunResult } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';

interface GitleaksFinding {
  Description: string;
  StartLine: number;
  StartColumn?: number;
  EndLine?: number;
  Match: string;
  Secret: string;
  File: string;
  RuleID: string;
  Tags?: string[];
}

export const gitleaksAdapter: ScannerAdapter = {
  id: 'gitleaks',
  name: 'Gitleaks',
  category: 'secrets',
  description: 'Detects committed secrets, API keys, tokens, and passwords.',
  homepage: 'https://github.com/gitleaks/gitleaks',

  async applicable() {
    return true;
  },

  async available() {
    if (!(await which('gitleaks'))) {
      return { ok: false, hint: 'Install: brew install gitleaks  (or)  https://github.com/gitleaks/gitleaks/releases' };
    }
    const r = await exec('gitleaks', ['version'], { timeoutMs: 5000 });
    return { ok: r.code === 0, version: r.stdout.trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'gitleaks', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const tmp = mkdtempSync(join(tmpdir(), 'owasp-wtf-gitleaks-'));
    const reportPath = join(tmp, 'report.json');
    try {
      const r = await exec(
        'gitleaks',
        ['detect', '--no-banner', '--no-git', '--source', project.root, '--report-format', 'json', '--report-path', reportPath, '--exit-code', '0'],
        { timeoutMs: 5 * 60_000 },
      );

      if (r.code !== 0) {
        return {
          tool: 'gitleaks',
          ok: false,
          durationMs: performance.now() - t0,
          findings: [],
          error: r.stderr.slice(0, 500) || `gitleaks exit ${r.code}`,
        };
      }

      let raw: GitleaksFinding[] = [];
      try {
        raw = JSON.parse(readFileSync(reportPath, 'utf-8'));
      } catch {
        // empty report or missing file — no findings
      }

      const findings: OwaspFinding[] = raw.map((g) => ({
        id: g.RuleID,
        sourceTool: 'gitleaks',
        category: 'secrets',
        title: `Hardcoded secret: ${g.Description}`,
        description: `Gitleaks rule ${g.RuleID} matched a likely secret in ${g.File}.`,
        severity: 'high',
        confidence: 'high',
        cwe: ['CWE-798'],
        file: g.File,
        line: g.StartLine,
        column: g.StartColumn,
        endLine: g.EndLine,
        evidence: redact(g.Match, g.Secret),
        remediation:
          'Remove the secret from source, rotate the credential immediately, and load it from an environment variable or secret manager. Purge from Git history if previously committed.',
        references: [
          'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
          'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
        ],
        fingerprint: '',
      }));

      return {
        tool: 'gitleaks',
        ok: true,
        durationMs: performance.now() - t0,
        findings,
        diagnostics: { version: avail.version },
      };
    } finally {
      try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  },
};

function redact(match: string, secret: string): string {
  if (!secret) return match;
  const visible = Math.min(4, Math.floor(secret.length / 4));
  const redacted = secret.slice(0, visible) + '*'.repeat(Math.max(4, secret.length - visible));
  return match.replace(secret, redacted);
}
