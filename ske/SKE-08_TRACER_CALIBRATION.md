# SKE-08 calibration: LHV_PROMPTS_FINAL.md regenerated through tracer-tickets

**Date:** 2026-08-21 · **Input:** `solomon-docs/plans/LHV_LOOP_HARDENING_PLAN_FINAL.md` scope
(4 capabilities: measured cost, fail-closed ledger, --review gate, routine hygiene)

## Tracer regeneration

| Slice | Vertical path | Working set (est) | blocked_by |
|---|---|---|---|
| T1 measured-cost | session_cost.py util -> auto.md step-5a wiring -> test_session_cost.py | ~conftest+util+md ≈ 22k tok | — |
| T2 ledger-fail-closed | loop_governor LedgerError -> _ledger_lock -> _decide_locked -> 6 tests | governor+tests ≈ 31k tok | — |
| T3 review-gate | auto.md 4c spec -> stop-table row -> report format (doc channel end-to-end) | auto.md ≈ 9k tok | T1 (budget wording cites measured cost) |
| T4 routine-hygiene | audit script -> dispositions doc -> .created.yml checks | ≈ 14k tok | — |

Frontier: wave 1 = {T1, T2, T4} (3-wide), wave 2 = {T3}.

## Diff vs original

| Metric | Original LHV | Tracer regeneration | Delta |
|---|---|---|---|
| Sessions/slices | 4 | 4 | 0 |
| Waves | 2 | 2 | 0 |
| Max frontier width | 3 (LHV-01,02,04) | 3 (T1,T2,T4) | 0 |
| Blocking edges | 2 (LHV-03 <- 01,02) | 1 (T3 <- T1) | -1 |
| Over-budget slices (>60k) | n/a (unsized) | 0 | — |
| Sized tasks | 0 | 4/4 with size_tokens | +4 |

## Reading

The tracer converges to the SAME shape on LHV — every working set sits far
under the 60k budget, so no splits fire and the natural capability
decomposition already was vertical. Two genuine deltas: (1) one LHV-03 edge
was wave-ordering, not data flow — tracer drops it, widening the theoretical
frontier; (2) every task now carries `size_tokens`, which the original lacked.
Calibration conclusion: the method adds signal without distorting well-sized
plans; its splitting rule only bites on plans with >60k working sets (e.g.
SKE-02-class sessions).
