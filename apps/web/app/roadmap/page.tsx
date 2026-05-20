import type { Metadata } from "next";
import Link from "next/link";
import {
  loadRoadmap,
  type PhaseStatus,
  type RoadmapPhase,
} from "../../lib/roadmap";

export const metadata: Metadata = {
  title: "Roadmap — OWASP.WTF",
  description:
    "What's shipped, what's in progress, and what's next for OWASP.WTF.",
};

const STATUS_STYLE: Record<
  PhaseStatus,
  { label: string; badge: string; dot: string; rail: string; description: string }
> = {
  shipped: {
    label: "Shipped",
    badge:
      "text-terminal-green border-terminal-green/40 bg-terminal-green/10",
    dot: "bg-terminal-green",
    rail: "border-terminal-green/40",
    description: "Live in main and published to GitHub Packages.",
  },
  "in-progress": {
    label: "In Progress",
    badge:
      "text-terminal-cyan border-terminal-cyan/40 bg-terminal-cyan/10",
    dot: "bg-terminal-cyan animate-pulse",
    rail: "border-terminal-cyan/40",
    description: "Actively being built. PRs landing.",
  },
  planned: {
    label: "Planned",
    badge:
      "text-terminal-amber border-terminal-amber/40 bg-terminal-amber/10",
    dot: "bg-terminal-amber",
    rail: "border-terminal-amber/40",
    description: "Scoped and queued. Issues filed.",
  },
  exploring: {
    label: "Exploring",
    badge: "text-text-muted border-border-subtle bg-bg-secondary",
    dot: "bg-text-muted",
    rail: "border-border-subtle",
    description: "Under consideration. Open to discussion.",
  },
};

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PendingIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

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
            href="/docs"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
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
            className="text-sm text-terminal-green transition-colors"
          >
            Roadmap
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/DecOperations/OWASP.WTF"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

function PhaseProgress({ phase }: { phase: RoadmapPhase }) {
  const total = phase.items.length;
  const done = phase.items.filter((i) => i.done).length;
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
      <span>
        {done}/{total}
      </span>
      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-primary">
        <div
          className="h-full rounded-full bg-terminal-green transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct}%</span>
    </div>
  );
}

function PhaseCard({ phase }: { phase: RoadmapPhase }) {
  const style = STATUS_STYLE[phase.status];

  return (
    <article
      id={phase.id}
      className={`scroll-mt-24 rounded-2xl border-l-2 border-border-subtle bg-bg-card overflow-hidden ${style.rail}`}
    >
      <header className="border-b border-border-subtle bg-bg-secondary/50 px-6 py-5">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
          {phase.eta && (
            <span className="font-mono text-[11px] text-text-muted">
              ETA <span className="text-text-primary">{phase.eta}</span>
            </span>
          )}
          <div className="ml-auto">
            <PhaseProgress phase={phase} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-text-primary md:text-2xl">
          {phase.name}
        </h2>
        {phase.description && (
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {phase.description}
          </p>
        )}
      </header>

      <ul className="divide-y divide-border-subtle/60">
        {phase.items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 px-6 py-3 transition-colors ${
              item.done ? "text-text-muted" : "text-text-primary"
            }`}
          >
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                item.done
                  ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
                  : "border-border-subtle text-text-muted"
              }`}
            >
              {item.done ? (
                <CheckIcon className="h-3 w-3" />
              ) : (
                <PendingIcon className="h-2.5 w-2.5" />
              )}
            </span>
            <span
              className={`text-sm leading-relaxed ${
                item.done ? "line-through decoration-text-muted/40" : ""
              }`}
            >
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function StatusLegend() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(STATUS_STYLE) as PhaseStatus[]).map((status) => {
        const style = STATUS_STYLE[status];
        return (
          <div
            key={status}
            className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-card p-4"
          >
            <span
              className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${style.dot}`}
            />
            <div>
              <p
                className={`mb-1 inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${style.badge}`}
              >
                {style.label}
              </p>
              <p className="text-xs leading-relaxed text-text-muted">
                {style.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-12 text-center">
      <p className="font-mono text-sm text-text-muted">
        ROADMAP.md not found. Add one at the repo root to populate this page.
      </p>
    </div>
  );
}

export default function RoadmapPage() {
  const phases = loadRoadmap();
  const totalItems = phases.reduce((s, p) => s + p.items.length, 0);
  const shippedItems = phases.reduce(
    (s, p) => s + p.items.filter((i) => i.done).length,
    0,
  );

  return (
    <>
      <Navbar />
      <main className="relative pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-terminal-cyan/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          {/* Header */}
          <header className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-terminal-cyan/20 bg-terminal-cyan/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-cyan animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-terminal-cyan">
                Public Roadmap
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight md:text-6xl">
              Road<span className="text-gradient-green">map</span>
            </h1>
            <p className="max-w-2xl text-lg text-text-muted">
              Where OWASP.WTF is going. Sourced from{" "}
              <code className="font-mono text-terminal-green">ROADMAP.md</code>{" "}
              at the repo root — edit it via PR to propose changes.
            </p>

            {totalItems > 0 && (
              <div className="mt-6 inline-flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-secondary px-4 py-2 font-mono text-sm">
                <span className="text-text-muted">overall:</span>
                <span className="text-terminal-green">
                  {shippedItems}/{totalItems} shipped
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{phases.length} phases</span>
              </div>
            )}
          </header>

          {/* Legend */}
          <section className="mb-10">
            <StatusLegend />
          </section>

          {/* Phases */}
          <div className="space-y-6">
            {phases.length === 0 ? (
              <EmptyState />
            ) : (
              phases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 border-t border-border-subtle/50 pt-8">
            <p className="font-mono text-xs text-text-muted">
              <span className="text-terminal-green">$</span> Want to nudge a
              priority?{" "}
              <a
                href="https://github.com/DecOperations/OWASP.WTF/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-terminal-green"
              >
                Open an issue
              </a>{" "}
              or comment on existing ones.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
