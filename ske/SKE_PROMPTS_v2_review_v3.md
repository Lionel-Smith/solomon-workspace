# SKE_PROMPTS_v2 Review Report (v3)

## Confirmed findings

### CRIT: SKE-12 infrastructure assumptions not verified (INFRAGATES-01)

**Section:** SKE-12 (Wave 4)

**Claim:** SKE-12 wires alerting through a Samson 'existing ingestion poller (BE-08 mechanism)' and persistence to 'cadence_state' as already-live infrastructure, but no dependency edge or existence check verifies these services actually exist — and project memory records the Samson cadence API as not yet built.

**Evidence:**
> Weekly full eval run -> Samson persists to cadence_state; alerting via Samson's existing ingestion poller (BE-08 mechanism - no new service) on precision/recall drop >5 pts or coverage loss.

**Verdict:** CONFIRMED

---

### CRIT: Machine gates have prose descriptions instead of executable commands (INFRAGATES-02)

**Section:** SKE-12, SKE-11, SKE-13 verification blocks

**Claim:** Multiple checks are declared `gate_class="machine"` but their command fields are prose descriptions, not executable commands, so they cannot mechanically pass/fail or feed the iterate-to-green retry loop.

**Evidence:**
> `<check name="run_recorded" gate_class="machine" command="cadence_state row for the eval ritual">one scheduled run recorded</check>`

**Verdict:** CONFIRMED

---

### WARN: SKE-01 coverage constraint contradicts SKE-02 context (TECHNICAL-01)

**Section:** SKE-01 constraints (Wave 1)

**Claim:** SKE-01's coverage constraint asserts the org-authored population is already 44 before SKE-02 has disposed claude-design-prompts, but at SKE-01's point in the DAG only the 43 skills already registered under a root (devkit) are discoverable by the inventory tool — claude-design-prompts is explicitly described (in SKE-02's own context, one session later) as sitting outside both roots until SKE-02 promotes or excludes it. A coverage computation run during/after SKE-01 would therefore total 43, not 44, contradicting the constraint's stated figure.

**Evidence:**
> coverage counts org-authored only (44 accounted); vendored skills never enter the gate population (ADR-0002).

**Verdict:** CONFIRMED

---

### WARN: SKE-09 fanout_clean command is syntactically invalid (INFRAGATES-03)

**Section:** SKE-09 verification block

**Claim:** The fanout_clean check is marked `gate_class="machine"` but its command field concatenates two unrelated fragments with a bare '+', which is not valid executable shell and leaves the actual pass condition ambiguous.

**Evidence:**
> `<check name="fanout_clean" gate_class="machine" command="fan-out test script exit code + git -C /tmp/throwaway status --porcelain | wc -l">0 conflicts</check>`

**Verdict:** CONFIRMED

---

### WARN: SKE-04 missing explicit dependency on SKE-02 (INFRAGATES-04)

**Section:** SKE-04 (Wave 2) metadata/context

**Claim:** SKE-04's eval runner explicitly requires the corrected two-root/coverage-fixed 'production surface' that SKE-02/SKE-03 establish, yet SKE-04 declares no `<requires>` edge to SKE-02 — unlike SKE-05 and SKE-11, which add explicit edges for the identical class of transitive data-flow dependency on SKE-02. Wave order happens to preserve sequencing here, but the dependency graph is not self-documenting for this true data-flow claim.

**Evidence:**
> Runner mounts the PRODUCTION surface (org-authored index + pointer, search over both roots, real commands) - trigger competition is the thing measured; an enumerated-94 or isolated environment measures fiction.

**Verdict:** CONFIRMED

---

### WARN: SKE-12 scheduling collision risk not verified (INFRAGATES-05)

**Section:** SKE-12 context

**Claim:** SKE-12 notes a scheduling collision risk with a separate chain (LHV-04's Friday eval slot) but neither adds a dependency edge on that chain nor a verification step confirming the collision was actually checked/avoided before scheduling its own weekly ritual.

**Evidence:**
> Coordinate with LHV-04's friday-eval hybrid-trigger recommendation - don't double-book the Friday slot.

**Verdict:** CONFIRMED

---

## Downgraded to plausible

(None)

---

## Suggestions

### SUGG: Estate sweep lacks pre-sweep backup verification (INFRAGATES-06)

**Section:** SKE-R-05 tasks/verification

**Claim:** The estate-wide section-sign sweep across three repos (hfs-development-kit, solomon-docs, ske) is a bulk mechanical text replacement with no explicit pre-sweep backup/clean-tree verification step, relying only on git's implicit safety net.

**Evidence:**
> Estate sweep (devkit, solomon-workspace incl. ske/SKE_DISCOVERY.md, solomon-docs): replace occurrences

---

## Counts

**confirmed_crit=2, confirmed_warn=4, plausible=0, sugg=1**
