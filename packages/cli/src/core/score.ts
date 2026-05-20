import type { OwaspCategory, OwaspFinding, ScanReport, Severity, SourceTool, Category, AdapterRunResult } from './types.js';

const DEDUCTION: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};

export function score(findings: OwaspFinding[]): number {
  let s = 100;
  for (const f of findings) s -= DEDUCTION[f.severity];
  return Math.max(0, s);
}

export function buildReport(params: {
  projectRoot: string;
  findings: OwaspFinding[];
  adapters: AdapterRunResult[];
  durationMs: number;
}): ScanReport {
  const summary: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const byCategory: Record<Category, number> = {
    sast: 0, secrets: 0, sca: 0, iac: 0, container: 0, sbom: 0, dast: 0, semantic: 0,
  };
  const byOwasp: Partial<Record<OwaspCategory, number>> = {};
  const byTool: Partial<Record<SourceTool, number>> = {};

  for (const f of params.findings) {
    summary[f.severity]++;
    byCategory[f.category]++;
    byTool[f.sourceTool] = (byTool[f.sourceTool] ?? 0) + 1;
    for (const cat of f.owaspTop10 ?? []) {
      byOwasp[cat] = (byOwasp[cat] ?? 0) + 1;
    }
  }

  return {
    schemaVersion: '2.0',
    generatedAt: new Date().toISOString(),
    durationMs: params.durationMs,
    project: { root: params.projectRoot },
    score: score(params.findings),
    summary,
    byCategory,
    byOwasp,
    byTool,
    findings: params.findings,
    adapters: params.adapters,
  };
}
