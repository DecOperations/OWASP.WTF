#!/usr/bin/env node
/**
 * Snapshots repo-root markdown into apps/web/lib/.generated/ so the web
 * app can read them via deterministic relative paths instead of
 * `process.cwd()`-based lookups that break under different deploy modes
 * (Vercel monorepo, standalone, Docker, …).
 *
 * Runs as a prebuild step from apps/web/package.json.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, "..");
const repoRoot = resolve(webRoot, "../..");
const outDir = resolve(webRoot, "lib/.generated");

mkdirSync(outDir, { recursive: true });

/** Source path → output filename. Order matters: first hit wins. */
const sources = [
  { name: "ROADMAP.md", search: [
      resolve(repoRoot, "ROADMAP.md"),
      resolve(webRoot, "ROADMAP.md"),
    ],
    fallback: "# Roadmap\n\nROADMAP.md not found at build time.\n",
  },
  { name: "CHANGELOG.md", search: [
      resolve(repoRoot, "CHANGELOG.md"),
      resolve(repoRoot, "packages/cli/CHANGELOG.md"),
      resolve(webRoot, "CHANGELOG.md"),
    ],
    fallback: "# Changelog\n\nCHANGELOG.md not found at build time.\n",
  },
];

let snapshotted = 0;
for (const src of sources) {
  let content = src.fallback;
  let from = "(fallback)";
  for (const candidate of src.search) {
    if (existsSync(candidate)) {
      content = readFileSync(candidate, "utf-8");
      from = candidate;
      break;
    }
  }
  const dest = resolve(outDir, src.name);
  writeFileSync(dest, content, "utf-8");
  console.log(`[content-snapshot] ${src.name} ← ${from} (${content.length} bytes)`);
  snapshotted++;
}

console.log(`[content-snapshot] wrote ${snapshotted} file(s) to ${outDir}`);
