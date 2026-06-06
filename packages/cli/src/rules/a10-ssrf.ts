// owasp-wtf-ignore-file — rule definitions, not actual vulnerabilities
import type { Rule, Finding } from '../types.js';

function snippet(lines: string[], idx: number): string {
  const start = Math.max(0, idx - 2);
  const end = Math.min(lines.length - 1, idx + 2);
  const result: string[] = [];
  for (let i = start; i <= end; i++) {
    const marker = i === idx ? '>' : ' ';
    result.push(`${marker} ${i + 1} | ${lines[i]}`);
  }
  return result.join('\n');
}

function isComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('<!--')
  );
}

// ---------------------------------------------------------------------------
// Rule: Server-Side Request Forgery (SSRF)
// ---------------------------------------------------------------------------
const ssrf: Rule = {
  id: 'A10-SSRF',
  name: 'Server-Side Request Forgery',
  severity: 'high',
  category: 'A10:2021-SSRF',
  description:
    'Passing user-controlled URLs directly to HTTP client libraries allows attackers to make requests to internal or restricted services.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const jsPatterns: { pattern: RegExp; label: string; suggestion: string }[] = [
      {
        pattern: /\bfetch\s*\(\s*req\.(params|query|body)/,
        label: 'fetch() called with user-controlled URL',
        suggestion: 'Validate and whitelist URLs before fetching. Use an allowlist of permitted destinations.',
      },
      {
        pattern: /axios\.(get|post|put|delete|patch)\s*\(\s*req\.(params|query|body)/,
        label: 'axios called with user-controlled URL',
        suggestion: 'Validate URLs against an allowlist before making HTTP requests.',
      },
      {
        pattern: /\b(?:http|https)\.get\s*\(\s*req\.(params|query|body)/,
        label: 'http.get/https.get called with user-controlled URL',
        suggestion: 'Validate URLs against an allowlist before making HTTP requests.',
      },
      {
        pattern: /\brequest\s*\(\s*req\.(params|query|body)/,
        label: 'request() called with user-controlled URL',
        suggestion: 'Validate URLs against an allowlist before making HTTP requests.',
      },
    ];

    const pyPatterns: { pattern: RegExp; label: string; suggestion: string }[] = [
      {
        pattern: /requests\.(get|post|put|delete|patch)\s*\(\s*(request\.args|request\.json\(\)|request\.form|request\.values)/,
        label: 'requests called with user-controlled URL',
        suggestion: 'Validate URLs against an allowlist before making HTTP requests.',
      },
      {
        pattern: /urllib\.request\.urlopen\s*\(\s*(request\.args|request\.json\(\)|request\.form|request\.values)/,
        label: 'urllib.request.urlopen called with user-controlled URL',
        suggestion: 'Validate URLs against an allowlist before making HTTP requests.',
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const { pattern, label, suggestion } of jsPatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: ssrf.id,
            ruleName: ssrf.name,
            severity: ssrf.severity,
            category: ssrf.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. This may allow SSRF attacks against internal services.`,
            suggestion,
          });
          break;
        }
      }

      for (const { pattern, label, suggestion } of pyPatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: ssrf.id,
            ruleName: ssrf.name,
            severity: ssrf.severity,
            category: ssrf.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. This may allow SSRF attacks against internal services.`,
            suggestion,
          });
          break;
        }
      }
    }

    return findings;
  },
};

export const a10Rules: Rule[] = [ssrf];
