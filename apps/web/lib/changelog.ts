import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type ChangelogSectionKind =
  | "features"
  | "fixes"
  | "security"
  | "performance"
  | "refactor"
  | "build"
  | "reverts"
  | "breaking"
  | "other";

export interface ChangelogEntry {
  description: string;
  scope?: string;
  commitSha?: string;
  commitUrl?: string;
  prNumber?: string;
  prUrl?: string;
  breaking: boolean;
}

export interface ChangelogSection {
  kind: ChangelogSectionKind;
  title: string;
  entries: ChangelogEntry[];
}

export type ReleaseClass = "major" | "minor" | "patch" | "prerelease";

export interface ChangelogRelease {
  version: string;
  date?: string;
  releaseClass: ReleaseClass;
  link?: string;
  compareUrl?: string;
  sections: ChangelogSection[];
  totalEntries: number;
}

const SECTION_KINDS: Record<string, ChangelogSectionKind> = {
  features: "features",
  "bug fixes": "fixes",
  fixes: "fixes",
  security: "security",
  performance: "performance",
  "performance improvements": "performance",
  refactor: "refactor",
  refactoring: "refactor",
  "code refactoring": "refactor",
  build: "build",
  "build system": "build",
  reverts: "reverts",
  "breaking changes": "breaking",
};

function classifySection(rawTitle: string): {
  kind: ChangelogSectionKind;
  title: string;
} {
  const normalized = rawTitle.trim().toLowerCase();
  const kind = SECTION_KINDS[normalized] ?? "other";
  return { kind, title: rawTitle.trim() };
}

function parseEntry(line: string): ChangelogEntry | null {
  const stripped = line.replace(/^[*-]\s+/, "").trim();
  if (!stripped) return null;

  let body = stripped;
  let breaking = false;

  if (/^\*\*BREAKING( CHANGES?)?\*\*:?/i.test(body)) {
    breaking = true;
    body = body.replace(/^\*\*BREAKING( CHANGES?)?\*\*:?\s*/i, "");
  }

  let scope: string | undefined;
  const scopeMatch = body.match(/^\*\*([^*]+):\*\*\s+(.*)$/);
  if (scopeMatch) {
    scope = scopeMatch[1].trim();
    body = scopeMatch[2];
  }

  let commitSha: string | undefined;
  let commitUrl: string | undefined;
  const commitMatch = body.match(
    /\s*\(\[([0-9a-f]{6,40})\]\((https?:\/\/[^)]+)\)\)\s*$/i,
  );
  if (commitMatch) {
    commitSha = commitMatch[1].slice(0, 7);
    commitUrl = commitMatch[2];
    body = body.slice(0, commitMatch.index).trim();
  }

  let prNumber: string | undefined;
  let prUrl: string | undefined;
  const prMatch = body.match(/\(\[#(\d+)\]\((https?:\/\/[^)]+)\)\)/);
  if (prMatch) {
    prNumber = prMatch[1];
    prUrl = prMatch[2];
    body = body.replace(prMatch[0], "").trim();
  }

  return {
    description: body.replace(/\s+/g, " ").trim(),
    scope,
    commitSha,
    commitUrl,
    prNumber,
    prUrl,
    breaking,
  };
}

function classifyVersion(version: string): ReleaseClass {
  if (/-(alpha|beta|rc|canary|pr|nightly)/i.test(version)) return "prerelease";
  const cleaned = version.replace(/^v/, "").split(/[-+]/)[0];
  const [major = 0, minor = 0, patch = 0] = cleaned
    .split(".")
    .map((n) => parseInt(n, 10));
  if (patch !== 0) return "patch";
  if (minor !== 0) return "minor";
  if (major !== 0) return "major";
  return "patch";
}

export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let current: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // Forms:
      //   ## [0.2.0](compareUrl) (2026-05-20)
      //   ## 0.2.0 (2026-05-20)
      //   ## 1.0.0
      const header = line.slice(3).trim();
      const linkMatch = header.match(
        /^\[([^\]]+)\]\(([^)]+)\)\s*(?:\(([^)]+)\))?\s*$/,
      );
      const plainMatch = header.match(/^([^\s(]+)\s*(?:\(([^)]+)\))?\s*$/);

      let version: string | undefined;
      let compareUrl: string | undefined;
      let date: string | undefined;

      if (linkMatch) {
        version = linkMatch[1];
        compareUrl = linkMatch[2];
        date = linkMatch[3];
      } else if (plainMatch) {
        version = plainMatch[1];
        date = plainMatch[2];
      }

      if (version) {
        current = {
          version,
          date,
          compareUrl,
          releaseClass: classifyVersion(version),
          sections: [],
          totalEntries: 0,
        };
        currentSection = null;
        releases.push(current);
        continue;
      }
    }

    const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
    if (sectionMatch && current) {
      const { kind, title } = classifySection(sectionMatch[1]);
      currentSection = { kind, title, entries: [] };
      current.sections.push(currentSection);
      continue;
    }

    if ((line.startsWith("* ") || line.startsWith("- ")) && currentSection) {
      const entry = parseEntry(line);
      if (entry) {
        currentSection.entries.push(entry);
        if (current) current.totalEntries += 1;
      }
    }
  }

  return releases;
}

export function loadChangelog(): ChangelogRelease[] {
  const candidates = [
    resolve(process.cwd(), "CHANGELOG.md"),
    resolve(process.cwd(), "../../CHANGELOG.md"),
    resolve(process.cwd(), "../CHANGELOG.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const raw = readFileSync(candidate, "utf-8");
      return parseChangelog(raw);
    }
  }

  return [];
}
