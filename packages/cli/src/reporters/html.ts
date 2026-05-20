/**
 * HTML reporter for v2 ScanReport. Self-contained, no external assets.
 */

import type { OwaspFinding, ScanReport, Severity } from '../core/types.js';

const SEV_COLOR: Record<Severity, string> = {
  critical: '#ff3b30',
  high: '#ff6b00',
  medium: '#ffcc00',
  low: '#00bcd4',
  info: '#888',
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatHtmlReport(report: ScanReport): string {
  const findingHtml = report.findings
    .map(
      (f) => `
    <div class="finding" data-severity="${f.severity}">
      <div class="finding-header">
        <span class="badge" style="background:${SEV_COLOR[f.severity]}">${f.severity.toUpperCase()}</span>
        <span class="tool">${f.sourceTool}</span>
        <h3>${escape(f.title)}</h3>
      </div>
      <div class="meta">
        ${f.file ? `<code>${escape(f.file)}${f.line ? `:${f.line}` : ''}</code>` : ''}
        ${(f.cwe ?? []).map((c) => `<span class="tag">${escape(c)}</span>`).join('')}
        ${(f.cve ?? []).map((c) => `<span class="tag cve">${escape(c)}</span>`).join('')}
        ${(f.owaspTop10 ?? []).map((c) => `<span class="tag owasp">${escape(c)}</span>`).join('')}
        ${f.confirmedBy && f.confirmedBy.length > 1 ? `<span class="tag confirmed">confirmed ×${f.confirmedBy.length}</span>` : ''}
      </div>
      <p>${escape(f.description)}</p>
      ${f.evidence ? `<pre class="evidence">${escape(f.evidence.slice(0, 600))}</pre>` : ''}
      <div class="fix"><strong>Fix:</strong> ${escape(f.remediation)}</div>
    </div>`,
    )
    .join('');

  const adapters = report.adapters
    .map(
      (a) =>
        `<tr><td>${a.tool}</td><td>${a.skipped ? 'skipped' : a.ok ? 'ok' : 'error'}</td><td>${a.findings.length}</td><td>${(a.durationMs / 1000).toFixed(2)}s</td><td>${a.skipReason ?? a.error ?? ''}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>OWASP.WTF Security Report</title>
<style>
  :root { color-scheme: dark; }
  body { font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 32px; }
  h1, h2, h3 { color: #fff; }
  .score { font-size: 64px; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px; }
  .stat { background: #161616; padding: 16px; border-radius: 8px; }
  .stat .n { font-size: 28px; font-weight: 700; }
  .stat .l { color: #888; font-size: 12px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 32px; font-size: 13px; }
  th, td { border-bottom: 1px solid #222; padding: 8px 12px; text-align: left; }
  th { color: #888; font-weight: 500; }
  .finding { background: #111; border-left: 4px solid #444; padding: 16px 20px; margin: 12px 0; border-radius: 6px; }
  .finding[data-severity="critical"] { border-left-color: #ff3b30; }
  .finding[data-severity="high"] { border-left-color: #ff6b00; }
  .finding[data-severity="medium"] { border-left-color: #ffcc00; }
  .finding[data-severity="low"] { border-left-color: #00bcd4; }
  .finding[data-severity="info"] { border-left-color: #888; }
  .finding-header { display: flex; align-items: center; gap: 12px; }
  .finding h3 { margin: 0; flex: 1; }
  .badge { color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .tool { color: #aaa; font-family: ui-monospace, monospace; font-size: 12px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; font-size: 12px; }
  .meta code { background: #1a1a1a; padding: 2px 6px; border-radius: 3px; color: #888; }
  .tag { background: #222; color: #aaa; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
  .tag.cve { background: #3a1a1a; color: #ff8888; }
  .tag.owasp { background: #1a2a3a; color: #88aaff; }
  .tag.confirmed { background: #1a3a1a; color: #88ff88; }
  .evidence { background: #1a1a1a; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
  .fix { background: #0f1f0f; border-left: 3px solid #4caf50; padding: 8px 12px; margin-top: 12px; font-size: 13px; }
</style>
</head>
<body>
  <h1>OWASP.WTF Security Report</h1>
  <p style="color:#888">Generated ${escape(report.generatedAt)} — scanned in ${(report.durationMs / 1000).toFixed(1)}s</p>

  <div class="score">${report.score}<span style="font-size:24px;color:#666"> / 100</span></div>

  <div class="grid">
    <div class="stat"><div class="n" style="color:${SEV_COLOR.critical}">${report.summary.critical}</div><div class="l">Critical</div></div>
    <div class="stat"><div class="n" style="color:${SEV_COLOR.high}">${report.summary.high}</div><div class="l">High</div></div>
    <div class="stat"><div class="n" style="color:${SEV_COLOR.medium}">${report.summary.medium}</div><div class="l">Medium</div></div>
    <div class="stat"><div class="n" style="color:${SEV_COLOR.low}">${report.summary.low}</div><div class="l">Low</div></div>
    <div class="stat"><div class="n" style="color:${SEV_COLOR.info}">${report.summary.info}</div><div class="l">Info</div></div>
  </div>

  <h2>Scanners</h2>
  <table>
    <thead><tr><th>Tool</th><th>Status</th><th>Findings</th><th>Duration</th><th>Notes</th></tr></thead>
    <tbody>${adapters}</tbody>
  </table>

  <h2>Findings (${report.findings.length})</h2>
  ${findingHtml || '<p style="color:#888">No findings 🎉</p>'}
</body>
</html>`;
}
