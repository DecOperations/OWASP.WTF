/**
 * Grype adapter — vulnerability scanning against a Syft-generated SBOM
 * (preferred) or the project filesystem directly.
 */

import type { OwaspFinding, AdapterRunResult, Severity } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';
import { getLastSyftArtifacts } from './syft.js';

const GRYPE_SEVERITY: Record<string, Severity> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
  Negligible: 'info',
  Unknown: 'info',
};

interface GrypeJson {
  matches?: Array<{
    vulnerability: {
      id: string;
      severity?: string;
      description?: string;
      urls?: string[];
      fix?: { versions?: string[]; state?: string };
      cvss?: Array<{ metrics?: { baseScore?: number } }>;
    };
    artifact: {
      name: string;
      version: string;
      type?: string;
      locations?: Array<{ path?: string }>;
    };
    relatedVulnerabilities?: Array<{ id: string; description?: string }>;
  }>;
}

export const grypeAdapter: ScannerAdapter = {
  id: 'grype',
  name: 'Grype',
  category: 'sca',
  description: 'Vulnerability scanner for SBOMs and filesystems.',
  homepage: 'https://github.com/anchore/grype',

  async applicable() {
    return true;
  },

  async available() {
    if (!(await which('grype'))) {
      return { ok: false, hint: 'Install: brew install grype  (or)  https://github.com/anchore/grype#installation' };
    }
    const r = await exec('grype', ['version'], { timeoutMs: 10_000 });
    return { ok: r.code === 0, version: r.stdout.split('\n')[0].trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'grype', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const sbom = getLastSyftArtifacts()?.sbomPath;
    const target = sbom ? `sbom:${sbom}` : `dir:${project.root}`;

    const r = await exec(
      'grype',
      [target, '-o', 'json', '-q'],
      { timeoutMs: 10 * 60_000 },
    );

    if (r.code !== 0) {
      return {
        tool: 'grype',
        ok: false,
        durationMs: performance.now() - t0,
        findings: [],
        error: r.stderr.slice(0, 500) || `grype exit ${r.code}`,
      };
    }

    let parsed: GrypeJson = {};
    try {
      parsed = JSON.parse(r.stdout);
    } catch {
      // no findings
    }

    const findings: OwaspFinding[] = (parsed.matches ?? []).map((m) => {
      const sev = GRYPE_SEVERITY[m.vulnerability.severity ?? 'Unknown'] ?? 'medium';
      const fixed = m.vulnerability.fix?.versions?.[0];
      const desc = m.vulnerability.description ?? m.relatedVulnerabilities?.[0]?.description ?? '';
      return {
        id: m.vulnerability.id,
        sourceTool: 'grype',
        category: 'sca',
        title: `${m.vulnerability.id} in ${m.artifact.name}@${m.artifact.version}`,
        description: desc.slice(0, 1000),
        severity: sev,
        confidence: 'high',
        cve: m.vulnerability.id.startsWith('CVE-') ? [m.vulnerability.id] : undefined,
        packageName: m.artifact.name,
        installedVersion: m.artifact.version,
        fixedVersion: fixed,
        file: m.artifact.locations?.[0]?.path,
        remediation: fixed
          ? `Upgrade ${m.artifact.name} to ${fixed} or later.`
          : `No fix available yet. Track ${m.vulnerability.id} or replace ${m.artifact.name}.`,
        references: m.vulnerability.urls ?? [],
        fingerprint: '',
      };
    });

    return {
      tool: 'grype',
      ok: true,
      durationMs: performance.now() - t0,
      findings,
      diagnostics: { version: avail.version, viaSbom: !!sbom },
    };
  },
};
