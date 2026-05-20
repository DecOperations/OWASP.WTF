import type { Metadata } from "next";
import Link from "next/link";
import {
  loadChangelog,
  type ChangelogRelease,
  type ChangelogSectionKind,
  type ReleaseClass,
} from "../../lib/changelog";

export const metadata: Metadata = {
  title: "Changelog — OWASP.WTF",
  description:
    "Every release of OWASP.WTF. Automated via Conventional Commits and semantic-release.",
};

const SECTION_STYLE: Record<
  ChangelogSectionKind,
  { label: string; accent: string; dot: string }
> = {
  features: {
    label: "Features",
    accent: "text-terminal-green border-terminal-green/30 bg-terminal-green/5",
    dot: "bg-terminal-green",
  },
  fixes: {
    label: "Bug Fixes",
    accent: "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/5",
    dot: "bg-terminal-amber",
  },
  security: {
    label: "Security",
    accent: "text-terminal-red border-terminal-red/30 bg-terminal-red/5",
    dot: "bg-terminal-red",
  },
  performance: {
    label: "Performance",
    accent: "text-terminal-cyan border-terminal-cyan/30 bg-terminal-cyan/5",
    dot: "bg-terminal-cyan",
  },
  refactor: {
    label: "Refactoring",
    accent: "text-text-muted border-border-subtle bg-bg-secondary",
    dot: "bg-text-muted",
  },
  build: {
    label: "Build",
    accent: "text-text-muted border-border-subtle bg-bg-secondary",
    dot: "bg-text-muted",
  },
  reverts: {
    label: "Reverts",
    accent: "text-text-muted border-border-subtle bg-bg-secondary",
    dot: "bg-text-muted",
  },
  breaking: {
    label: "Breaking Changes",
    accent: "text-terminal-red border-terminal-red/40 bg-terminal-red/10",
    dot: "bg-terminal-red",
  },
  other: {
    label: "Other",
    accent: "text-text-muted border-border-subtle bg-bg-secondary",
    dot: "bg-text-muted",
  },
};

const RELEASE_BADGE: Record<ReleaseClass, { label: string; cls: string }> = {
  major: {
    label: "MAJOR",
    cls: "text-terminal-red border-terminal-red/40 bg-terminal-red/10",
  },
  minor: {
    label: "MINOR",
    cls: "text-terminal-green border-terminal-green/40 bg-terminal-green/10",
  },
  patch: {
    label: "PATCH",
    cls: "text-terminal-cyan border-terminal-cyan/40 bg-terminal-cyan/10",
  },
  prerelease: {
    label: "PRERELEASE",
    cls: "text-terminal-amber border-terminal-amber/40 bg-terminal-amber/10",
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

function CommitIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <line x1="1.05" y1="12" x2="7" y2="12" />
      <line x1="17.01" y1="12" x2="22.96" y2="12" />
    </svg>
  );
}

function CompareIcon({ className }: { className?: string }) {
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
      <polyline points="17 11 21 7 17 3" />
      <line x1="21" y1="7" x2="9" y2="7" />
      <polyline points="7 13 3 17 7 21" />
      <line x1="15" y1="17" x2="3" y2="17" />
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
            className="text-sm text-terminal-green transition-colors"
          >
            Changelog
          </Link>
          <Link
            href="/roadmap"
            className="text-sm text-text-muted transition-colors hover:text-terminal-green"
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

function VersionSidebar({ releases }: { releases: ChangelogRelease[] }) {
  return (
    <aside className="hidden lg:block lg:w-56 lg:shrink-0">
      <div className="sticky top-24">
        <p className="mb-4 font-mono text-xs uppercase tracking-wider text-text-muted">
          Versions
        </p>
        <ul className="space-y-1 border-l border-border-subtle">
          {releases.map((release, i) => {
            const badge = RELEASE_BADGE[release.releaseClass];
            return (
              <li key={release.version}>
                <a
                  href={`#v${release.version}`}
                  className="group block border-l-2 border-transparent pl-4 py-1.5 -ml-px text-sm text-text-muted transition-all hover:border-terminal-green hover:text-text-primary"
                >
                  <span className="font-mono">{release.version}</span>
                  {i === 0 && (
                    <span className="ml-2 inline-flex items-center rounded-sm border border-terminal-green/40 bg-terminal-green/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-terminal-green">
                      Latest
                    </span>
                  )}
                  <span
                    className={`ml-1 inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  {release.date && (
                    <p className="mt-0.5 font-mono text-[10px] text-text-muted/70">
                      {release.date}
                    </p>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function ReleaseCard({
  release,
  isLatest,
}: {
  release: ChangelogRelease;
  isLatest: boolean;
}) {
  const badge = RELEASE_BADGE[release.releaseClass];

  return (
    <article
      id={`v${release.version}`}
      className="scroll-mt-24 rounded-2xl border border-border-subtle bg-bg-card overflow-hidden"
    >
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary/50 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-mono text-2xl font-bold text-text-primary">
            <span className="text-terminal-green">v</span>
            {release.version}
          </h2>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badge.cls}`}
          >
            {badge.label}
          </span>
          {isLatest && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-terminal-green/40 bg-terminal-green/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-terminal-green">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-green animate-pulse" />
              Latest
            </span>
          )}
          {release.date && (
            <span className="ml-auto font-mono text-xs text-text-muted">
              {release.date}
            </span>
          )}
        </div>

        {release.compareUrl && (
          <a
            href={release.compareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-text-muted transition-colors hover:text-terminal-green"
          >
            <CompareIcon className="h-3.5 w-3.5" />
            view diff on github
          </a>
        )}
      </header>

      {/* Sections */}
      <div className="divide-y divide-border-subtle">
        {release.sections.length === 0 && (
          <p className="px-6 py-8 text-sm text-text-muted">
            No changes documented for this release.
          </p>
        )}
        {release.sections.map((section) => {
          const style = SECTION_STYLE[section.kind];
          return (
            <section key={section.title} className="px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <h3
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${style.accent}`}
                >
                  {style.label}
                </h3>
                <span className="font-mono text-xs text-text-muted">
                  {section.entries.length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {section.entries.map((entry, i) => (
                  <li
                    key={`${entry.commitSha ?? i}`}
                    className="flex flex-wrap items-start gap-x-3 gap-y-1"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border-subtle" />
                    <div className="flex-1 min-w-0">
                      {entry.scope && (
                        <span className="mr-2 inline-flex items-center rounded border border-terminal-cyan/30 bg-terminal-cyan/5 px-1.5 py-0.5 font-mono text-[10px] text-terminal-cyan">
                          {entry.scope}
                        </span>
                      )}
                      {entry.breaking && (
                        <span className="mr-2 inline-flex items-center rounded border border-terminal-red/40 bg-terminal-red/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-terminal-red">
                          Breaking
                        </span>
                      )}
                      <span className="text-sm text-text-primary leading-relaxed">
                        {entry.description}
                      </span>
                      {(entry.commitSha || entry.prNumber) && (
                        <span className="ml-2 inline-flex items-center gap-2 font-mono text-[11px] text-text-muted">
                          {entry.commitSha && entry.commitUrl && (
                            <a
                              href={entry.commitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 transition-colors hover:text-terminal-green"
                            >
                              <CommitIcon className="h-3 w-3" />
                              {entry.commitSha}
                            </a>
                          )}
                          {entry.prNumber && entry.prUrl && (
                            <a
                              href={entry.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="transition-colors hover:text-terminal-green"
                            >
                              #{entry.prNumber}
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-card p-12 text-center">
      <p className="font-mono text-sm text-text-muted">
        No releases yet. semantic-release will populate this page automatically
        on the next merge to <code className="text-terminal-green">main</code>.
      </p>
    </div>
  );
}

export default function ChangelogPage() {
  const releases = loadChangelog();
  const latestStable = releases.find((r) => r.releaseClass !== "prerelease");

  return (
    <>
      <Navbar />
      <main className="relative pt-32 pb-24">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-terminal-green/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          {/* Header */}
          <header className="mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-terminal-green/20 bg-terminal-green/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-green animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-terminal-green">
                Auto-generated from Conventional Commits
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight md:text-6xl">
              Change<span className="text-gradient-green">log</span>
            </h1>
            <p className="max-w-2xl text-lg text-text-muted">
              Every release of OWASP.WTF, generated automatically by{" "}
              <code className="font-mono text-terminal-green">
                semantic-release
              </code>{" "}
              from Conventional Commits on every merge to main.
            </p>

            {latestStable && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-secondary px-4 py-2 font-mono text-sm">
                <span className="text-text-muted">latest:</span>
                <a
                  href={`#v${latestStable.version}`}
                  className="text-terminal-green hover:underline"
                >
                  v{latestStable.version}
                </a>
                {latestStable.date && (
                  <span className="text-text-muted">· {latestStable.date}</span>
                )}
              </div>
            )}
          </header>

          {/* Body */}
          <div className="flex gap-12">
            <VersionSidebar releases={releases} />

            <div className="flex-1 min-w-0 space-y-6">
              {releases.length === 0 ? (
                <EmptyState />
              ) : (
                releases.map((release, i) => (
                  <ReleaseCard
                    key={release.version}
                    release={release}
                    isLatest={i === 0}
                  />
                ))
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-16 border-t border-border-subtle/50 pt-8">
            <p className="font-mono text-xs text-text-muted">
              <span className="text-terminal-green">$</span> See{" "}
              <a
                href="https://github.com/DecOperations/OWASP.WTF/blob/main/RELEASING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-terminal-green"
              >
                RELEASING.md
              </a>{" "}
              for the full automation flow and Conventional Commits →
              version-bump table.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
