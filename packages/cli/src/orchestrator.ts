import type { OwaspFinding, ScanReport, AdapterRunResult } from './core/types.js';
import type { ScannerAdapter, ProjectContext } from './adapters/types.js';
import { normalize, dedupe, sortFindings } from './core/normalize.js';
import { buildReport } from './core/score.js';

export interface OrchestratorOptions {
  project: ProjectContext;
  adapters: ScannerAdapter[];
  /** Called as each adapter starts (for spinners/logs). */
  onAdapterStart?: (a: ScannerAdapter) => void;
  /** Called after each adapter finishes. */
  onAdapterFinish?: (r: AdapterRunResult) => void;
}

/**
 * Run a set of adapters in sequence, normalize their findings, dedupe across
 * tools, and produce a single ScanReport.
 */
export async function runOrchestrator(opts: OrchestratorOptions): Promise<ScanReport> {
  const t0 = performance.now();
  const adapterResults: AdapterRunResult[] = [];
  const collected: OwaspFinding[] = [];

  for (const adapter of opts.adapters) {
    if (!(await adapter.applicable(opts.project))) {
      adapterResults.push({
        tool: adapter.id,
        ok: true,
        durationMs: 0,
        findings: [],
        skipped: true,
        skipReason: 'not applicable to project',
      });
      continue;
    }

    opts.onAdapterStart?.(adapter);
    let result: AdapterRunResult;
    try {
      result = await adapter.run(opts.project);
    } catch (e) {
      result = {
        tool: adapter.id,
        ok: false,
        durationMs: 0,
        findings: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
    adapterResults.push(result);
    opts.onAdapterFinish?.(result);
    collected.push(...result.findings);
  }

  const normalized = normalize(collected);
  const deduped = sortFindings(dedupe(normalized));

  return buildReport({
    projectRoot: opts.project.root,
    findings: deduped,
    adapters: adapterResults,
    durationMs: performance.now() - t0,
  });
}
