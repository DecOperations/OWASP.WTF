/**
 * SARIF 2.1.0 reporter. Compatible with GitHub Advanced Security code
 * scanning uploads and any SARIF viewer.
 */

import type { OwaspFinding, ScanReport, Severity } from '../core/types.js';

const SARIF_LEVEL: Record<Severity, 'error' | 'warning' | 'note' | 'none'> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'note',
  info: 'none',
};

export function formatSarif(report: ScanReport): string {
  const rules = new Map<string, { id: string; name: string; shortDescription: string; helpUri?: string; fullDescription?: string }>();
  for (const f of report.findings) {
    const key = `${f.sourceTool}:${f.id}`;
    if (!rules.has(key)) {
      rules.set(key, {
        id: key,
        name: f.title.slice(0, 200),
        shortDescription: f.title.slice(0, 200),
        fullDescription: f.description.slice(0, 1000),
        helpUri: f.references[0],
      });
    }
  }

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'owasp-wtf',
            informationUri: 'https://owasp.wtf',
            version: '2.0.0',
            rules: Array.from(rules.values()).map((r) => ({
              id: r.id,
              name: r.name,
              shortDescription: { text: r.shortDescription },
              fullDescription: { text: r.fullDescription ?? r.shortDescription },
              helpUri: r.helpUri,
            })),
          },
        },
        results: report.findings.map((f) => ({
          ruleId: `${f.sourceTool}:${f.id}`,
          level: SARIF_LEVEL[f.severity],
          message: { text: f.description || f.title },
          properties: {
            severity: f.severity,
            confidence: f.confidence,
            cwe: f.cwe ?? [],
            cve: f.cve ?? [],
            owasp: f.owaspTop10 ?? [],
            sourceTool: f.sourceTool,
            confirmedBy: f.confirmedBy ?? [],
            package: f.packageName,
            installedVersion: f.installedVersion,
            fixedVersion: f.fixedVersion,
          },
          partialFingerprints: { owaspWtf: f.fingerprint },
          locations: f.file
            ? [
                {
                  physicalLocation: {
                    artifactLocation: { uri: f.file },
                    region: {
                      startLine: f.line ?? 1,
                      endLine: f.endLine ?? f.line ?? 1,
                      startColumn: f.column,
                    },
                  },
                },
              ]
            : [],
          fixes: f.remediation
            ? [{ description: { text: f.remediation } }]
            : undefined,
        })),
        invocations: [
          {
            executionSuccessful: report.adapters.every((a) => a.ok),
            startTimeUtc: report.generatedAt,
          },
        ],
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
