"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════
   OWASP.WTF Landing Page
   ═══════════════════════════════════════════════════════════════════ */

// ── Shared icon components ────────────────────────────────────────

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M10 21h4" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────

const features = [
  {
    icon: ShieldIcon,
    title: "OWASP Top 10 Coverage",
    description:
      "Full coverage of the latest OWASP Top 10 vulnerability categories. Every rule mapped, every pattern detected.",
  },
  {
    icon: BrainIcon,
    title: "AI-Powered Analysis",
    description:
      "Claude AI understands context, not just patterns. Catches vulnerabilities that regex-based tools miss entirely.",
  },
  {
    icon: ZapIcon,
    title: "Zero Config",
    description:
      "Run one command. No config files, no setup, no BS. Works with any JavaScript, TypeScript, Python, or Go project.",
  },
  {
    icon: FileTextIcon,
    title: "Beautiful Reports",
    description:
      "Terminal reports with color. Export to HTML or JSON for CI/CD pipelines. Share findings with your team.",
  },
  {
    icon: TerminalIcon,
    title: "CLI First",
    description:
      "Built for developers who live in the terminal. Fast, scriptable, composable. Pipe it, chain it, automate it.",
  },
  {
    icon: CodeIcon,
    title: "Open Source",
    description:
      "MIT licensed. Audit the auditor. Contribute rules, improve detection. Community-driven security.",
  },
];

const owaspTop10 = [
  {
    id: "A01:2021",
    name: "Broken Access Control",
    description:
      "Restrictions on authenticated users are not properly enforced, allowing access to unauthorized functions or data.",
    severity: "critical" as const,
  },
  {
    id: "A02:2021",
    name: "Cryptographic Failures",
    description:
      "Failures related to cryptography that lead to exposure of sensitive data or system compromise.",
    severity: "critical" as const,
  },
  {
    id: "A03:2021",
    name: "Injection",
    description:
      "User-supplied data is sent to an interpreter as part of a command or query, tricking it into executing unintended actions.",
    severity: "critical" as const,
  },
  {
    id: "A04:2021",
    name: "Insecure Design",
    description:
      "Missing or ineffective security controls and architectural flaws that cannot be fixed by proper implementation alone.",
    severity: "high" as const,
  },
  {
    id: "A05:2021",
    name: "Security Misconfiguration",
    description:
      "Missing hardening, open cloud storage, verbose errors, unnecessary features enabled, or default credentials in use.",
    severity: "high" as const,
  },
  {
    id: "A06:2021",
    name: "Vulnerable Components",
    description:
      "Using components with known vulnerabilities that can undermine application defenses and enable attacks.",
    severity: "high" as const,
  },
  {
    id: "A07:2021",
    name: "Auth Failures",
    description:
      "Broken authentication and session management allowing attackers to compromise passwords, keys, or session tokens.",
    severity: "critical" as const,
  },
  {
    id: "A08:2021",
    name: "Software Integrity Failures",
    description:
      "Code and infrastructure that does not protect against integrity violations from untrusted sources or insecure CI/CD.",
    severity: "medium" as const,
  },
  {
    id: "A09:2021",
    name: "Logging Failures",
    description:
      "Insufficient logging, monitoring, and alerting that allows attackers to go undetected and persist in systems.",
    severity: "medium" as const,
  },
  {
    id: "A10:2021",
    name: "SSRF",
    description:
      "Server-Side Request Forgery occurs when a web app fetches a remote resource without validating the user-supplied URL.",
    severity: "high" as const,
  },
];

const severityColors = {
  critical: "text-terminal-red border-terminal-red/30 bg-terminal-red/10",
  high: "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-terminal-cyan border-terminal-cyan/30 bg-terminal-cyan/10",
};

const severityLabels = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const aiCapabilities = [
  {
    title: "Framework-Aware",
    description:
      "Understands Next.js, Express, Django, Flask, Gin, and more. Knows the security patterns and pitfalls of each.",
  },
  {
    title: "Cross-File Data Flow",
    description:
      "Traces user input across files, through middleware, into database queries. Finds injection paths that span your entire codebase.",
  },
  {
    title: "Contextual Fixes",
    description:
      "Doesn't just say \"sanitize input.\" Gives you the exact code fix for your framework, your language, your specific vulnerability.",
  },
  {
    title: "CVE-Informed",
    description:
      "Learns from the latest CVEs and security advisories. Detection rules evolve as the threat landscape changes.",
  },
];

// ── Components ────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border-subtle/50 bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2">
          <ShieldIcon className="h-6 w-6 text-terminal-green" />
          <span className="font-mono text-lg font-bold text-text-primary">
            OWASP<span className="text-terminal-green">.WTF</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            Features
          </a>
          <a
            href="#owasp-top-10"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            OWASP Top 10
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            How It Works
          </a>
          <a
            href="#ai"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            AI Engine
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/OWASP/owasp-wtf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <a
            href="#get-started"
            className="rounded-lg bg-terminal-green/10 px-4 py-2 font-mono text-sm font-medium text-terminal-green ring-1 ring-terminal-green/30 transition-all hover:bg-terminal-green/20 hover:ring-terminal-green/50"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-text-muted transition-all hover:bg-white/5 hover:text-terminal-green"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-terminal-green" />
          <span className="text-terminal-green">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-terminal-green/5 blur-[120px]" />
        <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-terminal-cyan/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-terminal-green/20 bg-terminal-green/5 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
            <span className="font-mono text-xs text-terminal-green">
              Open Source Security Scanner
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up mb-6 text-5xl leading-tight font-extrabold tracking-tight md:text-7xl md:leading-tight">
            Security Auditing.
            <br />
            <span className="text-gradient-green">Powered by AI.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-in-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            Scan any codebase for OWASP vulnerabilities in seconds. AI-powered
            static analysis that actually understands your code.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in-up mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "0.2s" }}
          >
            <a
              href="#get-started"
              className="inline-flex items-center gap-2 rounded-xl bg-terminal-green px-8 py-3.5 font-semibold text-bg-primary transition-all hover:bg-terminal-green/90 hover:shadow-[0_0_30px_rgba(0,255,65,0.3)]"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/OWASP/owasp-wtf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-8 py-3.5 font-semibold text-text-primary transition-all hover:border-text-muted hover:bg-white/5"
            >
              <GithubIcon className="h-5 w-5" />
              View on GitHub
            </a>
          </div>

          {/* Install command */}
          <div
            className="animate-fade-in-up mx-auto inline-flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-5 py-3"
            style={{ animationDelay: "0.3s" }}
          >
            <code className="font-mono text-sm text-text-muted">
              <span className="text-terminal-green">$</span> npx owasp-wtf
            </code>
            <CopyButton text="npx owasp-wtf" />
          </div>
        </div>

        {/* Terminal mockup */}
        <div
          className="animate-fade-in-up mx-auto mt-16 max-w-2xl"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="glow-green rounded-2xl border border-border-subtle bg-bg-secondary overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-terminal-red/80" />
              <div className="h-3 w-3 rounded-full bg-terminal-amber/80" />
              <div className="h-3 w-3 rounded-full bg-terminal-green/80" />
              <span className="ml-3 font-mono text-xs text-text-muted">
                owasp-wtf
              </span>
            </div>

            {/* Terminal content */}
            <div className="terminal-scanline p-6 font-mono text-sm leading-relaxed">
              <p>
                <span className="text-terminal-green">$</span>{" "}
                <span className="text-text-primary">npx owasp-wtf</span>
              </p>
              <p className="mt-3 text-text-muted">
                <span className="text-terminal-cyan">{"\u28BE"}</span> Scanning
                847 files...
              </p>
              <div className="mt-4 text-terminal-green">
                <p>
                  {"  "}
                  {"\u2554"}
                  {"\u2550".repeat(46)}
                  {"\u2557"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}OWASP.WTF Security Report{"                  "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}
                  <span className="text-text-primary font-bold">
                    Score: 72/100
                  </span>
                  {"                               "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2560"}
                  {"\u2550".repeat(46)}
                  {"\u2563"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}
                  <span className="text-terminal-red">
                    {"\uD83D\uDD34"} CRITICAL
                  </span>
                  {"  "}2{"  "}
                  {"\u2502"}
                  {"  "}
                  <span className="text-terminal-amber">
                    {"\uD83D\uDFE0"} HIGH
                  </span>
                  {"    "}5{"           "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}
                  <span className="text-yellow-400">
                    {"\uD83D\uDFE1"} MEDIUM
                  </span>
                  {"    "}8{"  "}
                  {"\u2502"}
                  {"  "}
                  <span className="text-terminal-cyan">
                    {"\uD83D\uDD35"} LOW
                  </span>
                  {"    "}12{"           "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2560"}
                  {"\u2550".repeat(46)}
                  {"\u2563"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}A03:Injection{"         "}
                  <span className="text-terminal-red">
                    {"\u2588".repeat(6)}
                  </span>
                  <span className="text-border-subtle">
                    {"\u2591".repeat(4)}
                  </span>
                  {"  "}3 found{"  "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}A07:Auth Failures{"     "}
                  <span className="text-terminal-amber">
                    {"\u2588".repeat(4)}
                  </span>
                  <span className="text-border-subtle">
                    {"\u2591".repeat(6)}
                  </span>
                  {"  "}2 found{"  "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2551"}
                  {"  "}A01:Access Control{"    "}
                  <span className="text-yellow-400">
                    {"\u2588".repeat(3)}
                  </span>
                  <span className="text-border-subtle">
                    {"\u2591".repeat(7)}
                  </span>
                  {"  "}1 found{"  "}
                  {"\u2551"}
                </p>
                <p>
                  {"  "}
                  {"\u2554"}
                  {"\u2550".repeat(46)}
                  {"\u255D"}
                </p>
              </div>
              <span className="mt-2 inline-block h-4 w-2 bg-terminal-green animate-terminal-blink" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="reveal mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm font-medium tracking-wider text-terminal-green uppercase">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Everything you need to{" "}
            <span className="text-gradient-green">ship secure code</span>
          </h2>
          <p className="text-lg text-text-muted">
            A complete security toolkit that fits in your terminal.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="reveal card-hover rounded-2xl border border-border-subtle bg-bg-card p-8"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="mb-5 inline-flex rounded-xl bg-terminal-green/10 p-3">
                <feature.icon className="h-6 w-6 text-terminal-green" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OwaspTop10Section() {
  return (
    <section id="owasp-top-10" className="relative py-24 md:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 h-[500px] w-[600px] rounded-full bg-terminal-cyan/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="reveal mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm font-medium tracking-wider text-terminal-cyan uppercase">
            Comprehensive Coverage
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            The OWASP Top 10
          </h2>
          <p className="text-lg text-text-muted">
            Every category. Every vulnerability. Every fix.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {owaspTop10.map((item, index) => (
            <div
              key={item.id}
              className="reveal card-hover group rounded-2xl border border-border-subtle bg-bg-card p-6"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Severity badge */}
              <span
                className={`mb-4 inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${severityColors[item.severity]}`}
              >
                {severityLabels[item.severity]}
              </span>

              {/* Category ID */}
              <p className="mb-1 font-mono text-xs text-terminal-green">
                {item.id}
              </p>

              {/* Name */}
              <h3 className="mb-2 text-sm font-semibold text-text-primary leading-snug">
                {item.name}
              </h3>

              {/* Description */}
              <p className="text-xs leading-relaxed text-text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Install",
      command: "npx owasp-wtf",
      description:
        "One command. No signup, no API keys, no configuration files. Just install and go.",
    },
    {
      number: "02",
      title: "Scan",
      command: "Detecting project type... Next.js",
      description:
        "Automatically detects your project type, language, and framework. Scans every file for vulnerabilities.",
    },
    {
      number: "03",
      title: "Fix",
      command: "Generating remediation advice...",
      description:
        "Get actionable, framework-specific remediation advice powered by AI. Copy-paste fixes, not vague warnings.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 border-t border-border-subtle/50"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="reveal mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm font-medium tracking-wider text-terminal-green uppercase">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Three steps to{" "}
            <span className="text-gradient-green">secure code</span>
          </h2>
          <p className="text-lg text-text-muted">
            From zero to security report in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`reveal relative ${index < steps.length - 1 ? "step-connector" : ""}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="rounded-2xl border border-border-subtle bg-bg-card p-8">
                {/* Step number */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-terminal-green/10 font-mono text-lg font-bold text-terminal-green ring-1 ring-terminal-green/20">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-bold text-text-primary">
                    {step.title}
                  </h3>
                </div>

                {/* Command */}
                <div className="mb-5 rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-sm">
                  <span className="text-terminal-green">{">"}</span>{" "}
                  <span className="text-text-muted">{step.command}</span>
                </div>

                {/* Description */}
                <p className="leading-relaxed text-text-muted">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AISection() {
  return (
    <section
      id="ai"
      className="relative py-24 md:py-32 border-t border-border-subtle/50"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terminal-cyan/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Text */}
          <div className="reveal">
            <p className="mb-3 font-mono text-sm font-medium tracking-wider text-terminal-cyan uppercase">
              AI Engine
            </p>
            <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
              Not Your Average{" "}
              <span className="text-gradient-green">Scanner</span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-text-muted">
              Traditional scanners use regex patterns and AST matching. They find
              obvious bugs but miss the subtle ones. OWASP.WTF uses Claude AI to
              understand your code the way a senior security engineer would --
              reading context, tracing data flow, and understanding business
              logic.
            </p>

            <div className="space-y-6">
              {aiCapabilities.map((capability, index) => (
                <div
                  key={capability.title}
                  className="reveal flex gap-4"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terminal-green/20">
                    <CheckIcon className="h-3.5 w-3.5 text-terminal-green" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-text-primary">
                      {capability.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-text-muted">
                      {capability.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code comparison */}
          <div className="reveal" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl border border-border-subtle bg-bg-secondary overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-terminal-red/80" />
                <div className="h-3 w-3 rounded-full bg-terminal-amber/80" />
                <div className="h-3 w-3 rounded-full bg-terminal-green/80" />
                <span className="ml-3 font-mono text-xs text-text-muted">
                  AI Analysis
                </span>
              </div>

              {/* Content */}
              <div className="p-6 font-mono text-sm leading-relaxed space-y-4">
                {/* Vulnerable code */}
                <div>
                  <p className="text-text-muted mb-2">
                    <span className="text-terminal-red">{"//"}</span>{" "}
                    <span className="text-terminal-red">
                      Vulnerability detected: SQL Injection (A03:2021)
                    </span>
                  </p>
                  <p className="text-text-muted">
                    <span className="text-terminal-cyan">const</span>{" "}
                    <span className="text-text-primary">query</span> ={" "}
                    <span className="text-terminal-amber">
                      {"`"}SELECT * FROM users WHERE id = ${"${"}
                    </span>
                    <span className="text-terminal-red">req.params.id</span>
                    <span className="text-terminal-amber">
                      {"}"}{"`"}
                    </span>
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border-subtle" />

                {/* AI analysis */}
                <div className="space-y-2">
                  <p className="text-terminal-cyan">
                    {"\u25B6"} AI Analysis:
                  </p>
                  <p className="text-text-muted pl-4">
                    User input from{" "}
                    <span className="text-terminal-amber">req.params.id</span>{" "}
                    flows directly into SQL query without parameterization.
                  </p>
                  <p className="text-text-muted pl-4">
                    Traced from:{" "}
                    <span className="text-text-primary">
                      routes/users.ts:42
                    </span>{" "}
                    {"\u2192"}{" "}
                    <span className="text-text-primary">db/queries.ts:15</span>
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-border-subtle" />

                {/* Fix */}
                <div>
                  <p className="text-terminal-green mb-2">
                    {"\u2714"} Suggested fix:
                  </p>
                  <p className="text-text-muted">
                    <span className="text-terminal-cyan">const</span>{" "}
                    <span className="text-text-primary">query</span> ={" "}
                    <span className="text-terminal-amber">
                      {"`"}SELECT * FROM users WHERE id = $1{"`"}
                    </span>
                  </p>
                  <p className="text-text-muted">
                    <span className="text-terminal-cyan">const</span>{" "}
                    <span className="text-text-primary">result</span> ={" "}
                    <span className="text-terminal-cyan">await</span>{" "}
                    <span className="text-text-primary">
                      db.query(query, [req.params.id])
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GetStartedSection() {
  return (
    <section
      id="get-started"
      className="relative py-24 md:py-32 border-t border-border-subtle/50"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-terminal-green/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <div className="reveal">
          <p className="mb-3 font-mono text-sm font-medium tracking-wider text-terminal-green uppercase">
            Get Started
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Secure your code{" "}
            <span className="text-gradient-green">in seconds</span>
          </h2>
          <p className="mb-10 text-lg text-text-muted">
            No signup required. No API keys. Just one command.
          </p>
        </div>

        {/* Install block */}
        <div className="reveal mx-auto max-w-md" style={{ animationDelay: "0.1s" }}>
          <div className="animate-glow-pulse rounded-2xl border border-terminal-green/30 bg-bg-secondary p-8">
            <p className="mb-4 font-mono text-sm text-text-muted">
              Run in your project directory:
            </p>
            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-primary px-5 py-4">
              <code className="font-mono text-lg text-terminal-green">
                npx owasp-wtf
              </code>
              <CopyButton text="npx owasp-wtf" />
            </div>
            <p className="mt-4 font-mono text-xs text-text-muted">
              Requires Node.js 20+
            </p>
          </div>
        </div>

        <div
          className="reveal mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.2s" }}
        >
          <a
            href="https://github.com/OWASP/owasp-wtf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-6 py-3 font-medium text-text-primary transition-all hover:border-text-muted hover:bg-white/5"
          >
            <GithubIcon className="h-5 w-5" />
            Star on GitHub
            <ExternalLinkIcon className="h-4 w-4 text-text-muted" />
          </a>
          <a
            href="https://github.com/OWASP/owasp-wtf#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-6 py-3 font-medium text-text-primary transition-all hover:border-text-muted hover:bg-white/5"
          >
            Read the Docs
            <ExternalLinkIcon className="h-4 w-4 text-text-muted" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-subtle/50 bg-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ShieldIcon className="h-6 w-6 text-terminal-green" />
              <span className="font-mono text-lg font-bold text-text-primary">
                OWASP<span className="text-terminal-green">.WTF</span>
              </span>
            </div>
            <p className="mb-6 max-w-sm leading-relaxed text-text-muted">
              AI-powered security auditing for modern codebases. Find
              vulnerabilities before they find you.
            </p>
            <p className="text-sm text-text-muted">
              Built with love for the security community.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
              Project
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/OWASP/owasp-wtf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/OWASP/owasp-wtf#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/OWASP/owasp-wtf/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  Report a Bug
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
              Community
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://owasp.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  OWASP Foundation
                </a>
              </li>
              <li>
                <a
                  href="https://owasp.org/www-project-top-ten/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  OWASP Top 10
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/OWASP/owasp-wtf/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-muted transition-colors hover:text-terminal-green"
                >
                  Contributing
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle/50 pt-8 md:flex-row">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} OWASP.WTF. Released under the MIT
            License.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/OWASP/owasp-wtf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <OwaspTop10Section />
        <HowItWorksSection />
        <AISection />
        <GetStartedSection />
      </main>
      <Footer />
    </>
  );
}
