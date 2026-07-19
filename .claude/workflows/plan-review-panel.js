export const meta = {
  name: 'plan-review-panel',
  description: 'Adversarial plan-review panel: 3 checklist-family reviewers, refutation verify (CRIT individual, WARN batched), single-writer versioned report',
  whenToUse: 'Trigger-class plan/prompts docs (infrastructure, production data, >3 dependent sessions, migration) per /solomon review step 4. Delta mode when prior findings are passed.',
  phases: [
    { title: 'Checklist', detail: 'fail-loud canonical checklist fetch' },
    { title: 'Review', detail: '3 reviewers, merged checklist families (full) OR fix-verify + regression (delta)' },
    { title: 'Verify', detail: 'one refuting verifier per CRIT/WARN finding' },
    { title: 'Report', detail: 'exactly one writer emits the versioned report' },
  ],
}

// args = [doc_path, doc_type ("plan"|"prompts"), prior_findings_path?]
// Discipline (ADR 0001): fan out reads and judgments only; ONLY the phase-4 writer
// writes; no agent ever calls the session-advancement governor tool (non-idempotent); wave/session execution is out of scope.
const [docPath, docType, priorFindingsPath] = Array.isArray(args) ? args : [args, 'plan']
if (!docPath) throw new Error('plan-review-panel: args[0] must be the document path')
const kind = docType === 'prompts' ? 'prompts' : 'plan'

const CHECKLIST_PATH =
  '/Users/lionel/Documents/GitHub/solomon-workspace/hfs-development-kit/skills/plan-review-loop/SKILL.md'

const NO_WRITE =
  'HARD CONSTRAINT: this is a READ-ONLY task. Do not create, edit, or delete any file. ' +
  'Do not call any session-advancement, governor, or progress tool. Return data as your final text only.'

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'e.g. STRUCT-01' },
          severity: { type: 'string', enum: ['CRIT', 'WARN', 'SUGG'] },
          section: { type: 'string', description: 'document section the finding anchors to' },
          claim: { type: 'string', description: 'one-sentence defect claim' },
          evidence_quote: { type: 'string', description: 'verbatim quote from the document' },
        },
        required: ['id', 'severity', 'section', 'claim', 'evidence_quote'],
      },
    },
  },
  required: ['findings'],
}

// Verdict-only by construction: a verifier can downgrade with a quoted refutation,
// never delete a finding.
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['CONFIRMED', 'PLAUSIBLE'] },
    refutation_quote: {
      type: 'string',
      description: 'REQUIRED when verdict=PLAUSIBLE: verbatim document quote that refutes the claim',
    },
  },
  required: ['verdict'],
}

// ---------- Phase 1: fail-loud checklist fetch ----------
phase('Checklist')
const checklist = await agent(
  `Read the file ${CHECKLIST_PATH} and return its COMPLETE raw content as your final text. ` +
    `If the file does not exist or is empty, return exactly the string "CHECKLIST_MISSING". ${NO_WRITE}`,
  { label: 'fetch-checklist', model: 'haiku', effort: 'low' }
)
if (!checklist || checklist.includes('CHECKLIST_MISSING') || checklist.length < 500) {
  // Never warn-and-continue: a vanished checklist is the failure mode this panel exists to kill.
  throw new Error(`plan-review-panel: canonical checklist unreadable at ${CHECKLIST_PATH} — aborting (fail-loud)`)
}

// ---------- Phase 2: review ----------
phase('Review')

const PLAN_LENSES = [
  { key: 'structural', focus: 'the structural checklist family (executive_summary, data_model, api_design, user_flows, roadmap, open_questions) plus Naming & Consistency' },
  { key: 'technical', focus: 'the technical family (valid_fk_refs, api_matches_model, auth_considered, error_patterns, no_orphans) plus spec_verification (authoritative_source, document_date, calculations_referenced) and Problem Analysis' },
  { key: 'infra-gates', focus: 'Infrastructure State, Dependencies, and Verification Gates (services actually exist, env vars, complete executable dependency graph, testable criteria, rollback, backup before destructive ops)' },
]
const PROMPTS_LENSES = [
  { key: 'structural', focus: 'the prompts structural family (metadata_complete, valid_dag, session_sizes_30_90m, parallel_map, checklists, git_templates)' },
  { key: 'technical', focus: 'the prompts technical family (valid_syntax, consistent_paths, valid_imports, matching_signatures, correct_assertions) plus the implementation family (component_refs, three_layer_pattern, migrations, no_duplicates, recovery_docs)' },
  { key: 'infra-gates', focus: 'the infrastructure family (services_exist, volumes_verified, backups_tested) plus Verification Gates + Dependencies' },
]

// Deterministic lowercase-word-Jaccard dedupe across lenses (pattern_autonomous_dedup_jaccard)
const STOP = new Set(['the','a','an','is','are','of','to','in','for','and','or','with','no','not','missing','plan','document','session'])
const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)))
const jaccard = (a, b) => {
  const wa = words(a), wb = words(b)
  let inter = 0
  for (const w of wa) if (wb.has(w)) inter++
  const union = wa.size + wb.size - inter
  return union ? inter / union : 0
}
const SEV_RANK = { CRIT: 0, WARN: 1, SUGG: 2 }
const dedupe = (findings) => {
  const kept = []
  for (const f of findings.sort((x, y) => SEV_RANK[x.severity] - SEV_RANK[y.severity])) {
    if (!kept.some((k) => jaccard(k.section + ' ' + k.claim, f.section + ' ' + f.claim) >= 0.6)) kept.push(f)
  }
  return kept
}

const reviewerPrompt = (lens) =>
  `You are one reviewer on an adversarial plan-review panel. Read the document at ${docPath} ` +
  `(read it yourself with your file tools — read-only). Review it ONLY through this lens: ${lens.focus}.\n\n` +
  `The governing checklist (canonical plan-review-loop skill) is embedded below — apply the parts ` +
  `relevant to your lens and ignore the rest. Report defects as findings with verbatim evidence ` +
  `quotes; severity CRIT = would cause rework/data loss/blocked sessions if unfixed, WARN = quality ` +
  `risk, SUGG = improvement. Prefix finding ids with ${lens.key.toUpperCase().replace(/-/g, '')}. ` +
  `Do not report style nits. An empty findings list is a valid answer. ${NO_WRITE}\n\n` +
  `=== CANONICAL CHECKLIST ===\n${checklist}`

let rawFindings = []
if (priorFindingsPath) {
  // DELTA MODE (grilling ruling 2026-07-18): verify prior CONFIRMED CRIT fixes + one regression reviewer.
  const prior = await agent(
    `Read ${priorFindingsPath} and return, as JSON in your final text, the array of previously-CONFIRMED ` +
      `CRIT findings it records (id, section, claim). ${NO_WRITE}`,
    { label: 'fetch-prior', phase: 'Review', model: 'haiku', effort: 'low', schema: FINDINGS_SCHEMA }
  )
  const fixChecks = await parallel(
    (prior?.findings || []).map((f) => () =>
      agent(
        `A prior review CONFIRMED this CRIT finding against ${docPath}:\n${JSON.stringify(f)}\n` +
          `Read the CURRENT document. Has the fix landed? If the defect is still present, re-report it ` +
          `as a finding (same id, severity CRIT, fresh evidence_quote). If fixed, return an empty ` +
          `findings list. ${NO_WRITE}`,
        { label: `fix-verify:${f.id}`, phase: 'Review', model: 'sonnet', schema: FINDINGS_SCHEMA }
      )
    )
  )
  const regression = await agent(
    `${reviewerPrompt({ key: 'regression', focus: 'ONLY the sections changed since the prior review (compare against the prior findings context) — hunt for regressions the fixes introduced' })}\n\n=== PRIOR FINDINGS FILE PATH ===\n${priorFindingsPath}`,
    { label: 'review:regression', phase: 'Review', model: 'sonnet', schema: FINDINGS_SCHEMA, agentType: 'solomon:reviewer' }
  )
  rawFindings = [...fixChecks.filter(Boolean), regression].filter(Boolean).flatMap((r) => r.findings)
} else {
  const lenses = kind === 'prompts' ? PROMPTS_LENSES : PLAN_LENSES
  const reviews = await parallel(
    lenses.map((lens) => () =>
      agent(reviewerPrompt(lens), {
        label: `review:${lens.key}`,
        phase: 'Review',
        model: 'sonnet',
        effort: 'low',
        schema: FINDINGS_SCHEMA,
        agentType: 'solomon:reviewer',
      })
    )
  )
  rawFindings = reviews.filter(Boolean).flatMap((r) => r.findings)
}
const beforeDedupe = rawFindings.length
rawFindings = dedupe(rawFindings)
log(`${beforeDedupe} raw findings -> ${rawFindings.length} after cross-lens dedupe`)

// ---------- Phase 3: adversarial verify (CRIT/WARN only) ----------
phase('Verify')
const toVerify = rawFindings.filter((f) => f.severity === 'CRIT' || f.severity === 'WARN')
const suggestions = rawFindings.filter((f) => f.severity === 'SUGG')

const BATCH_VERDICTS_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['CONFIRMED', 'PLAUSIBLE'] },
          refutation_quote: { type: 'string' },
        },
        required: ['id', 'verdict'],
      },
    },
  },
  required: ['verdicts'],
}

const verifierRules =
  `Read ONLY the sections of the document relevant to each finding (use the finding's section + ` +
  `evidence_quote to navigate — do not read the whole document). Verdict CONFIRMED only if the ` +
  `defect is real as stated. Verdict PLAUSIBLE (downgrade) REQUIRES a verbatim refutation_quote ` +
  `from the document — you cannot downgrade without one, and you cannot delete a finding. ${NO_WRITE}`

const allCrits = toVerify.filter((f) => f.severity === 'CRIT')
const MAX_INDIVIDUAL_CRIT = 8  // deterministic cost bound — finding count is stochastic
const crits = allCrits.slice(0, MAX_INDIVIDUAL_CRIT)
const critOverflow = allCrits.slice(MAX_INDIVIDUAL_CRIT)
const warns = toVerify.filter((f) => f.severity === 'WARN')
const warnBatches = []
for (let i = 0; i < warns.length; i += 5) warnBatches.push(warns.slice(i, i + 5))
const critBatches = []
for (let i = 0; i < critOverflow.length; i += 5) critBatches.push(critOverflow.slice(i, i + 5))

const critResults = await parallel(
  crits.map((f) => () =>
    agent(
      `You are an adversarial verifier with FRESH context. A reviewer claims this CRIT defect in ${docPath}:\n` +
        `${JSON.stringify(f, null, 2)}\n\nTry to REFUTE it. ${verifierRules}`,
      { label: `verify:${f.id}`, phase: 'Verify', model: 'sonnet', effort: 'low', schema: VERDICT_SCHEMA }
    ).then((v) => ({ ...f, verdict: v?.verdict ?? 'CONFIRMED', refutation_quote: v?.refutation_quote }))
  )
)
const warnResults = await parallel(
  warnBatches.map((batch, i) => () =>
    agent(
      `You are an adversarial verifier with FRESH context. Reviewers claim these WARN defects in ${docPath}:\n` +
        `${JSON.stringify(batch, null, 2)}\n\nTry to REFUTE each one; return one verdict per finding id. ${verifierRules}`,
      { label: `verify:warn-batch-${i + 1}`, phase: 'Verify', model: 'haiku', effort: 'low', schema: BATCH_VERDICTS_SCHEMA }
    ).then((r) => {
      const byId = new Map((r?.verdicts || []).map((v) => [v.id, v]))
      return batch.map((f) => {
        const v = byId.get(f.id)
        return { ...f, verdict: v?.verdict ?? 'CONFIRMED', refutation_quote: v?.refutation_quote }
      })
    })
  )
)
const critBatchResults = await parallel(
  critBatches.map((batch, i) => () =>
    agent(
      `You are an adversarial verifier with FRESH context. Reviewers claim these CRIT defects in ${docPath}:\n` +
        `${JSON.stringify(batch, null, 2)}\n\nTry to REFUTE each one; return one verdict per finding id. ${verifierRules}`,
      { label: `verify:crit-batch-${i + 1}`, phase: 'Verify', model: 'sonnet', effort: 'low', schema: BATCH_VERDICTS_SCHEMA }
    ).then((r) => {
      const byId = new Map((r?.verdicts || []).map((v) => [v.id, v]))
      return batch.map((f) => {
        const v = byId.get(f.id)
        return { ...f, verdict: v?.verdict ?? 'CONFIRMED', refutation_quote: v?.refutation_quote }
      })
    })
  )
)
const verified = [...critResults, ...critBatchResults.filter(Boolean).flat(), ...warnResults.filter(Boolean).flat()]
const results = verified.filter(Boolean)
const confirmed = results.filter((f) => f.verdict === 'CONFIRMED')
const confirmedCrit = confirmed.filter((f) => f.severity === 'CRIT')
log(`verify: ${confirmed.length}/${results.length} confirmed (${confirmedCrit.length} CRIT)`)

// ---------- Phase 4: single-writer report ----------
phase('Report')
const reportPayload = {
  document: docPath,
  doc_type: kind,
  mode: priorFindingsPath ? 'delta' : 'full',
  confirmed: results.filter((f) => f.verdict === 'CONFIRMED'),
  plausible: results.filter((f) => f.verdict === 'PLAUSIBLE'),
  suggestions,
  counts: {
    raw: rawFindings.length,
    confirmed_crit: confirmedCrit.length,
    confirmed_warn: confirmed.length - confirmedCrit.length,
    plausible: results.length - confirmed.length,
    sugg: suggestions.length,
  },
}
const reportPath = await agent(
  `You are the SINGLE WRITER for this review panel — the only agent permitted to write a file.\n` +
    `Panel results (JSON):\n${JSON.stringify(reportPayload, null, 2)}\n\n` +
    `1. Determine the next version number: list existing files matching the pattern ` +
    `<doc-basename>_review_v*.md in the directory of ${docPath}; next n = highest + 1 (or 1).\n` +
    `2. Write EXACTLY ONE file, <doc-basename>_review_v<n>.md, in that directory: a markdown report ` +
    `with sections "Confirmed findings" (CRIT first, each with evidence quote), "Downgraded to ` +
    `plausible" (each WITH its refutation quote), "Suggestions", and a final "Counts" line ` +
    `containing confirmed_crit=<n>. Findings are never omitted — downgraded ones appear with their ` +
    `refutation.\n3. Return only the absolute path of the file you wrote.`,
  { label: 'write-report', model: 'haiku', effort: 'low' }
)

return {
  report_path: (reportPath || '').trim(),
  counts: reportPayload.counts,
  terminator_hint: confirmedCrit.length === 0 ? 'zero CONFIRMED CRIT — loop may terminate' : 'CONFIRMED CRIT present — iterate',
}
