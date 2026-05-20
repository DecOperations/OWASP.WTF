/**
 * Trivy adapter — filesystem scan covering dependencies, misconfigurations,
 * and secrets. We deliberately let Gitleaks own the secrets surface, so
 * Trivy is configured with the vuln + misconfig scanners only.
 */

import type { OwaspFinding, AdapterRunResult, Severity, Category } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';

const TRIVY_SEVERITY: Record<string, Severity> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNKNOWN: 'info',
};

interface TrivyJson {
  Results?: Array<{
    Target: string;
    Class?: string;
    Type?: string;
    Vulnerabilities?: Array<{
      VulnerabilityID: string;
      PkgName: string;
      InstalledVersion?: string;
      FixedVersion?: string;
      Title?: string;
      Description?: string;
      Severity?: string;
      CweIDs?: string[];
      References?: string[];
      PrimaryURL?: string;
    }>;
    Misconfigurations?: Array<{
      ID: string;
      AVDID?: string;
      Title?: string;
      Description?: string;
      Severity?: string;
      Resolution?: string;
      References?: string[];
      CauseMetadata?: { StartLine?: number; EndLine?: number };
    }>;
  }>;
}

export const trivyAdapter: ScannerAdapter = {
  id: 'trivy',
  name: 'Trivy',
  category: 'sca',
  description: 'Vulnerability + misconfiguration scanner for filesystems, repos, and containers.',
  homepage: 'https://trivy.dev',

  async applicable() {
    return true;
  },

  async available() {
    if (!(await which('trivy'))) {
      return { ok: false, hint: 'Install: brew install aquasecurity/trivy/trivy  (or)  https://aquasecurity.github.io/trivy/' };
    }
    const r = await exec('trivy', ['--version'], { timeoutMs: 10_000 });
    return { ok: r.code === 0, version: r.stdout.split('\n')[0].trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'trivy', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const r = await exec(
      'trivy',
      ['fs', '--scanners', 'vuln,misconfig', '--format', 'json', '--quiet', '--exit-code', '0', project.root],
      { timeoutMs: 10 * 60_000 },
    );

    if (r.code !== 0) {
      return {
        tool: 'trivy',
        ok: false,
        durationMs: performance.now() - t0,
        findings: [],
        error: r.stderr.slice(0, 500) || `trivy exit ${r.code}`,
      };
    }

    let parsed: TrivyJson = {};
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      // empty / no findings
    }

    const findings: OwaspFinding[] = [];

    for (const res of parsed.Results ?? []) {
      const isIac = res.Class === 'config' || res.Type === 'dockerfile' || res.Type === 'kubernetes' || res.Type === 'terraform';
      const category: Category = isIac ? 'iac' : 'sca';

      for (const v of res.Vulnerabilities ?? []) {
        findings.push({
          id: v.VulnerabilityID,
          sourceTool: 'trivy',
          category: 'sca',
          title: v.Title ?? `${v.VulnerabilityID} in ${v.PkgName}`,
          description: v.Description?.slice(0, 1000) ?? `${v.VulnerabilityID} affects ${v.PkgName}@${v.InstalledVersion ?? '?'}`,
          severity: TRIVY_SEVERITY[v.Severity?.toUpperCase() ?? ''] ?? 'medium',
          confidence: 'high',
          cve: v.VulnerabilityID.startsWith('CVE-') ? [v.VulnerabilityID] : undefined,
          cwe: v.CweIDs,
          packageName: v.PkgName,
          installedVersion: v.InstalledVersion,
          fixedVersion: v.FixedVersion,
          file: res.Target,
          remediation: v.FixedVersion
            ? `Upgrade ${v.PkgName} to ${v.FixedVersion} or later.`
            : `No fixed version is available yet. Track ${v.VulnerabilityID} or replace ${v.PkgName}.`,
          references: v.References ?? (v.PrimaryURL ? [v.PrimaryURL] : []),
          fingerprint: '',
        });
      }

      for (const m of res.Misconfigurations ?? []) {
        findings.push({
          id: m.ID,
          sourceTool: 'trivy',
          category,
          title: m.Title ?? m.ID,
          description: m.Description?.slice(0, 1000) ?? m.ID,
          severity: TRIVY_SEVERITY[m.Severity?.toUpperCase() ?? ''] ?? 'medium',
          confidence: 'high',
          file: res.Target,
          line: m.CauseMetadata?.StartLine,
          endLine: m.CauseMetadata?.EndLine,
          remediation: m.Resolution ?? 'Address the misconfiguration as documented.',
          references: m.References ?? [],
          fingerprint: '',
        });
      }
    }

    return {
      tool: 'trivy',
      ok: true,
      durationMs: performance.now() - t0,
      findings,
      diagnostics: { version: avail.version },
    };
  },
};
