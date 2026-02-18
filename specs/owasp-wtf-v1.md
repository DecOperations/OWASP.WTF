# OWASP.WTF v1 Specification

## Overview

OWASP.WTF is an AI-powered web application security platform with two main products:

1. **Landing Page + Docs** (Next.js) - Modern, dark-themed site showcasing OWASP security best practices, CLI tool features, and AI auditing capabilities
2. **CLI Tool** (`owasp-wtf`) - Security scanner that analyzes any codebase and produces comprehensive security reports using static analysis + AI/LLM

## Architecture

```
owasp.wtf/                          # pnpm monorepo + Turborepo
├── apps/
│   └── web/                        # Next.js 15 app (landing + docs)
├── packages/
│   └── cli/                        # CLI tool (TypeScript, Node.js)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## User Stories

### Landing Page
- As a developer, I want to understand what OWASP.WTF offers so I can decide to use it
- As a security engineer, I want quick access to OWASP Top 10 references
- As a team lead, I want to see how the CLI tool works before adopting it

### CLI Tool
- As a developer, I want to run `npx owasp-wtf` in my project and get a security report
- As a developer, I want the report to cover OWASP Top 10 categories
- As a developer, I want AI-powered analysis for deeper vulnerability detection
- As a DevOps engineer, I want JSON output for CI/CD integration

## Landing Page Requirements

### Hero Section
- Bold headline: "Security Auditing. Powered by AI."
- Animated terminal showing CLI in action
- Install command: `npx owasp-wtf`
- CTA buttons: "Get Started" / "View Docs"

### Features Section
- OWASP Top 10 coverage
- AI/LLM-powered analysis
- CLI-first workflow
- Beautiful reports (terminal + HTML + JSON)
- CI/CD integration ready
- Zero config to start

### OWASP Top 10 Section
- Interactive cards for each category (A01-A10)
- Brief description of each vulnerability class
- Link to detailed docs

### CLI Demo Section
- Terminal mockup showing real output
- Before/after of finding vulnerabilities
- Report preview

### Footer
- Links to GitHub, docs, OWASP Foundation
- MIT License

### Design
- Dark theme (security aesthetic)
- Green/cyan accent colors (terminal vibes)
- Monospace fonts for code elements
- Responsive (mobile-first)

## CLI Tool Requirements

### Core Features (v1)
1. **File Scanner** - Recursively scan project files
2. **Static Analysis** - Pattern-based vulnerability detection
3. **AI Analysis** - Optional LLM-powered deep analysis
4. **Report Generator** - Terminal, HTML, and JSON output

### Security Rules (OWASP Top 10 2021)
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection (SQL, XSS, Command, etc.)
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)

### CLI Interface
```bash
# Basic scan
npx owasp-wtf

# With options
npx owasp-wtf --format json --output report.json
npx owasp-wtf --ai --api-key $ANTHROPIC_API_KEY
npx owasp-wtf --severity high
npx owasp-wtf --ignore "node_modules,dist"
```

### Report Output
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW, INFO
- File location with line numbers
- Description of the vulnerability
- OWASP category reference
- Suggested fix
- Overall security score (0-100)

## Tech Stack

### Monorepo
- pnpm workspaces
- Turborepo for build orchestration
- Shared TypeScript config

### Web App
- Next.js 15 (App Router)
- Tailwind CSS v4
- TypeScript strict mode

### CLI Tool
- TypeScript
- Commander.js (CLI framework)
- chalk (terminal colors)
- ora (spinners)
- glob (file scanning)

## Acceptance Criteria

- [ ] Monorepo builds with `pnpm build`
- [ ] Landing page renders at localhost:3000
- [ ] CLI runs with `npx owasp-wtf` (or `pnpm --filter cli dev`)
- [ ] CLI produces terminal report with findings
- [ ] CLI supports --format json output
- [ ] OWASP Top 10 categories covered in both site and CLI
- [ ] Responsive landing page (mobile + desktop)
- [ ] Dark theme throughout
