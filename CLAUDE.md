# OWASP.WTF

> Project context and instructions for Claude Code.

---

## ⚡ xCoder Framework

This project uses **xCoder** (v0.1.0-alpha.0) for deterministic, kernel-level SWE agent enforcement.

**Docs:** https://xcoder.wtf/docs  
**Repo:** https://github.com/DecOperations/xCoder.WTF  
**CLI:** `xc` / `xcoder`

### Philosophy

> **Mechanism, not vibes.** Guardrails are in the kernel, not the prompt context. The LLM cannot "forget" or override them.

xCoder intercepts every tool call at the PreToolUse/Stop layer. Exit code 2 = blocked. There is no "I forgot."

### Standard Workflow (SDLC)

```
IDLE → SPECIFY → PRIORITIZE → SCOPED → BRANCHED → QA → MAINTAIN
         ↑          │           │          │       │      │
         │          └───────────┴──────────┘       │      │
         │                                          │      │
         └──── (policy blocks on bad transitions) ──┘      │
                                                            │
   I-1 / I-2: no edits on integration branch               │
   I-3: tracking issue required                            │
   I-4: branch prefix must match                           │
   I-6: typecheck must pass                                │
   I-7: conventional commit format                         │
   I-8: commit must reference issue                         │
   I-9: PR required before "done"                          │
```

### Key Files (Read These)

| File | Purpose |
|------|---------|
| `.xcoder/guidelines.yaml` | Monorepo-specific workflow rules |
| `.xcoder/merge-policy.yaml` | Merge gate zonal enforcement |
| `.opencode/plugins/xcoder.ts` | OpenCode GUI standalone plugin (558 lines, zero deps) |
| `.claude/settings.json` | Project-specific agent configuration |
| `.claude/knowledge/index.json` | Known technologies registry |
| `docs/xcoder-opencode-integration.md` | Full integration guide |

### Settings Summary

Settings in `.claude/settings.json` control behavior:

- **techLevel**: `hardcore` (5/5) / `strict` (4/5) / `relaxed` (3/5) / `lenient` (2/5) / `sloppy` (1/5)
- **proactivityLevel**: `autonomous` (5/5) / `proactive` (4/5) / `careful` (3/5) / `cautious` (2/5) / `paranoid` (1/5)
- **metaCognition.enabled**: Self-monitoring for loops and blockers
- **learning.enabled**: Auto-document new technologies
- **quality.minQaScore**: Minimum QA score (default: 85)
- **quality.thresholds**: Scoped quality thresholds (spec coverage, impl complete, test coverage, QA)

### Bypass Paths (Use Sparingly)

Every bypass emits a `flow.bypass` event to `.xcoder/flow-events.jsonl`:

- `XCODER_ALLOW_INTEGRATION_EDIT=1` — Hotfix on main (I-1, I-2)
- `XCODER_SKIP_QA_GATE=1` — Skip typecheck gate (I-6)
- `XCODER_SKIP_ISSUE_REF=1` — Skip issue reference (I-8)
- `XCODER_AUTO_PR=1` — Auto-create PR on session end (I-9)
- `git commit --no-verify` — Standard git escape hatch


---

## ⚠️ MANDATORY ENFORCEMENT (READ FIRST)

**This section is NON-NEGOTIABLE. Execute these checks AUTOMATICALLY.**

### 🔴 ON EVERY SESSION START (BOOT)

Before responding to ANY user message, you MUST:

```
1. READ .claude/settings.json → Apply all settings
2. READ .claude/knowledge/index.json → Load known technologies
3. CHECK git status → Note current branch and state
4. LOG session start in .claude/logs/session-{date}.jsonl
```

If any file is missing, CREATE it with defaults.

### 🔴 ON EVERY 10 TOOL CALLS (CHECKPOINT)

After every 10 tool calls, STOP and verify:

```
□ Am I making progress? (If NO → Reflect)
□ Have I repeated any search 3+ times? (If YES → STOP, try different approach)
□ Have I hit the same error 3+ times? (If YES → STOP, diagnose root cause)
□ Am I working on too many files? (If 5+ open → Focus on ONE)
```

If ANY check fails: **STOP. Do not continue. Reflect and fix first.**

### 🔴 ON EVERY FILE WRITE/EDIT (QUALITY)

After writing or editing code files:

```
□ Run qa_score_file on the file (target: 85+)
□ If score < 85 → Fix before proceeding
□ Log file change in .claude/logs/changes.jsonl
```

### 🔴 ON UNKNOWN TECHNOLOGY (LEARN)

When encountering technology not in `.claude/knowledge/index.json`:

```
1. STOP current task
2. Research the technology (docs, best practices)
3. CREATE .claude/knowledge/{category}/{name}.md
4. UPDATE .claude/knowledge/index.json
5. NOTIFY user: "📚 Learned: {name}"
6. RESUME task with new knowledge
```

### 🔴 ON TASK COMPLETION (VERIFY)

Before saying a task is done:

```
□ Build passes? (pnpm build / cargo build)
□ Types check? (tsc --noEmit)
□ QA scores ≥ 85 on changed files?
□ No regressions? (existing tests pass)
□ Acceptance criteria met?
```

If ANY check fails: **Task is NOT done. Fix first.**

### 🔴 SEARCH LOOP RECOVERY

If you've searched for the same thing 3+ times:

```
STOP searching. Instead:
1. Read package.json to see what libraries exist
2. List the directory structure: ls -la
3. Read the entry point file
4. Follow imports systematically
5. If still stuck, ASK user for guidance
```

### 🔴 ERROR LOOP RECOVERY

If you've hit the same error 3+ times:

```
STOP retrying. Instead:
1. Log the error clearly
2. Ask: "What assumption am I making that's wrong?"
3. Try a DIFFERENT approach, not the same one again
4. If still stuck, ASK user for guidance
```

### 🔴 ON COMMIT (GIT HYGIENE)

When user asks to commit (especially "commit everything"):

```
1. Check git status for untracked files
2. Identify generated files (logs, build output, cache, etc.)
3. Update .gitignore BEFORE staging if needed
4. Stage source files only
5. Commit with conventional commit message
6. Push if requested
```

**Generated files to always gitignore:**
- `*.log`, `*.jsonl` (logs)
- `out/`, `dist/`, `.next/`, `target/` (build output)
- `.claude/logs/` contents (session logs)
- Auto-generated `.claude/` in subpackages

**Never ask** about generated files - just gitignore them.

---

## Project Overview

Add project-specific context here. This file is read by Claude Code at the start of every session.

## Key Files

| Purpose | Path |
|---------|------|
| Main entry | [Add path] |
| Config | [Add path] |

## Conventions

- Add your project's conventions here
