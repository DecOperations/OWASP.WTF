import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No `output: "standalone"` here.
  //
  // On Vercel, `standalone` is unnecessary (Vercel produces its own optimal
  // output) and can mask static assets if `.next/static` + `public` aren't
  // hand-copied next to `server.js` — which was the original "blank page"
  // production symptom (issue #12).
  //
  // For self-hosted Docker / Fly.io / Render deployments that *do* want
  // the standalone bundle, set NEXT_OUTPUT_STANDALONE=1 at build time:
  //
  //   NEXT_OUTPUT_STANDALONE=1 pnpm --filter @owasp-wtf/web build
  //
  // and remember to copy `.next/static` and `public` into the standalone
  // dir before running `node server.js`.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1"
    ? { output: "standalone" as const }
    : {}),

  // ROADMAP.md and CHANGELOG.md are snapshotted into lib/.generated/ at
  // build time (see scripts/snapshot-content.mjs). This is the safe path
  // because it doesn't depend on `process.cwd()` at request time.
};

export default nextConfig;
