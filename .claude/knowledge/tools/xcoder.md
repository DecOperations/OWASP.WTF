# xCoder (xc)

> Deterministic SWE agent supervisor — kernel-level guardrails for AI coding agents.

## What It Is

xCoder wraps coding agents (Claude Code, Cursor, Codex, OpenCode, Zed) with a deterministic FlowEngine and mechanical guardrails. It prevents agents from committing to main, skipping PRs, or bypassing QA.

**Three layers:**
1. **Hooks** — PreToolUse/Stop interceptors that block bad actions at the kernel level
2. **FlowEngine** — Typed 12-phase state machine with acceptance gates
3. **Autopilot** — Continuous autonomous loop for 24/7 development

## Status

- **Version:** 0.1.0-alpha.0
- **Availability:** Private alpha (DecOperations internal access)
- **Runtime support:** Claude Code (full), Cursor (full), Codex (full), OpenCode (interactive only), Zed (in flight)

## In This Environment

```
xc CLI:    /Users/jeremy/.volta/bin/xc (v0.1.0)
Repo:      DecOperations/xCoder.WTF (access: yes)
Binary:    xc / xcoder (aliases)
```

## Architecture

```
User/LLM → Tool Call Intent
              ↓
    PreToolUse Hook (kernel-level block/allow)
              ↓
    FlowEngine.acceptance() (deterministic gates)
              ↓
    Tool executes OR Block (exit 2)
              ↓
    flow-events.jsonl (audit trail)
```

## The 15 Invariants

| ID | Invariant | Enforced By | Strength |
|----|-----------|-------------|----------|
| I-1 | No edits on integration branch | no-edit-on-integration hook | strong |
| I-2 | No commit/push on integration | no-edit-on-integration hook | strong |
| I-3 | Issue exists before branch | engine acceptance | strong |
| I-4 | Branch matches prefix | engine acceptance | strong |
| I-5 | Spec exists if required | engine acceptance | medium |
| I-6 | Typecheck passes before commit | typecheck-must-pass hook | strong |
| I-7 | Conventional commit format | engine acceptance | strong |
| I-8 | Commit refs tracking issue | commit-must-reference-issue | medium |
| I-9 | PR opened before "done" | session-end-pr-backstop | strong |
| I-10 | Removals match intent | merge-gate analyzer | strong |
| I-11 | Autopilot through FlowEngine | autopilot adapter | deterministic |
| I-12 | All tool calls observable | track-tool-calls | strong |
| I-13 | Every bypass logged | structural flow.bypass | strong |
| I-14 | Questions never block queue | supervisor protocol | post-v1 |
| I-15 | Resource caps honored | supervisor protocol | post-v1 |

## Usage

```bash
# Interactive session (with guardrails)
xc i

# Attach flow to a specific runtime
xc flow attach claude-code
xc flow attach opencode
xc flow attach cursor

# Refresh inferred guidelines
cd ~/code/project
xc flow guidelines refresh
xc flow guidelines show

# Run QA before committing
xc qa typecheck
xc qa test
xc qa lint
xc qa show

# Autopilot (Claude Code / Codex only; NOT OpenCode)
xc autopilot start --goal "implement feature X"
```

## Bypass Environment Variables

```bash
XCODER_ALLOW_INTEGRATION_EDIT=1   # Hotfix on main (I-1, I-2)
XCODER_SKIP_QA_GATE=1              # Skip typecheck gate (I-6)
XCODER_SKIP_ISSUE_REF=1            # Skip issue reference (I-8)
XCODER_AUTO_PR=1                   # Auto-create PR on session end (I-9)
```

All bypasses emit `flow.bypass` events with reason + source.

## Files in This Repo

| File | Purpose |
|------|---------|
| `.xcoder/guidelines.yaml` | Monorepo-specific rules (tracked) |
| `.xcoder/merge-policy.yaml` | Merge gate zonal enforcement (tracked) |
| `.xcoder/guidelines.cache.json` | Inferred rules cache (gitignored) |
| `.xcoder/flow-events.jsonl` | Audit log of all flow events (gitignored) |
| `docs/xcoder-opencode-integration.md` | Full integration guide (tracked) |

## Guideline Hierarchy

Config priority (highest to lowest):
1. `.xcoder/guidelines.yaml` — explicit overrides (tracked, shared)
2. `.xcoder/guidelines.cache.json` — inferred from repo (gitignored, local)
3. Built-in defaults

## Merge Policy Zones

Zones defined in `.xcoder/merge-policy.yaml`:

- **kernel** (packages/cli/src/core/, adapters, orchestrator): ALWAYS human review
- **infra** (.github/, turbo.json, scripts): gate-pass or human
- **business** (apps/, UI): gate-pass
- **tests** (*.test.ts, fixtures): gate-pass
- **docs** (*.md, docs/): gate-pass

## OpenCode Compatibility

| Mode | Status | Notes |
|------|--------|-------|
| OpenCode GUI Desktop | ✅ Supported | Full interactive enforcement via plugin |
| OpenCode CLI (TUI) | ⚠️ Interactive only | Works for manual sessions |
| OpenCode Autopilot | ❌ Not supported | TUI never exits; use Claude Code for autopilot |

## Key Principle

> **Mechanism, not vibes.** The guardrails are in the kernel (hooks), not the prompt context. The LLM cannot "forget" or override them.

## Links

- Docs: https://xcoder.wtf/docs
- Repo: https://github.com/DecOperations/xCoder.WTF
- Invariants: https://xcoder.wtf/docs/invariants
- Hooks: https://xcoder.wtf/docs/hooks
