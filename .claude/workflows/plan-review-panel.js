export const meta = {
  name: 'plan-review-panel',
  description: 'Adversarial plan-review panel: 3 checklist-family reviewers + cross-provider codex lens, refutation verify (CRIT individual, WARN batched), single-writer versioned report',
  whenToUse: 'Trigger-class plan/prompts docs (infrastructure, production data, >3 dependent sessions, migration) per /solomon review step 4. Delta mode when prior findings are passed. Cross-provider codex lens is opt-in (codex:true); it sends the doc to OpenAI, so never enable it for client-confidential docs.',
  phases: [
    { title: 'Checklist', detail: 'fail-loud canonical checklist fetch' },
    { title: 'Review', detail: '3 reviewers, merged checklist families + read-only codex exec lens (full) OR fix-verify + regression (delta)' },
    { title: 'Verify', detail: 'one refuting verifier per CRIT/WARN finding' },
    { title: 'Report', detail: 'exactly one writer emits the versioned report' },
  ],
}

// args = [doc_path, doc_type ("plan"|"prompts"), prior_findings_path?]
//     or {doc, type?, prior?, codex?}  — codex:true opts IN to the cross-provider lens (default OFF)
// Discipline (ADR 0001): fan out reads and judgments only; ONLY the phase-4 writer
// writes; no agent ever calls the session-advancement governor tool (non-idempotent); wave/session execution is out of scope.
const argObj = args && typeof args === 'object' && !Array.isArray(args) ? args : null
const [docPath, docType, priorFindingsPath] = argObj
  ? [argObj.doc, argObj.type, argObj.prior]
  : Array.isArray(args) ? args : [args, 'plan']
if (!docPath) throw new Error('plan-review-panel: args[0] (or args.doc) must be the document path')
const kind = docType === 'prompts' ? 'prompts' : 'plan'
// OPT-IN until the user rules on client-confidential docs (codex sends the doc to OpenAI).
const codexOptedOut = argObj?.codex !== true

// >>> codex-helpers — pure functions, no workflow globals (unit-checked by extracting this block)
// Cross-provider lens (council rule): a different-provider judge, run READ-ONLY. Report, never substitute.
// Flags proven 2026-10-28 on codex-cli 0.154.0: --ignore-user-config drops the user's MCP servers/plugins
// (MCP tools are NOT covered by the shell sandbox); -s read-only blocks writes; --ephemeral = no session files.
const CODEX_MODEL = 'gpt-6-astra'
const CODEX_EFFORT = 'high'
const CODEX_SENTINEL = 'END_OF_FINDINGS'
const CODEX_SEVS = ['CRIT', 'WARN', 'SUGG']
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`
const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) || '/' : '.')
const codexBrief = (path, docKind) =>
  `You are an independent reviewer from a different model provider on an adversarial plan-review panel. ` +
  `The document under review (a software implementation ${docKind}) is provided on stdin; its path is ${path}. ` +
  `You may read other files in the working directory for context. Do not modify anything. ` +
  `Find defects that would make the intended ${docKind} wrong or unexecutable as written: dependency or ordering errors, ` +
  `contradictions between sections, verification gates that cannot fail, destructive steps without rollback or backup, ` +
  `missing prerequisites, credentials or services, data-model or API inconsistencies. ` +
  `Severity by impact: CRIT = would cause rework, data loss, or blocked sessions if unfixed; ` +
  `WARN = a real defect that consumers of the ${docKind} will hit; SUGG = everything else. ` +
  `Do not report style nits. Do not re-raise items the document or a sibling decision record explicitly decides as intended. ` +
  `Reply with ONLY lines in this exact format, one finding per line, no markdown, no other text: ` +
  `FINDING {"severity":"CRIT|WARN|SUGG","section":"<section heading>","claim":"<one-sentence claim>",` +
  `"evidence_quote":"<verbatim quote from the document, single line, max 200 chars>"} ` +
  `(each line after FINDING is one valid single-line JSON object) ` +
  `then a final line containing exactly ${CODEX_SENTINEL}. If there are no defects, reply with only ${CODEX_SENTINEL}.`
// stdout (codex's final message) passes through untouched; stderr is reduced by awk to header meta,
// ERROR lines, the token count, and the last 3 lines — so a failure always carries a reason.
const CODEX_STDERR_AWK =
  `/^--------$/{h++; next} ` +
  `h==1 && /^(model|provider|approval|sandbox|reasoning effort): /{print "[meta] " $0} ` +
  `/^ERROR/{print "[err] " substr($0,1,300)} ` +
  `t{print "[tokens] " $0; t=0} /^tokens used/{t=1} ` +
  `{last[NR%3]=$0} END{for(i=NR-2;i<=NR;i++) if(i>0) print "[tail] " substr(last[i%3],1,200)}`
const codexCommand = (path, docKind) =>
  `set -o pipefail; echo "[meta] cli: $(codex --version 2>&1)"; ` +
  `{ codex exec --ignore-user-config --ignore-rules --ephemeral --skip-git-repo-check -s read-only ` +
  `-c approval_policy='"never"' -m ${CODEX_MODEL} -c model_reasoning_effort='"${CODEX_EFFORT}"' ` +
  `-C ${shq(dirOf(path))} ${shq(codexBrief(path, docKind))} < ${shq(path)} 2>&1 1>&3 ` +
  `| awk ${shq(CODEX_STDERR_AWK)}; } 3>&1; echo "CODEX_EXIT=$?"`
// Returns {ok:true, findings, malformed, meta, tokens} or {ok:false, reason, meta}.
// A timeout, non-zero exit, unconfirmed sandbox, or missing sentinel is NEVER "no findings".
const parseCodexOutput = (raw) => {
  const lines = String(raw || '').split(/\r?\n/)
  const meta = {}
  for (const l of lines) {
    const m = l.match(/^\[meta\] (cli|model|provider|approval|sandbox|reasoning effort): (.*)$/)
    if (m) meta[m[1]] = m[2].trim()
  }
  const tokens = (lines.find((l) => l.startsWith('[tokens] ')) || '').slice(9).trim() || null
  const exitLine = lines.map((l) => l.trim()).filter((l) => /^CODEX_EXIT=\d+$/.test(l)).pop()
  if (!exitLine) return { ok: false, reason: 'no CODEX_EXIT marker — command did not complete (timeout or relay failure)', meta }
  const code = Number(exitLine.slice('CODEX_EXIT='.length))
  if (code !== 0) {
    const why = lines.filter((l) => l.startsWith('[err] ')).concat(lines.filter((l) => l.startsWith('[tail] ')))[0] || 'no stderr'
    return { ok: false, reason: `codex exited ${code}: ${why.replace(/^\[(err|tail)\] /, '').slice(0, 240)}`, meta }
  }
  if (meta.sandbox !== 'read-only') return { ok: false, reason: `sandbox not confirmed read-only (header: ${meta.sandbox || 'missing'})`, meta }
  if (!lines.some((l) => l.trim() === CODEX_SENTINEL)) return { ok: false, reason: `reply lacks ${CODEX_SENTINEL} sentinel — truncated or off-format`, meta }
  const findings = []
  let malformed = 0
  for (const l of lines) {
    // JSON payload, not a delimiter: plans quote shell like `|| true`, which broke a pipe-split format in testing
    const t = l.trim().replace(/^[-*]\s+/, '').replace(/^`+|`+$/g, '')
    // any FINDING-prefixed line is a claimed finding: off-format ones count as malformed, never skipped silently
    if (!/^FINDING\b/.test(t)) continue
    let o = null
    try { o = JSON.parse(t.slice('FINDING'.length).trim()) } catch (e) { o = null }
    const sev = String(o?.severity || '').trim().toUpperCase()
    if (!o || !CODEX_SEVS.includes(sev) || !o.claim) { malformed++; continue }
    findings.push({
      id: `cx-${String(findings.length + 1).padStart(2, '0')}`,
      severity: sev,
      section: String(o.section || '').trim(),
      claim: String(o.claim).trim(),
      evidence_quote: String(o.evidence_quote || '').trim(),
    })
  }
  if (!findings.length && malformed) return { ok: false, reason: `all ${malformed} FINDING lines off-format — reply unparseable, not clean`, meta }
  return { ok: true, findings, malformed, meta, tokens }
}
// <<< codex-helpers

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

// Cross-provider lens: a Haiku RELAY runs the proven codex command and returns its output verbatim;
// parseCodexOutput (pure JS) turns it into findings. The relay never authors findings.
const CODEX_RELAY_SCHEMA = {
  type: 'object',
  properties: {
    ran: { type: 'boolean', description: 'false if the Bash tool itself failed or timed out' },
    output: { type: 'string', description: 'the command output, VERBATIM, every line' },
    bash_error: { type: 'string', description: 'Bash tool error text when ran=false' },
  },
  required: ['ran', 'output'],
}
const runCodexLens = async () => {
  const relay = await agent(
    `You are a RELAY, not a reviewer. Run EXACTLY this one shell command with the Bash tool — pass ` +
      `timeout: 600000, do not run it in the background, do not alter, split, or retry it:\n\n${codexCommand(docPath, kind)}\n\n` +
      `Then return the command's complete output VERBATIM in "output" (every line, unedited, no summary). ` +
      `NEVER review the document yourself, never write or invent findings, never substitute another model or tool. ` +
      `If the Bash tool itself errored or timed out, set ran=false and put its error text in bash_error. ${NO_WRITE}`,
    { label: 'review:codex', phase: 'Review', model: 'haiku', effort: 'low', schema: CODEX_RELAY_SCHEMA }
  )
  if (!relay) return { ok: false, reason: 'relay agent died before returning', meta: {} }
  if (!relay.ran) return { ok: false, reason: `Bash failed/timed out: ${String(relay.bash_error || 'no error text').slice(0, 200)}`, meta: {} }
  return parseCodexOutput(relay.output)
}

let codexLens = null // header string for the report: OK / UNAVAILABLE / DISABLED / SKIPPED
let codexFindingIds = []
let rawFindings = []
if (priorFindingsPath) {
  codexLens = 'SKIPPED (delta mode — fix-verify + regression only)'
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
  // started before the barrier so codex runs concurrently with the 3 Claude lenses
  const codexPending = codexOptedOut ? null : runCodexLens().catch((e) => ({ ok: false, reason: `relay threw: ${String(e).slice(0, 200)}`, meta: {} }))
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
  if (codexOptedOut) {
    codexLens = 'DISABLED (opt-in: pass codex:true)'
  } else {
    const cx = await codexPending
    if (cx.ok) {
      // appended LAST so an equal-severity Claude near-duplicate wins the lexical dedupe
      rawFindings = rawFindings.concat(cx.findings)
      codexFindingIds = cx.findings.map((f) => f.id)
      codexLens =
        `OK (${cx.meta.cli || 'codex-cli ?'}, model ${cx.meta.model || '?'}, effort ${cx.meta['reasoning effort'] || '?'}, ` +
        `sandbox ${cx.meta.sandbox}, ${cx.findings.length} findings, ${cx.malformed} malformed lines dropped, tokens ${cx.tokens || '?'})`
      if (cx.malformed) log(`codex lens: ${cx.malformed} malformed FINDING line(s) dropped`)
    } else {
      // FAIL LOUD, NOT SUBSTITUTE: the panel continues on its 3 lenses and the report says so.
      codexLens = `UNAVAILABLE (${cx.reason})`
    }
    log(`codex lens: ${codexLens}`)
  }
}
const beforeDedupe = rawFindings.length
rawFindings = dedupe(rawFindings)
const codexSurvivors = rawFindings.filter((f) => codexFindingIds.includes(f.id)).length
log(`${beforeDedupe} raw findings -> ${rawFindings.length} after cross-lens dedupe (${codexSurvivors} cx- survived; lexical dedupe, so semantic overlap with Claude lenses is possible)`)

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
  codex_lens: codexLens,
  codex_findings_after_dedupe: codexSurvivors,
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
    `whose header (directly under the title) contains the line "codex lens: ${codexLens}" verbatim ` +
    `(findings with ids starting "cx-" came from the cross-provider codex reviewer — keep their ids), ` +
    `with sections "Confirmed findings" (CRIT first, each with evidence quote), "Downgraded to ` +
    `plausible" (each WITH its refutation quote), "Suggestions", and a final "Counts" line ` +
    `containing confirmed_crit=<n>. Findings are never omitted — downgraded ones appear with their ` +
    `refutation.\n3. Return only the absolute path of the file you wrote.`,
  { label: 'write-report', model: 'haiku', effort: 'low' }
)

return {
  report_path: (reportPath || '').trim(),
  counts: reportPayload.counts,
  codex_lens: codexLens,
  terminator_hint: confirmedCrit.length === 0 ? 'zero CONFIRMED CRIT — loop may terminate' : 'CONFIRMED CRIT present — iterate',
}
