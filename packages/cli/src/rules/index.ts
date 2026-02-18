import type { Rule } from '../types.js';
import { a01Rules } from './a01-broken-access-control.js';
import { a02Rules } from './a02-cryptographic-failures.js';
import { a03Rules } from './a03-injection.js';
import { a05Rules } from './a05-security-misconfiguration.js';
import { a07Rules } from './a07-auth-failures.js';
import { a09Rules } from './a09-logging-failures.js';

/**
 * All registered security rules organized by OWASP category.
 */
export const allRules: Rule[] = [
  ...a01Rules,
  ...a02Rules,
  ...a03Rules,
  ...a05Rules,
  ...a07Rules,
  ...a09Rules,
];

/**
 * Group rules by OWASP category.
 */
export function rulesByCategory(): Record<string, Rule[]> {
  const grouped: Record<string, Rule[]> = {};
  for (const rule of allRules) {
    if (!grouped[rule.category]) {
      grouped[rule.category] = [];
    }
    grouped[rule.category].push(rule);
  }
  return grouped;
}

/**
 * Get rules filtered by minimum severity.
 */
export function rulesAtSeverity(minSeverity: string): Rule[] {
  const severityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  };

  const minLevel = severityOrder[minSeverity] ?? 0;
  return allRules.filter((r) => (severityOrder[r.severity] ?? 0) >= minLevel);
}
