# Detection Rules

OWASP.WTF ships with a curated set of static rules mapped to the OWASP Top 10,
and augments them with AI analysis when `--ai` is enabled.

## Coverage

| ID | Category | Static rules | AI augmentation |
|---|---|---|---|
| A01 | Broken Access Control | ✅ | ✅ |
| A02 | Cryptographic Failures | ✅ | ✅ |
| A03 | Injection | ✅ | ✅ |
| A04 | Insecure Design | — | ✅ |
| A05 | Security Misconfiguration | ✅ | ✅ |
| A06 | Vulnerable Components | — | ✅ |
| A07 | Auth Failures | ✅ | ✅ |
| A08 | Software Integrity Failures | — | ✅ |
| A09 | Logging Failures | ✅ | ✅ |
| A10 | SSRF | — | ✅ |

Static rules live in [`packages/cli/src/rules/`](../packages/cli/src/rules) —
one file per category. Categories without dedicated static rules surface
through AI analysis.

## Philosophy

- **High-signal over high-recall.** A noisy scanner gets disabled. We'd rather
  miss an edge case than cry wolf.
- **Framework-aware where possible.** A `next/headers` cookie call is not the
  same thing as a raw `Set-Cookie` header.
- **Concrete fixes.** Every finding should be actionable. "Sanitize your input"
  is not actionable; the exact replacement line is.

## Adding a rule

See [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-new-detection-rule).

## Reporting a false positive / negative

[Open an issue](https://github.com/DecOperations/OWASP.WTF/issues/new) with:

- The rule ID (e.g. `a03-sql-template-literal`)
- A minimal code snippet that reproduces it
- Expected vs actual
- Your CLI version and language/framework
