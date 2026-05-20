export { formatTerminalReport } from './terminal.js';
export { formatSarif } from './sarif.js';
export { formatMarkdown } from './markdown.js';
export { formatHtmlReport } from './html.js';
export { formatFixPlan } from './fix-plan.js';

import type { ScanReport } from '../core/types.js';

export function formatJsonReport(report: ScanReport): string {
  return JSON.stringify(report, null, 2);
}
