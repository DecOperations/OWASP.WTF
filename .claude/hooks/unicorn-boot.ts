#!/usr/bin/env npx tsx
/**
 * @file unicorn-boot.ts
 * @description SessionStart hook for UnicornDev framework initialization
 * @layer Infrastructure
 *
 * Provides:
 * - Global repo health overview (for awareness)
 * - Prompt scoping workflow for per-task analysis
 * - Quality thresholds that apply to SCOPED analysis, not global counts
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { execSync } from 'child_process'

// =============================================================================
// Types
// =============================================================================

interface Settings {
  version?: string
  techLevel?: string
  proactivityLevel?: string
  interactionLevel?: string
  autonomy?: {
    mode?: string
    selfRecover?: boolean
    continueUntilDone?: boolean
    askUser?: string
  }
  quality?: {
    minQaScore?: number
    requireSpecs?: boolean
    requireTests?: boolean
    thresholds?: QualityThresholds
  }
  metaCognition?: { enabled?: boolean }
  learning?: { enabled?: boolean }
  execution?: { checkpointInterval?: number }
  autoWorkflow?: {
    autoCommit?: boolean
    commitStyle?: string
  }
  workflow?: {
    type?: string
    gitFlow?: string
    integrationBranch?: string
    branchPrefix?: string
    commitStrategy?: string
    commitDirectly?: boolean
    pushAfterCommit?: boolean
    createPR?: boolean
    qaRequired?: boolean
    specsRequired?: boolean
    testRequired?: boolean
    commitPerTask?: boolean
    qaLoop?: { enabled?: boolean; testLocally?: boolean }
    recommendations?: Record<string, boolean>
  }
}

interface QualityThresholds {
  // Scoped thresholds (applied to prompt scope, not global)
  scopedSpecCoverage: number    // % of scoped features with specs (default: 80)
  scopedImplComplete: number    // % of spec criteria implemented (default: 70)
  scopedTestCoverage: number    // % test coverage for scoped files (default: 60)
  scopedQaScore: number         // Min QA score for scoped files (default: 80)
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  scopedSpecCoverage: 80,   // 80% of touched features should have specs
  scopedImplComplete: 70,   // 70% of spec criteria should be implemented
  scopedTestCoverage: 60,   // 60% test coverage for modified files
  scopedQaScore: 80         // QA score 80+ for modified files
}

interface RepoOverview {
  specCount: number
  codeFileCount: number
  testFileCount: number
  structure: string
}

// =============================================================================
// Utilities
// =============================================================================

function getProjectRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function safeReadJson<T>(path: string, defaultValue: T): T {
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, 'utf-8'))
    }
  } catch { /* ignore */ }
  return defaultValue
}

function getGitInfo(): { branch: string; status: string; flow: string } {
  try {
    const branch = execSync('git branch --show-current 2>/dev/null', { encoding: 'utf-8' }).trim() || 'unknown'
    const statusOutput = execSync('git status --short 2>/dev/null', { encoding: 'utf-8' }).trim()
    const lines = statusOutput.split('\n').filter(Boolean)
    const status = lines.length > 0 ? `${lines.length} changed` : 'clean'

    const branchList = execSync('git branch -a 2>/dev/null', { encoding: 'utf-8' })
    let flow = 'trunk'
    if (/\bdevelop\b|\bdev\b/.test(branchList)) flow = 'gitflow'
    else if (/feature\/|feat\/|fix\//.test(branchList)) flow = 'github-flow'

    return { branch, status, flow }
  } catch {
    return { branch: 'unknown', status: 'unknown', flow: 'trunk' }
  }
}

function findFiles(dir: string, extensions: string[], maxDepth = 4): string[] {
  const results: string[] = []
  const excludeDirs = ['node_modules', 'dist', '.next', 'coverage', '__tests__', '.git']

  function walk(currentDir: string, depth: number): void {
    if (depth > maxDepth) return
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name)
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
            walk(fullPath, depth + 1)
          }
        } else if (entry.isFile()) {
          if (extensions.includes(extname(entry.name))) {
            results.push(fullPath)
          }
        }
      }
    } catch { /* ignore */ }
  }

  if (existsSync(dir)) walk(dir, 0)
  return results
}

// =============================================================================
// Repo Overview (Quick Global Stats)
// =============================================================================

function getRepoOverview(projectRoot: string): RepoOverview {
  let specCount = 0
  let codeFileCount = 0
  let testFileCount = 0
  let structure = 'unknown'

  // Count specs
  for (const dir of ['specs', 'docs'].map(d => join(projectRoot, d))) {
    specCount += findFiles(dir, ['.md'], 3).length
  }

  // Count code and tests
  for (const dir of ['src', 'app', 'packages', 'lib'].map(d => join(projectRoot, d))) {
    const files = findFiles(dir, ['.ts', '.tsx'], 4)
    for (const f of files) {
      if (f.includes('.test.') || f.includes('.spec.')) {
        testFileCount++
      } else {
        codeFileCount++
      }
    }
  }

  // Detect structure
  const pkgPath = join(projectRoot, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (deps['next']) structure = existsSync(join(projectRoot, 'app')) ? 'nextjs-app' : 'nextjs-pages'
      else if (deps['react']) structure = 'react'
    } catch { /* ignore */ }
  }
  if (existsSync(join(projectRoot, 'packages')) || existsSync(join(projectRoot, 'apps'))) {
    structure = 'monorepo'
  }

  return { specCount, codeFileCount, testFileCount, structure }
}

// =============================================================================
// Logging
// =============================================================================

function logSessionStart(logsDir: string, branch: string): void {
  const logFile = join(logsDir, `session-${new Date().toISOString().split('T')[0]}.jsonl`)
  appendFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'session_start',
    branch,
    type: 'SessionStart_hook'
  }) + '\n')
}

function initializeMetaState(logsDir: string): void {
  writeFileSync(join(logsDir, 'meta-state.json'), JSON.stringify({
    sessionStart: new Date().toISOString(),
    toolCalls: 0,
    searchPatterns: {},
    errorPatterns: {},
    filesAccessed: [],
    lastCheckpoint: 0,
    warnings: [],
    bootedVia: 'SessionStart_hook'
  }, null, 2))
}

// =============================================================================
// Main
// =============================================================================

function main(): void {
  const projectRoot = getProjectRoot()
  const logsDir = join(projectRoot, '.claude/logs')
  mkdirSync(logsDir, { recursive: true })

  const settings = safeReadJson<Settings>(join(projectRoot, '.claude/settings.json'), {})
  const knowledge = safeReadJson<{ entries?: Record<string, unknown> }>(
    join(projectRoot, '.claude/knowledge/index.json'),
    { entries: {} }
  )
  const knowledgeCount = Object.keys(knowledge.entries || {}).length

  const git = getGitInfo()
  const repo = getRepoOverview(projectRoot)

  logSessionStart(logsDir, git.branch)
  initializeMetaState(logsDir)

  // Settings
  const techLevel = settings.techLevel || 'relaxed'
  const techScales: Record<string, number> = { hardcore: 5, strict: 4, relaxed: 3, lenient: 2, sloppy: 1 }
  const techScale = techScales[techLevel] || 3
  const proactivity = settings.proactivityLevel || 'autonomous'
  const proactivityScales: Record<string, number> = { autonomous: 5, proactive: 4, careful: 3, cautious: 2, paranoid: 1 }
  const proactivityScale = proactivityScales[proactivity] || 5
  const minQaScore = settings.quality?.minQaScore || 85
  const requireSpecs = settings.quality?.requireSpecs !== false
  const workflowType = settings.workflow?.type || 'spec-first'
  const commitPerTask = settings.workflow?.commitPerTask !== false
  const autoCommit = settings.autoWorkflow?.autoCommit !== false
  const commitStyle = settings.autoWorkflow?.commitStyle || 'conventional'
  const autonomyMode = settings.autonomy?.mode || 'full'
  const selfRecover = settings.autonomy?.selfRecover !== false
  const checkpoint = settings.execution?.checkpointInterval || 10

  // Git workflow settings
  const gitFlow = settings.workflow?.gitFlow || git.flow
  const integrationBranch = settings.workflow?.integrationBranch || (gitFlow === 'gitflow' ? 'develop' : 'main')
  const branchPrefix = settings.workflow?.branchPrefix || 'feat/'
  const commitStrategy = settings.workflow?.commitStrategy || commitStyle
  const commitDirectly = settings.workflow?.commitDirectly ?? (gitFlow === 'trunk')
  const pushAfterCommit = settings.workflow?.pushAfterCommit ?? settings.autoWorkflow?.pushAfterCommit ?? false
  const createPR = settings.workflow?.createPR ?? false
  const qaRequired = settings.workflow?.qaRequired !== false
  const specsRequired = settings.workflow?.specsRequired !== false
  const testRequired = settings.workflow?.testRequired ?? false
  const recommendations = settings.workflow?.recommendations ?? {}

  // Build lifecycle string
  const lifecycle = [
    specsRequired ? 'spec' : null,
    !commitDirectly ? 'branch' : null,
    'implement',
    qaRequired ? 'QA' : null,
    'commit',
    pushAfterCommit ? 'push' : null,
    createPR ? 'PR' : null,
  ].filter(Boolean).join(' → ')

  // Build recommendations string
  const recsActive = Object.entries(recommendations).filter(([, v]) => v).map(([k]) => {
    const labels: Record<string, string> = { featureBranch: 'feature branches', fullQA: 'full QA', specFirst: 'spec-first', codeReview: 'code review' }
    return labels[k] || k
  })

  // Thresholds (scoped, not global)
  const thresholds: QualityThresholds = { ...DEFAULT_THRESHOLDS, ...settings.quality?.thresholds }

  const context = `🦄 UnicornDev Boot

## CONFIG
| Setting | Value |
|---------|-------|
| tech | ${techLevel} (${techScale}/5) |
| proactive | ${proactivity} (${proactivityScale}/5) |
| qa | ≥${minQaScore} (${Math.round(minQaScore/20)}/5) |
| workflow | ${workflowType} |

**Autonomy:** mode=${autonomyMode} self-recover=${selfRecover ? 'on' : 'off'}
**State:** branch=\`${git.branch}\` git=${git.status} flow=${git.flow}
**Commits:** ${autoCommit ? commitStyle : 'manual'}${commitPerTask ? ' (per-task)' : ''}

## REPO OVERVIEW
- Structure: ${repo.structure}
- Specs: ${repo.specCount} | Code: ${repo.codeFileCount} | Tests: ${repo.testFileCount}
- Knowledge entries: ${knowledgeCount}

## GIT WORKFLOW
| Setting | Value |
|---------|-------|
| flow | ${gitFlow} |
| integration | \`${integrationBranch}\` |
| branch prefix | \`${branchPrefix}\` |
| commit | ${commitDirectly ? 'direct to branch' : 'feature branch required'} |
| strategy | ${commitStrategy} |
| push | ${pushAfterCommit ? 'auto after commit' : 'manual'} |
| PR | ${createPR ? 'auto-create to ' + integrationBranch : 'manual'} |
| QA gate | ${qaRequired ? 'required' : 'optional'} |

**Task Lifecycle:** ${lifecycle}${recsActive.length > 0 ? `\n**Recommendations:** ${recsActive.join(', ')}` : ''}

## QUALITY THRESHOLDS (Applied to Prompt Scope)
| Metric | Threshold | Description |
|--------|-----------|-------------|
| Spec Coverage | ≥${thresholds.scopedSpecCoverage}% | Features in scope must have specs |
| Impl Complete | ≥${thresholds.scopedImplComplete}% | Spec criteria implemented |
| Test Coverage | ≥${thresholds.scopedTestCoverage}% | Tests for modified files |
| QA Score | ≥${thresholds.scopedQaScore} | Quality score for scope |

---

## WORKFLOW: Prompt Scoping Protocol

### PHASE 1: SCOPE THE PROMPT
Before any code, determine what the prompt touches:

\`\`\`
PROMPT SCOPE ANALYSIS
├─ Features: [list features/modules involved]
├─ Files: [list files likely to be modified]
├─ Dependencies: [upstream/downstream impacts]
└─ Boundaries: [what's IN vs OUT of scope]
\`\`\`

### PHASE 2: SCOPED QUALITY CHECK
For the scoped features/files, assess:

\`\`\`
SCOPED ANALYSIS
├─ Spec Coverage: X% (${thresholds.scopedSpecCoverage}% required)
│   └─ [list features WITH specs vs WITHOUT]
├─ Implementation Differential:
│   ├─ ✓ DONE: [criteria already implemented]
│   ├─ ◐ PARTIAL: [criteria partially done]
│   └─ ✗ REMAINING: [criteria to implement]
├─ Test Coverage: X% (${thresholds.scopedTestCoverage}% required)
│   └─ [files with tests vs without]
└─ QA Scores: [scores for files in scope]
\`\`\`

### PHASE 3: RECOMMENDATIONS (Scoped)
Based on scoped analysis, determine blockers:

**P0 BLOCKER** (must fix first):
- Scoped spec coverage < ${thresholds.scopedSpecCoverage}% → Create specs for uncovered features
- Critical dependencies missing specs → Spec those first

**P1 IMPORTANT** (address during task):
- Implementation differential shows gaps → Close gaps in order
- Test coverage < ${thresholds.scopedTestCoverage}% → Add tests for modified files

**P2 ENHANCEMENT** (note for later):
- QA scores below ${thresholds.scopedQaScore} → Improve after core work done

### PHASE 4: EXECUTE (${workflowType})
${requireSpecs ? '1. **SPEC** - Create/update specs for uncovered scope' : '1. Skip spec'}
2. **IMPLEMENT** - Work through implementation differential in order
3. **TEST** - Add/update tests for modified files
4. **COMMIT** - ${commitPerTask ? 'Semantic commit per logical unit' : 'Batch commits'}
5. **QA** - Verify scoped files meet qa≥${minQaScore}

### PHASE 5: VERIFY SCOPE
Before completing:
- [ ] All scoped features have specs (≥${thresholds.scopedSpecCoverage}%)
- [ ] Implementation differential closed (≥${thresholds.scopedImplComplete}%)
- [ ] Modified files have tests (≥${thresholds.scopedTestCoverage}%)
- [ ] QA scores meet threshold (≥${thresholds.scopedQaScore})

**MODE:** ${autonomyMode === 'full' ? 'AUTONOMOUS - Work until done, self-recover' : 'SUPERVISED'}
**Checkpoints:** Every ${checkpoint} actions, verify scope progress`

  console.log(context)
}

main()
