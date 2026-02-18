# OWASP.WTF

> Project context and instructions for Claude Code.

---

## 🦄 UnicornDev Framework

This project uses UnicornDev enforcement for consistent, high-quality development.

**Version:** 1.2.2
**Docs:** `.claude/RUNBOOK.md` (quick reference)

### Standard Workflow

```
RECEIVE → CLASSIFY → EXECUTE → VERIFY → RESPOND
    │         │          │         │
    │         │          ▼         │
    │         │    CHECKPOINT ◄────┘ (every 10 actions)
    │         │          │
    │         ▼          ▼
    │    [complexity]  [if stuck]
    │     SCALING      REFLECT → IMPROVE
    └─────────────────────────────────────► (loop)
```

### Key Files (Read These)

| File | Purpose |
|------|---------|
| `.claude/RUNBOOK.md` | Quick reference for all behaviors |
| `.claude/settings.json` | Project-specific configuration |
| `.claude/knowledge/index.json` | What technologies are known |
| `.claude/logs/` | Session tracking and insights |

### Settings Summary

Settings in `.claude/settings.json` control behavior:

- **techLevel**: `hardcore` (5/5) / `strict` (4/5) / `relaxed` (3/5) / `lenient` (2/5) / `sloppy` (1/5)
- **proactivityLevel**: `autonomous` (5/5) / `proactive` (4/5) / `careful` (3/5) / `cautious` (2/5) / `paranoid` (1/5)
- **metaCognition.enabled**: Self-monitoring for loops and blockers
- **learning.enabled**: Auto-document new technologies
- **quality.minQaScore**: Minimum QA score (default: 85)
- **quality.thresholds**: Scoped quality thresholds (spec coverage, impl complete, test coverage, QA)

### Complexity Scaling

Before starting tasks, assess complexity (1-5):
- **SCOPE**: Single function → Multiple systems
- **UNCERTAINTY**: Known solution → Unprecedented
- **RISK**: Safe → Critical

| Score | Level | Methodology |
|-------|-------|-------------|
| 1.0-1.5 | TRIVIAL | Do → Verify → Done |
| 1.6-2.5 | SIMPLE | Plan → Do → Test |
| 2.6-3.5 | MODERATE | Tasks → [Do → Verify → Regression]* |
| 3.6+ | COMPLEX | Phases → Checkpoints → User approval |


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
