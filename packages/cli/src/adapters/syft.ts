/**
 * Syft adapter — generates a CycloneDX SBOM. Findings are purely
 * informational; the SBOM is mainly useful as input to Grype.
 */

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AdapterRunResult } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';
import { exec, which } from './exec.js';

export interface SyftRunArtifacts {
  sbomPath?: string;
  cleanup?: () => void;
}

let lastSbomArtifacts: SyftRunArtifacts | null = null;
export function getLastSyftArtifacts(): SyftRunArtifacts | null {
  return lastSbomArtifacts;
}

export const syftAdapter: ScannerAdapter = {
  id: 'syft',
  name: 'Syft',
  category: 'sbom',
  description: 'Generates a CycloneDX SBOM of the project filesystem.',
  homepage: 'https://github.com/anchore/syft',

  async applicable() {
    return true;
  },

  async available() {
    if (!(await which('syft'))) {
      return { ok: false, hint: 'Install: brew install syft  (or)  https://github.com/anchore/syft#installation' };
    }
    const r = await exec('syft', ['version'], { timeoutMs: 10_000 });
    return { ok: r.code === 0, version: r.stdout.split('\n')[0].trim() };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const avail = await this.available();
    if (!avail.ok) {
      return { tool: 'syft', ok: false, durationMs: 0, findings: [], skipped: true, skipReason: avail.hint };
    }

    const r = await exec(
      'syft',
      [`dir:${project.root}`, '-o', 'cyclonedx-json', '--quiet'],
      { timeoutMs: 5 * 60_000 },
    );

    if (r.code !== 0) {
      return {
        tool: 'syft',
        ok: false,
        durationMs: performance.now() - t0,
        findings: [],
        error: r.stderr.slice(0, 500) || `syft exit ${r.code}`,
      };
    }

    const tmp = mkdtempSync(join(tmpdir(), 'owasp-wtf-syft-'));
    const sbomPath = join(tmp, 'sbom.cdx.json');
    writeFileSync(sbomPath, r.stdout, 'utf-8');
    lastSbomArtifacts = {
      sbomPath,
      cleanup: () => { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ } },
    };

    let componentCount = 0;
    try {
      const sbom = JSON.parse(r.stdout);
      componentCount = Array.isArray(sbom.components) ? sbom.components.length : 0;
    } catch { /* ignore parse failure */ }

    return {
      tool: 'syft',
      ok: true,
      durationMs: performance.now() - t0,
      findings: [],
      diagnostics: { version: avail.version, sbomPath, components: componentCount },
    };
  },
};
