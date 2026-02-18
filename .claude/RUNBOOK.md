# UnicornDev Agent Runbook

> Quick reference for consistent, reliable behavior. Consult this at every phase.

---

## Session Start Checklist

```
□ Load .claude/settings.json
□ Load .claude/knowledge/index.json
□ Note project type and current state
□ Check for pending tasks
□ Initialize meta-cognition monitoring
```

---

## Request Classification

```
USER INPUT
    │
    ├─► TASK (do something)
    │   ├─ Feature → Spec first?
    │   ├─ Bug → Debug skill
    │   ├─ Question → Explore
    │   └─ Refactor → Plan first
    │
    ├─► QUESTION (explain something)
    │   ├─ About code → Read/explore
    │   ├─ About tech → Check knowledge
    │   └─ How to → May need to learn
    │
    └─► FEEDBACK (response to our work)
        ├─ Approval → Continue
        ├─ Correction → Update, maybe learn
        └─ Rejection → Stop, understand why
```

---

## Complexity Assessment (Before Starting Tasks)

```
QUICK COMPLEXITY CHECK:

Single file + known solution + low risk?
├─► YES → TRIVIAL: Just do it
└─► NO → Full assessment needed
```

### Full Assessment

```
Rate 1-5 each, then average:

SCOPE:        1=one function ... 5=multiple systems
UNCERTAINTY:  1=known solution ... 5=unprecedented
DEPENDENCIES: 1=none ... 5=complex chain
RISK:         1=safe ... 5=critical
KNOWLEDGE:    1=fully known ... 5=unknown territory

Score 1.0-1.5: TRIVIAL  → Direct execution
Score 1.6-2.5: SIMPLE   → Light planning
Score 2.6-3.5: MODERATE → Task list, verify each
Score 3.6-4.5: COMPLEX  → Phases, checkpoints, regression tests
Score 4.6-5.0: EXTREME  → Prove each step, user checkpoints
```

### Methodology by Level

```
TRIVIAL:  Do → Verify → Done
SIMPLE:   Plan (mental) → Do → Test → Done
MODERATE: Tasks → [Do → Verify → Check regression]* → Done
COMPLEX:  Phases → [Do → Verify → Full regression → Checkpoint]* → Done
EXTREME:  Prove approach → Phases → [Verify continuously]* → Done
```

### Decomposition Rules

```
□ Each increment ≤ 30 minutes
□ Each increment independently verifiable
□ Each increment revertable
□ No increment leaves system broken
```

---

## Verification Levels

```
L0: Compiles? (tsc --noEmit, build)
L1: Unit works? (test function/component)
L2: Integrates? (works with dependencies)
L3: End-to-end? (user flow works)
L4: No regressions? (existing tests pass)

TRIVIAL:  L0
SIMPLE:   L0 + L1
MODERATE: L0 + L1 + L2 + L4
COMPLEX:  L0 + L1 + L2 + L3 + L4
EXTREME:  All levels, continuously
```

### Regression Response

```
IF regression found:
1. STOP immediately
2. Identify what broke
3. Assess severity (critical/major/minor)
4. Critical/Major → REVERT, then reassess
5. Minor → Quick fix if <5min, else revert
```

---

## Before Every Action

```
□ Is this the right approach?
□ Do I have what I need?
□ Will this move us forward?

If unsure → PAUSE, don't guess
```

---

## Every 10 Actions: Meta-Check

```
FLOW STATE CHECK:

GREEN (continue):
  ✓ Making progress
  ✓ Actions succeeding
  ✓ Clear direction

YELLOW (caution):
  ⚠ Some uncertainty
  ⚠ Minor retries
  ⚠ Searching without finding
  → Pause, assess

RED (stop):
  ✗ Stuck
  ✗ Repeated failures
  ✗ No clear next action
  → Full reflection required
```

---

## Trigger Quick Reference

### Learn System
| Trigger | Action |
|---------|--------|
| Unknown package in package.json | Research + document |
| Unknown import in code | Research + document |
| "How do I use X?" | Check knowledge, learn if missing |
| Web search reveals new tech | Document key patterns |

### Reflect System
| Trigger | Action |
|---------|--------|
| Same error 3x | STOP → Diagnose → Fix |
| Same search 3x | Switch to exploration pattern |
| No progress 5 actions | Pause → Reflect |
| 3+ files without completing any | Focus on one thing |

### Knowledge System
| Trigger | Action |
|---------|--------|
| Task involves known tech | Load relevant knowledge |
| Decision point | Check for relevant patterns |
| About to implement | Check for anti-patterns |

---

## Decision Framework

### Approach Selection
```
1. Check knowledge base for patterns
2. Consider simplest approach first
3. If multiple options, weigh trade-offs
4. If uncertain, ask or research
5. Document decision reasoning
```

### Blocker vs Optimization
```
Can I proceed without fixing this?
├─► NO (blocker) → Fix now
└─► YES → Is slowdown > 50%?
          ├─► YES + quick fix → Fix now
          └─► Otherwise → Queue for later
```

### When to Ask User
```
ASK when:
- Requirements are ambiguous
- Multiple valid approaches exist and preference matters
- Destructive action needed
- Stuck after 3 recovery attempts

DON'T ASK when:
- Answer is in codebase
- Standard approach exists
- Can make reasonable assumption
```

---

## Recovery Procedures

### Search Loop (3+ similar searches)
```
1. STOP searching
2. Read package.json for libraries
3. List directory structure
4. Find entry points, follow trail
5. Use systematic exploration pattern
```

### Error Loop (3+ same error)
```
1. STOP retrying
2. Log the error
3. Ask: Why is this failing?
4. Ask: What assumption is wrong?
5. Try different approach
```

### Stuck (no clear next action)
```
1. STOP everything
2. Re-read original request
3. What is the smallest next step?
4. Do ONLY that step
5. Verify it worked before continuing
```

---

## Quality Gates

### Before Delivering Code
```
□ Does it compile/run?
□ Does it handle errors?
□ Is it typed correctly?
□ Does it follow project patterns?
□ Does it match the request?
```

### Before Creating Files
```
□ Is this file necessary?
□ Does similar file already exist?
□ Is the location correct?
□ Is the naming consistent?
```

### Before Completing Task
```
□ All acceptance criteria met?
□ No TODOs left unaddressed?
□ Would I approve this PR?
```

---

## Self-Improvement Protocol

### After Every Task
```
1. Quick review: What went well? What didn't?
2. If struggled with something → Create pattern
3. If learned something new → Add to knowledge
4. If found better approach → Document it
```

### Improvement Types
| Situation | Create |
|-----------|--------|
| Recurring task difficulty | .claude/skills/{name}.md |
| Missing technology info | .claude/knowledge/{cat}/{name}.md |
| Reusable solution | .claude/knowledge/patterns/{name}.md |
| Default not working | Update .claude/settings.json |

---

## Logging Requirements

### Always Log
- Session start/end
- Task start/completion
- Errors encountered
- Reflections triggered
- Improvements made
- Major decisions

### Log Location
```
.claude/logs/
├─ session-{date}-{id}.jsonl   # Session events
├─ reflections.jsonl           # Reflection events
├─ improvements-queue.jsonl    # Queued improvements
└─ reviews/                    # Post-task reviews
```

---

## Emergency Procedures

### Completely Lost
```
1. Stop all actions
2. Say: "I'm having trouble. Let me reassess."
3. Re-read original request
4. List what has been done
5. Identify the gap
6. Take smallest possible next step
```

### Breaking Changes Risk
```
1. Stop before executing
2. Warn user explicitly
3. Explain what could break
4. Wait for confirmation
5. Create backup plan
```

### Unknown Territory
```
1. Acknowledge uncertainty
2. Research before acting
3. Start with smallest experiment
4. Verify before scaling
```

---

## Key Principles

1. **Progress over perfection** - Move forward, iterate
2. **Detect and correct** - Notice problems early, fix fast
3. **Learn and improve** - Every struggle is a learning opportunity
4. **When in doubt, stop** - Pausing beats failing forward
5. **Simplest path first** - Complexity is earned, not assumed
