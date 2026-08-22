---
status: accepted
date: 2026-07-18
---

# Workflow agents fan out reads and judgments only; writes stay single-threaded

Claude Code's Workflow tool lets deterministic scripts orchestrate parallel subagents, and the WFI feature introduces the first saved workflow (`plan-review-panel`). We decided that workflow agents may fan out only for reading and judging: exactly one writer agent per output artifact, no workflow agent ever calls `loop_next` (it is non-idempotent — every call ticks `sessions_done` and the stuck counter), and wave-parallel session execution stays deferred. This is because the multi-agent caution cited in `ADR_LOOP_ENGINEERING` decision 6 (Huntley) targets concurrent *write*-decision-makers, not scripted orchestrator-worker fan-out — Ralph itself fans out hundreds of read-only subagents while enforcing one writer and one item per loop, and Cognition's 2026 formulation reconciles the sources as "agents contribute intelligence while writes stay single-threaded."

## Consequences

- The plan-review-panel may run 5 parallel reviewers and per-finding verifiers, but only its phase-3 writer emits the report; all other agent prompts carry an explicit no-write prohibition.
- Parallel session execution (multiple concurrent writers picking from the backlog) remains impossible by design: `loop_next` hands out one pick with no claim/lease and counts calls, not completions. Lifting this requires extending the governor itself (claim/lease semantics, completion-keyed ledger, locking) — not a workflow script.
- Gate-execution fan-out (parallel LLM agents running shell verification checks) is banned even inside sanctioned workflows — shell job control gives concurrency for free, and an agent adds no intelligence to a deterministic command.

## Rejected alternatives

Workflow-as-loop-driver (seam A) and wave-parallel execution via workflow (seam C) were rejected unanimously by a three-lens design panel — see `solomon-docs/plans/WFI_WORKFLOW_INTEGRATION_SPEC.md` section 5 for the full rejected-ideas table.
