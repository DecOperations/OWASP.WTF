import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export type PhaseStatus =
  | "shipped"
  | "in-progress"
  | "planned"
  | "exploring";

export interface RoadmapItem {
  text: string;
  done: boolean;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  status: PhaseStatus;
  eta?: string;
  description?: string;
  items: RoadmapItem[];
}

const STATUS_VALUES: PhaseStatus[] = [
  "shipped",
  "in-progress",
  "planned",
  "exploring",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMeta(line: string): Record<string, string> {
  // Format: <!-- meta: status=in-progress, eta=Q3 2026 -->
  const match = line.match(/<!--\s*meta:\s*(.+?)\s*-->/);
  if (!match) return {};
  const out: Record<string, string> = {};
  for (const pair of match[1].split(",")) {
    const [k, ...rest] = pair.split("=");
    if (k && rest.length) {
      out[k.trim()] = rest.join("=").trim();
    }
  }
  return out;
}

export function parseRoadmap(markdown: string): RoadmapPhase[] {
  const phases: RoadmapPhase[] = [];
  let current: RoadmapPhase | null = null;
  let collectingDescription = false;

  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const phaseMatch = line.match(/^##\s+(.+?)\s*$/);
    if (phaseMatch) {
      const name = phaseMatch[1].trim();
      current = {
        id: slugify(name),
        name,
        status: "planned",
        items: [],
      };
      phases.push(current);
      collectingDescription = true;
      continue;
    }

    if (!current) continue;

    const meta = parseMeta(line);
    if (meta.status && STATUS_VALUES.includes(meta.status as PhaseStatus)) {
      current.status = meta.status as PhaseStatus;
    }
    if (meta.eta) {
      current.eta = meta.eta;
    }
    if (Object.keys(meta).length > 0) continue;

    const itemMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (itemMatch) {
      collectingDescription = false;
      current.items.push({
        done: itemMatch[1].toLowerCase() === "x",
        text: itemMatch[2].trim(),
      });
      continue;
    }

    if (collectingDescription && line.trim().length > 0) {
      const desc = line.trim();
      // Skip status indicator lines like "*Status: shipped*"
      if (!/^\*?(Status|ETA):/i.test(desc)) {
        current.description =
          (current.description ? current.description + " " : "") + desc;
      }
    }
  }

  return phases;
}

export function loadRoadmap(): RoadmapPhase[] {
  const candidates = [
    resolve(process.cwd(), "ROADMAP.md"),
    resolve(process.cwd(), "../../ROADMAP.md"),
    resolve(process.cwd(), "../ROADMAP.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const raw = readFileSync(candidate, "utf-8");
      return parseRoadmap(raw);
    }
  }

  return [];
}
