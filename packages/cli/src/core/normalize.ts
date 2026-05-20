import { createHash } from 'node:crypto';
import type { OwaspFinding } from './types.js';
import { mapToOwasp } from './owasp-map.js';

/**
 * Non-cryptographic fingerprint used purely to merge duplicate findings
 * across tools. SHA-1 is fine here — we only need a stable bucket key.
 */
// owasp-wtf-ignore A02-WEAK-HASH
function fingerprint(f: OwaspFinding): string {
  const key = [
    f.file ?? '',
    f.line ?? '',
    f.cve?.sort().join(',') ?? '',
    f.cwe?.sort().join(',') ?? '',
    f.packageName ?? '',
    f.title.toLowerCase().replace(/\s+/g, ' ').trim(),
  ].join('|');
  // owasp-wtf-ignore A02-WEAK-HASH
  return createHash('sha1').update(key).digest('hex').slice(0, 16);
}

export function normalize(findings: OwaspFinding[]): OwaspFinding[] {
  for (const f of findings) {
    f.owaspTop10 = mapToOwasp(f);
    f.fingerprint = fingerprint(f);
  }
  return findings;
}

/**
 * Dedupe findings across tools. When two tools report the same finding
 * (same fingerprint), keep the one with higher confidence/severity and
 * record both tools in `confirmedBy`.
 */
const SEV_ORDER = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;
const CONF_ORDER = { high: 3, medium: 2, low: 1 } as const;

export function dedupe(findings: OwaspFinding[]): OwaspFinding[] {
  const byFp = new Map<string, OwaspFinding>();
  for (const f of findings) {
    const existing = byFp.get(f.fingerprint);
    if (!existing) {
      byFp.set(f.fingerprint, { ...f, confirmedBy: [f.sourceTool] });
      continue;
    }
    const tools = new Set([...(existing.confirmedBy ?? []), f.sourceTool]);
    const better =
      SEV_ORDER[f.severity] > SEV_ORDER[existing.severity] ||
      (SEV_ORDER[f.severity] === SEV_ORDER[existing.severity] &&
        CONF_ORDER[f.confidence] > CONF_ORDER[existing.confidence])
        ? f
        : existing;
    byFp.set(f.fingerprint, { ...better, confirmedBy: Array.from(tools) });
  }
  return Array.from(byFp.values());
}

export function sortFindings(findings: OwaspFinding[]): OwaspFinding[] {
  return [...findings].sort((a, b) => {
    const s = SEV_ORDER[b.severity] - SEV_ORDER[a.severity];
    if (s !== 0) return s;
    const c = CONF_ORDER[b.confidence] - CONF_ORDER[a.confidence];
    if (c !== 0) return c;
    return (a.file ?? '').localeCompare(b.file ?? '');
  });
}
