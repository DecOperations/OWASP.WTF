# xCoder + OpenCode GUI Integration Guide

> How to get xCoder running at 100% enforcement in the OWASP.WTF monorepo using the OpenCode GUI for local AI SWE Agent development.

## TL;DR

1. Request alpha access: `hello@decoperations.com` (subject: "xCoder alpha access")
2. Clone + build: `git clone https://github.com/DecOperations/xCoder.WTF.git && pnpm install && pnpm install:local`
3. Attach to OpenCode: `xc flow attach opencode`
4. Refresh guidelines: `xc flow guidelines refresh`
5. Boot OpenCode GUI → every tool call now passes through xCoder's kernel-level guardrails

---

## Prerequisites

- **Node 20+** and **pnpm 9+** (your repo uses `pnpm@9.15.4`)
- **Alpha access** to xCoder (private repo, invite-only until v1)
- **OpenCode Desktop GUI** installed locally
- **gh CLI** installed (for PR backstop automation)

---

## Step 1: Install xCoder (Alpha)

xCoder v0.1 is not yet on npm. Install from the private source repo:

```bash
# Clone the xCoder monorepo (needs alpha access)
git clone https://github.com/DecOperations/xCoder.WTF.git /tmp/xcoder-src
cd /tmp/xcoder-src
pnpm install
pnpm install:local    # builds and runs `npm link`

# Verify
xc --version          # 0.1.0-alpha.0
xcoder --version      # same
```

**Note:** The `xc` and `xcoder` binaries are aliases.

---

## Step 2: Infer Project Guidelines

xCoder analyzes your repo structure to derive enforcement rules:

```bash
cd /path/to/OWASP.WTF

# Infer from package.json, tsconfig, git log, CLAUDE.md, etc.
xc flow guidelines refresh

# Review what was inferred
xc flow guidelines show
```

Expected inferred rules for this monorepo:

```
Resolved guidelines
  source       inferred
  cache file   .xcoder/guidelines.cache.json

specify
    required   true
    spec path  specs/ | docs/

branched
    off        main
    prefix     feat/ | fix/ | docs/ | test/ | chore/

qa
    typecheck  pnpm run typecheck   (turbo typecheck)
    test       pnpm run test        (turbo test)
    lint       pnpm run lint        (turbo lint)

prioritize
    source     github-issues
```

---

## Step 3: Override Guidelines (Pin Monorepo Rules)

The repo `.xcoder/guidelines.yaml` file pins the inferred rules to match our commitlint and security standards:

```yaml
# .xcoder/guidelines.yaml
specify:
  specRequired: true
  specPath: specs/

branched:
  prefix: ['feat/', 'fix/', 'docs/', 'test/', 'chore/']
  off: main

qa:
  typecheck: pnpm run typecheck
  test: pnpm run test
  lint: pnpm run lint

# Pin conventional commit format (from commitlint.config.cjs)
commit:
  conventional: true
  types: ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore']
```

**Config hierarchy:** `guidelines.yaml` beats `guidelines.cache.json` beats defaults.

---

## Step 4: Attach xCoder to OpenCode

This is the critical step for OpenCode GUI enforcement:

```bash
# Writes .opencode/plugins/xcoder.ts
cd /path/to/OWASP.WTF
xc flow attach opencode
```

**What this creates:**

```
.opencode/
└── plugins/
    └── xcoder.ts    # OpenCode plugin that wires xCoder hooks
```

The plugin intercepts every tool invocation in the OpenCode GUI and routes it through xCoder's 15-invariant contract.

### ⚠️ OpenCode Compatibility Matrix

| Mode | Supported? | Notes |
|------|-----------|-------|
| **OpenCode GUI (Desktop)** | ✅ Yes | Full interactive enforcement |
| **OpenCode CLI (TUI)** | ⚠️ Interactive only | Works for manual sessions |
| **OpenCode Autopilot** | ❌ No | TUI never exits — use Claude Code or Codex for autopilot |

**For 100% autonomous enforcement:** Use `xc autopilot` with Claude Code or Codex CLI as the runtime:

```bash
# Autopilot requires Claude Code or Codex (not OpenCode)
xc autopilot start --goal "harden OWASP rule coverage"
```

---

## Step 5: Current `.claude/settings.json` (Post-Migration)

After `xc init --migrate-from unicorn-dev`, the `.claude/settings.json` uses xCoder hooks exclusively:

```json
{
  "version": "0.1.0",
  "xcoder": true,
  "techLevel": "strict",
  "interactionLevel": "yolo",
  "proactivityLevel": "autonomous",
  "workflow": {
    "type": "spec-first",
    "gitFlow": "trunk",
    "commitPerTask": true,
    "qaLoop": {
      "enabled": true,
      "testLocally": true,
      "verifySpec": true,
      "diffReport": true
    }
  },
  "quality": {
    "minQaScore": 85,
    "requireSpecs": true,
    "requireTests": false
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "xc boot",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/branch-guard.js",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/qa-before-commit.js",
            "timeout": 35
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/issue-ref-guard.js",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/session-end-pr-backstop.js",
            "timeout": 60
          }
        ]
      }
    ]
  }
```
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/track-tool-calls.ts",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/qa-after-write.ts",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/qa-before-commit.js",
            "timeout": 35
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/issue-ref-guard.js",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/track-tool-results.ts",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/node_modules/@xcoder/xcoder/dist/hooks/session-end-pr-backstop.js",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Key merge points:**
- **SessionStart:** Unicorn boot runs first, then xCoder boot
- **PreToolUse:** xCoder branch guard runs before Unicorn tracking
- **PreToolUse Bash:** xCoder QA + issue-ref guards added alongside existing Unicorn hooks
- **Stop:** Unicorn results tracking + xCoder PR backstop

---

## Step 6: Configure Merge Gate Policy

Create `.xcoder/merge-policy.yaml` (already in repo) to enforce domain-specific rules:

```yaml
# .xcoder/merge-policy.yaml
zones:
  kernel:
    paths:
      - "packages/cli/src/core/**"
      - "packages/cli/src/orchestrator.ts"
      - "packages/cli/src/adapters/**"
      - "packages/cli/src/types.ts"
    require: human-review              # Security-critical: always human review

  business:
    paths:
      - "apps/**"
      - "packages/*/src/app/**"
    require: gate-pass-or-human        # App logic: gate or human

  docs:
    paths:
      - "docs/**"
      - "**/*.md"
    require: gate-pass                 # Docs: auto-gate is fine

shapes:
  refactor: { evidence: [scope, zone, calibrate-delta] }
  feature:  { evidence: [scope, zone, owasp, preview-smoke] }
  fix:      { evidence: [scope, zone, calibrate-delta] }
  chore:    { evidence: [scope, zone] }
  docs:     { evidence: [scope] }

verdicts:
  thresholds:
    minScopeMatch: 0.85
    maxFindings: 5
    maxKernelChanges: 0
```

**Why this matters:** Changes to `packages/cli/src/core/` (the OWASP rule engine) always require human review. Doc changes can auto-pass.

---

## Step 7: Verify 100% Enforcement

Boot an OpenCode GUI session and test each invariant:

```bash
# 1. Start OpenCode GUI in the repo
cd /path/to/OWASP.WTF
# (launch OpenCode Desktop app, open this folder)
```

### Test Matrix

| Test | Command | Expected Result |
|------|---------|----------------|
| **I-1:** Edit on main | Try `Write` to any file while on `main` | ❌ BLOCKED by no-edit-on-integration |
| **I-2:** Commit on main | `git commit -m "test"` on `main` | ❌ BLOCKED |
| **I-3:** Branch without issue | `git checkout -b feat/test` | ⚠️ BLOCKED until issue exists |
| **I-4:** Bad branch prefix | `git checkout -b random-name` | ❌ BLOCKED by branch-prefix-must-match |
| **I-5:** Spec missing | Commit without spec file | ❌ BLOCKED (if specsRequired) |
| **I-6:** Typecheck failing | Commit with type errors | ❌ BLOCKED by typecheck gate |
| **I-7:** Bad commit format | `git commit -m "bad message"` | ❌ BLOCKED by conventional commit |
| **I-8:** Missing issue ref | `git commit -m "feat: thing"` | ❌ BLOCKED by issue-ref guard |
| **I-9:** No PR at session end | End session with commits, no PR | ⚠️ NOTIFIED / auto-PR (if XCODER_AUTO_PR=1) |

### Bypass Paths (For Legitimate Exceptions)

```bash
# Hotfix on main
XCODER_ALLOW_INTEGRRATION_EDIT=1 git commit -m "fix: critical #123"

# WIP commit (skip typecheck)
XCODER_SKIP_QA_GATE=1 git commit -m "wip: oauth"

# Chore commit without issue
XCODER_SKIP_ISSUE_REF=1 git commit -m "chore: update deps"

# Auto-create PR on session end
export XCODER_AUTO_PR=1
```

Every bypass emits a `flow.bypass` event to `.xcoder/flow-events.jsonl` with the reason and source.

---

## Step 8: Run QA Before Committing

Heavy verification (typecheck, tests) runs out-of-band, not in the synchronous hook:

```bash
# Before each commit cycle
xc qa typecheck          # writes verdict for I-6
xc qa test               # writes verdict for test gate
xc qa lint               # writes verdict for lint gate
xc qa show               # show current verdicts + ages

# Then commit (now allowed)
git commit -m "feat: add A10 logging scanner #142"
```

**Note:** Verdicts expire after 5 minutes. Re-run `xc qa` after each round of edits.

---

## Step 9: Automatic Enforcement in OpenCode GUI

To ensure xCoder is **automatically** active every time you open the OpenCode GUI:

### 1. Plugin Auto-Load

The `.opencode/plugins/xcoder.ts` file created by `xc flow attach opencode` auto-loads when OpenCode starts. No manual step needed.

### 2. Environment Defaults (Optional)

Add to your shell profile for convenience:

```bash
# ~/.zshrc or ~/.bashrc
export XCODER_AUTO_PR=1                    # Auto-open PRs on session end
export XCODER_EVENTS_PATH="$HOME/.xcoder/flow-events.jsonl"
```

### 3. Workspace Settings

Ensure your OpenCode workspace settings point to the repo root where `.opencode/plugins/xcoder.ts` lives.

### 4. Boot Verification

On every session start, xCoder logs a boot event. Check it's working:

```bash
tail -f .xcoder/flow-events.jsonl | jq '{event: .type, phase: .phase}'
```

Expected output on boot:
```json
{"event": "flow.boot", "phase": "idle"}
{"event": "flow.transition", "phase": "scope"}
```

---

## Architecture: How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode GUI Desktop                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  User Input  │───▶│  LLM Agent   │───▶│  Tool Call   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                   │         │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
                    ┌───────────────────────────────▼─────────┐
                    │      .opencode/plugins/xcoder.ts         │
                    │  ┌─────────────────────────────────────┐│
                    │  │  PreToolUse Hook (branch-guard)     ││
                    │  │  PreToolUse Hook (qa-before-commit) ││
                    │  │  PreToolUse Hook (issue-ref-guard)  ││
                    │  │  Stop Hook (session-end-pr-backstop)││
                    │  └─────────────────────────────────────┘│
                    │                   │                     │
                    │         ┌─────────▼──────────┐          │
                    │         │   FlowEngine       │          │
                    │         │  (12 phases,       │          │
                    │         │   5 gates)         │          │
                    │         └─────────┬──────────┘          │
                    └───────────────────┼─────────────────────┘
                                        │
                    ┌───────────────────▼─────────────────────┐
                    │         .xcoder/flow-events.jsonl       │
                    │      (audit trail of all decisions)     │
                    └─────────────────────────────────────────┘
```

**Key principle:** The guardrails are in the kernel (hooks), not in the prompt context. The LLM cannot "forget" or override them.

---

## Troubleshooting

### "xc command not found"

```bash
# Ensure npm global bin is in PATH
export PATH="$PATH:$(npm config get prefix)/bin"

# Or use the full path
node /tmp/xcoder-src/packages/xcoder/dist/cli/index.js --version
```

### "OpenCode plugin not loading"

1. Verify `.opencode/plugins/xcoder.ts` exists
2. Check OpenCode plugin settings → ensure plugins are enabled
3. Restart OpenCode GUI completely

### "Hooks not firing in OpenCode"

OpenCode's plugin API may not support PreToolUse hooks the same way as Claude Code. If enforcement is inconsistent:

**Fallback:** Use Claude Code CLI for full kernel enforcement:
```bash
xc i    # interactive Claude Code with xCoder
```

### "Typecheck hook times out"

The hook has a 35-second budget. For large monorepos:
```bash
# Pre-run typecheck before committing
xc qa typecheck
# The hook then reads the cached verdict instead of re-running
```

---

## Summary Checklist

- [ ] Requested alpha access from `hello@decoperations.com`
- [ ] Installed xCoder: `git clone ... && pnpm install && pnpm install:local`
- [ ] Verified install: `xc --version`
- [ ] Ran: `xc flow guidelines refresh`
- [ ] Reviewed: `xc flow guidelines show`
- [ ] Created: `.xcoder/guidelines.yaml` (monorepo overrides)
- [ ] Created: `.xcoder/merge-policy.yaml` (security zone rules)
- [ ] Attached to OpenCode: `xc flow attach opencode`
- [ ] Verified `.opencode/plugins/xcoder.ts` exists
- [ ] (Optional) Merged xCoder hooks into `.claude/settings.json`
- [ ] Tested all 9 invariants in OpenCode GUI
- [ ] Set `XCODER_AUTO_PR=1` for automatic PR creation
- [ ] Monitoring: `tail -f .xcoder/flow-events.jsonl`

---

## Next Steps

1. **Local Testing:** Boot OpenCode GUI → run the test matrix above
2. **Team Rollout:** Share `.xcoder/guidelines.yaml` and `.xcoder/merge-policy.yaml` (these are tracked in git)
3. **CI Integration:** Pipe `.xcoder/flow-events.jsonl` to your observability stack
4. **Autopilot (Future):** When ready for 24/7 autonomous mode, switch to `xc autopilot` with Claude Code or Codex runtime

---

**Built by:** [DecOperations](https://decoperations.com) · xCoder v0.1 alpha  
**Status:** 11/15 invariants live · 4 kernel hooks shipped · OpenCode (interactive) supported
