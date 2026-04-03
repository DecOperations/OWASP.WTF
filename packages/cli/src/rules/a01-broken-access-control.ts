// owasp-wtf-ignore-file — rule definitions, not actual vulnerabilities
import type { Rule, Finding } from '../types.js';

/**
 * Helper: build a snippet from lines array around a given line index.
 * Returns the offending line plus up to 2 lines of context above and below.
 */
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

/** Check if a line is inside a comment. */
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
// Rule: CORS wildcard origin
// ---------------------------------------------------------------------------
const corsWildcard: Rule = {
  id: 'A01-CORS-WILDCARD',
  name: 'CORS Wildcard Origin',
  severity: 'high',
  category: 'A01:2021-Broken-Access-Control',
  description:
    'Access-Control-Allow-Origin set to "*" allows any domain to make cross-origin requests, potentially exposing sensitive data.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Match patterns like: Access-Control-Allow-Origin: * or origin: '*' or origin: "*"
      if (
        /Access-Control-Allow-Origin\s*[:=]\s*['"]\*['"]/i.test(line) ||
        /cors\(\s*\{[^}]*origin\s*:\s*['"]\*['"]/i.test(line) ||
        /origin\s*:\s*(?:true|['"]\*['"])/i.test(line)
      ) {
        findings.push({
          ruleId: corsWildcard.id,
          ruleName: corsWildcard.name,
          severity: corsWildcard.severity,
          category: corsWildcard.category,
          filePath,
          line: i + 1,
          column: line.search(/origin|Access-Control/i) + 1,
          snippet: snippet(lines, i),
          message: 'CORS is configured to allow all origins (*). This permits any website to make requests to your API.',
          suggestion:
            'Restrict CORS to specific trusted origins. Use an allowlist of domains instead of the wildcard "*".',
        });
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Missing auth middleware
// ---------------------------------------------------------------------------
const missingAuthMiddleware: Rule = {
  id: 'A01-NO-AUTH-MIDDLEWARE',
  name: 'Route Without Auth Middleware',
  severity: 'medium',
  category: 'A01:2021-Broken-Access-Control',
  description:
    'Route handlers defined without authentication middleware may be publicly accessible.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check files that look like route definitions
    const isRouteFile =
      /\.(router|route|controller|handler)/i.test(filePath) ||
      /app\.(get|post|put|patch|delete)\s*\(/i.test(content) ||
      /router\.(get|post|put|patch|delete)\s*\(/i.test(content);

    if (!isRouteFile) return findings;

    // Look for route definitions that reference sensitive paths without auth middleware
    const sensitivePathPattern = /\/(admin|user|account|profile|settings|dashboard|api\/v\d)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Match Express/Koa-style route definitions
      const routeMatch = line.match(
        /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?(?:\(|function)/,
      );

      if (routeMatch) {
        const routePath = routeMatch[2];
        if (sensitivePathPattern.test(routePath)) {
          // Check if there's middleware between the path and handler (comma-separated args)
          // A handler directly after the path string means no middleware
          const fullLine = line;
          // Count commas between the path and the handler — one comma means path -> handler directly
          const afterPath = fullLine.slice(fullLine.indexOf(routePath) + routePath.length);
          const commaCount = (afterPath.match(/,/g) || []).length;

          if (commaCount <= 1) {
            findings.push({
              ruleId: missingAuthMiddleware.id,
              ruleName: missingAuthMiddleware.name,
              severity: missingAuthMiddleware.severity,
              category: missingAuthMiddleware.category,
              filePath,
              line: i + 1,
              column: line.search(/\.(get|post|put|patch|delete)/) + 1,
              snippet: snippet(lines, i),
              message: `Sensitive route "${routePath}" appears to have no authentication middleware.`,
              suggestion:
                'Add authentication middleware before the route handler, e.g.: router.get("/admin", authMiddleware, handler)',
            });
          }
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Direct object reference without validation
// ---------------------------------------------------------------------------
const directObjectRef: Rule = {
  id: 'A01-IDOR',
  name: 'Potential IDOR',
  severity: 'medium',
  category: 'A01:2021-Broken-Access-Control',
  description:
    'Using user-supplied IDs to directly access database records without ownership validation can lead to Insecure Direct Object References.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Patterns like: findById(req.params.id) or findOne({ _id: req.params.id })
      // without a nearby ownership check
      const idorPatterns = [
        /findById\s*\(\s*req\.(params|query|body)\.\w+\s*\)/,
        /findOne\s*\(\s*\{\s*_?id\s*:\s*req\.(params|query|body)\.\w+/,
        /\.findByPk\s*\(\s*req\.(params|query|body)\.\w+\s*\)/,
        /WHERE\s+id\s*=.*req\.(params|query|body)/i,
      ];

      for (const pattern of idorPatterns) {
        if (pattern.test(line)) {
          // Check surrounding lines for ownership validation
          const context = lines
            .slice(Math.max(0, i - 5), Math.min(lines.length, i + 5))
            .join('\n');
          const hasOwnershipCheck =
            /user\.?[Ii]d|userId|owner|belongsTo|authorize|permission|canAccess/i.test(context);

          if (!hasOwnershipCheck) {
            findings.push({
              ruleId: directObjectRef.id,
              ruleName: directObjectRef.name,
              severity: directObjectRef.severity,
              category: directObjectRef.category,
              filePath,
              line: i + 1,
              column: line.search(pattern) + 1,
              snippet: snippet(lines, i),
              message:
                'Database record accessed directly using user-supplied ID without visible ownership validation.',
              suggestion:
                'Verify the requesting user has permission to access this record. Add ownership checks (e.g., where: { id, userId: req.user.id }).',
            });
          }
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Missing role/permission checks
// ---------------------------------------------------------------------------
const missingRoleCheck: Rule = {
  id: 'A01-NO-RBAC',
  name: 'Missing Role/Permission Check',
  severity: 'medium',
  category: 'A01:2021-Broken-Access-Control',
  description:
    'Administrative or privileged actions performed without role-based access control checks.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only flag in files that seem to handle admin actions
    const hasAdminAction =
      /delete(User|Account|All|Record)|admin|role.*admin|isAdmin|updateRole|setPermission|grant|revoke/i.test(
        content,
      );

    if (!hasAdminAction) return findings;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Functions that perform admin-like operations
      const adminOps = [
        /deleteUser|deleteAccount|deleteAll|removeUser/,
        /updateRole|setRole|assignRole|changeRole/,
        /setPermission|grantPermission|revokePermission/,
        /\.destroy\s*\(\s*\{?\s*where\s*:\s*\{\s*\}\s*\}?\s*\)/, // bulk delete
      ];

      for (const pattern of adminOps) {
        if (pattern.test(line)) {
          // Check surrounding context for role/permission checks
          const context = lines
            .slice(Math.max(0, i - 10), i)
            .join('\n');
          const hasRoleCheck =
            /isAdmin|hasRole|checkRole|requireRole|authorize|permission|rbac|canAccess|isAuthorized/i.test(
              context,
            );

          if (!hasRoleCheck) {
            findings.push({
              ruleId: missingRoleCheck.id,
              ruleName: missingRoleCheck.name,
              severity: missingRoleCheck.severity,
              category: missingRoleCheck.category,
              filePath,
              line: i + 1,
              column: line.search(pattern) + 1,
              snippet: snippet(lines, i),
              message:
                'Privileged operation performed without a visible role or permission check in the preceding code.',
              suggestion:
                'Add role-based access control (RBAC) before performing administrative actions. Verify user.role === "admin" or use a middleware like requireRole("admin").',
            });
          }
          break;
        }
      }
    }

    return findings;
  },
};

export const a01Rules: Rule[] = [
  corsWildcard,
  missingAuthMiddleware,
  directObjectRef,
  missingRoleCheck,
];
