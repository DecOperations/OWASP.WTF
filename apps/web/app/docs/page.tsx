import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation — OWASP.WTF",
  description:
    "Install and use OWASP.WTF. CLI reference, GitHub Action, AI providers, and configuration.",
};

/* ═══════════════════════════════════════════════════════════════════
   OWASP.WTF Documentation Page
   ═══════════════════════════════════════════════════════════════════ */

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

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
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

const REPO = "https://github.com/DecOperations/OWASP.WTF";
const DOCS = `${REPO}/blob/main/docs`;

const sections: { id: string; title: string }[] = [
  { id: "install", title: "Install" },
  { id: "usage", title: "Usage" },
  { id: "github-action", title: "GitHub Action" },
  { id: "ai", title: "AI providers" },
  { id: "configuration", title: "Configuration" },
  { id: "rules", title: "Rules" },
  { id: "contributing", title: "Contributing" },
];

function Navbar() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border-subtle/50 bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShieldIcon className="h-6 w-6 text-terminal-green" />
          <span className="font-mono text-lg font-bold text-text-primary">
            OWASP<span className="text-terminal-green">.WTF</span>
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            Home
          </Link>
          <Link
            href="/docs"
            className="text-sm text-terminal-green transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/changelog"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            Changelog
          </Link>
          <Link
            href="/roadmap"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            Roadmap
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            GitHub
          </a>
        </div>
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted transition-colors hover:text-text-primary"
        >
          <GithubIcon className="h-5 w-5" />
        </a>
      </div>
    </nav>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-border-subtle bg-bg-secondary p-5 font-mono text-sm leading-relaxed text-text-primary">
      <code>{children}</code>
    </pre>
  );
}

function Card({
  children,
  id,
  title,
  docHref,
}: {
  id: string;
  title: string;
  docHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="reveal scroll-mt-24 rounded-2xl border border-border-subtle bg-bg-card p-8"
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
          {title}
        </h2>
        {docHref && (
          <a
            href={docHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted transition-colors hover:text-terminal-green"
          >
            Full reference
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <div className="space-y-4 text-text-muted leading-relaxed">{children}</div>
    </section>
  );
}

function TableOfContents() {
  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
      <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
        On this page
      </p>
      <ul className="space-y-2.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-sm text-text-muted transition-colors hover:text-terminal-green"
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-xl border border-border-subtle bg-bg-secondary p-4">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-text-muted">
          Source
        </p>
        <a
          href={DOCS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-terminal-green hover:underline"
        >
          docs/ on GitHub
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-subtle/50 bg-bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-12 md:flex-row">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} OWASP.WTF. Released under the MIT
          License.
        </p>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
          >
            Home
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <header className="reveal mb-16 max-w-3xl">
            <p className="mb-3 font-mono text-sm font-medium uppercase tracking-wider text-terminal-green">
              Documentation
            </p>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
              Install. Scan.{" "}
              <span className="text-gradient-green">Ship secure.</span>
            </h1>
            <p className="text-lg leading-relaxed text-text-muted">
              Everything you need to wire OWASP.WTF into your workflow — locally,
              in CI, or as a GitHub Action. Full markdown reference lives in
              the{" "}
              <a
                href={DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-green hover:underline"
              >
                <code>docs/</code> directory
              </a>{" "}
              on GitHub.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-[1fr_220px] lg:gap-16">
            {/* Content */}
            <div className="space-y-8">
              {/* Install */}
              <Card
                id="install"
                title="Install"
                docHref={`${DOCS}/installation.md`}
              >
                <p>
                  OWASP.WTF runs on <strong className="text-text-primary">Node.js 20+</strong>.
                </p>
                <p className="mt-4 font-semibold text-text-primary">One-shot</p>
                <Code>{`npx owasp-wtf`}</Code>
                <p className="font-semibold text-text-primary">Global install</p>
                <Code>{`npm install -g owasp-wtf
owasp-wtf --version`}</Code>
                <p className="font-semibold text-text-primary">GitHub Action</p>
                <Code>{`- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    severity: high
    fail-on-findings: true`}</Code>
              </Card>

              {/* Usage */}
              <Card id="usage" title="Usage" docHref={`${DOCS}/usage.md`}>
                <Code>{`owasp-wtf [directory] [options]`}</Code>
                <p>Common flags:</p>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    <code className="text-terminal-green">-f, --format</code>{" "}
                    — <code>terminal</code>, <code>json</code>, or{" "}
                    <code>html</code>
                  </li>
                  <li>
                    <code className="text-terminal-green">-o, --output</code>{" "}
                    — write the report to a file
                  </li>
                  <li>
                    <code className="text-terminal-green">-s, --severity</code>{" "}
                    — <code>critical</code>, <code>high</code>,{" "}
                    <code>medium</code>, <code>low</code>, <code>info</code>
                  </li>
                  <li>
                    <code className="text-terminal-green">-i, --ignore</code>{" "}
                    — comma-separated ignore globs
                  </li>
                  <li>
                    <code className="text-terminal-green">--ai</code> — enable
                    AI-assisted analysis
                  </li>
                  <li>
                    <code className="text-terminal-green">--setup</code> — run
                    the AI provider wizard
                  </li>
                </ul>
                <p className="mt-4 font-semibold text-text-primary">Examples</p>
                <Code>{`# Quick local scan
owasp-wtf

# Limit to high-severity findings, write JSON
owasp-wtf ./src -s high -f json -o report.json

# AI-assisted, ignore tests and generated code
owasp-wtf --ai -i "**/*.test.ts,**/__generated__/**"

# HTML report for sharing
owasp-wtf -f html -o report.html`}</Code>
              </Card>

              {/* GitHub Action */}
              <Card
                id="github-action"
                title="GitHub Action"
                docHref={`${DOCS}/github-action.md`}
              >
                <p>
                  The reusable composite action installs the CLI, runs a scan,
                  and uploads the report as a workflow artifact.
                </p>
                <Code>{`name: Security
on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: decoperations/owasp.wtf@v1
        with:
          severity: high
          fail-on-findings: true`}</Code>
                <p>Inputs include:</p>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    <code className="text-terminal-green">directory</code> —
                    path to scan (default <code>.</code>)
                  </li>
                  <li>
                    <code className="text-terminal-green">severity</code>,{" "}
                    <code className="text-terminal-green">format</code>,{" "}
                    <code className="text-terminal-green">output</code>,{" "}
                    <code className="text-terminal-green">ignore</code> — same
                    semantics as the CLI flags
                  </li>
                  <li>
                    <code className="text-terminal-green">fail-on-findings</code>{" "}
                    — fail the workflow when findings ≥ severity exist
                  </li>
                  <li>
                    <code className="text-terminal-green">version</code> — pin a
                    CLI version
                  </li>
                  <li>
                    <code className="text-terminal-green">upload-artifact</code>,{" "}
                    <code className="text-terminal-green">artifact-name</code> —
                    artifact upload
                  </li>
                </ul>
                <p>
                  Outputs:{" "}
                  <code className="text-terminal-green">report-path</code> and{" "}
                  <code className="text-terminal-green">findings</code>.
                </p>
              </Card>

              {/* AI providers */}
              <Card id="ai" title="AI providers" docHref={`${DOCS}/ai-providers.md`}>
                <p>
                  <code className="text-terminal-green">--ai</code> needs a
                  provider configured. Run{" "}
                  <code className="text-terminal-green">owasp-wtf --setup</code>{" "}
                  for an interactive wizard.
                </p>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    <strong className="text-text-primary">Claude Code CLI</strong>{" "}
                    — uses your existing <code>claude</code> session
                  </li>
                  <li>
                    <strong className="text-text-primary">Codex CLI</strong> —
                    uses your existing <code>codex</code> session
                  </li>
                  <li>
                    <strong className="text-text-primary">Anthropic API</strong>{" "}
                    — <code>ANTHROPIC_API_KEY</code>
                  </li>
                  <li>
                    <strong className="text-text-primary">OpenAI API</strong> —{" "}
                    <code>OPENAI_API_KEY</code>
                  </li>
                  <li>
                    <strong className="text-text-primary">Ollama</strong> —
                    local models, no key required
                  </li>
                </ul>
                <p>
                  Privacy: only snippets around each finding are sent to your
                  chosen provider, not the entire codebase. For air-gapped use,
                  pick Ollama or skip <code>--ai</code> entirely.
                </p>
              </Card>

              {/* Configuration */}
              <Card
                id="configuration"
                title="Configuration"
                docHref={`${DOCS}/configuration.md`}
              >
                <p>
                  Config lives in{" "}
                  <code className="text-terminal-green">
                    ~/.owasp-wtf/config.json
                  </code>{" "}
                  and stores your AI provider, model, and (optionally) an API
                  key. Recommended: keep keys in the environment with{" "}
                  <code>{`"apiKey": "env"`}</code>.
                </p>
                <Code>{`{
  "version": 1,
  "ai": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKey": "env"
  }
}`}</Code>
              </Card>

              {/* Rules */}
              <Card id="rules" title="Detection rules" docHref={`${DOCS}/rules.md`}>
                <p>
                  Static rules cover A01, A02, A03, A05, A07, A09. Remaining
                  categories (A04, A06, A08, A10) surface through AI-assisted
                  analysis. New rules live in{" "}
                  <a
                    href={`${REPO}/tree/main/packages/cli/src/rules`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-green hover:underline"
                  >
                    <code>packages/cli/src/rules/</code>
                  </a>
                  .
                </p>
                <p>
                  Found a false positive or missing case?{" "}
                  <a
                    href={`${REPO}/issues/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-green hover:underline"
                  >
                    Open an issue
                  </a>{" "}
                  with a minimal repro.
                </p>
              </Card>

              {/* Contributing */}
              <Card
                id="contributing"
                title="Contributing"
                docHref={`${REPO}/blob/main/CONTRIBUTING.md`}
              >
                <p>
                  PRs welcome. See{" "}
                  <a
                    href={`${REPO}/blob/main/CONTRIBUTING.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-green hover:underline"
                  >
                    <code>CONTRIBUTING.md</code>
                  </a>{" "}
                  for dev setup, repo layout, and how to add a detection rule.
                </p>
                <Code>{`git clone https://github.com/DecOperations/OWASP.WTF.git
cd OWASP.WTF
pnpm install
pnpm build
node packages/cli/dist/index.js .`}</Code>
              </Card>
            </div>

            {/* TOC */}
            <TableOfContents />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
