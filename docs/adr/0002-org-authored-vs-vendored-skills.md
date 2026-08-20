# Org-authored and vendored skills are distinct kinds with different obligations

Status: accepted (2026-08-20, SKE grilling Q1-Q3)

The skills estate is 44 org-authored (43 devkit canonical + 1 runtime-local) and 50 vendored (39 mattpocock via `~/.agents/.skill-lock.json`, 11 plugin-cache via `installed_plugins.json`). We decided the reachability gate, conformance rubric, and score artifacts apply **only to org-authored skills**; vendored skills are reachable solely through `search_skills`, and the always-on Skills index lists org-authored entries plus a single pointer line naming the search path. Wrapper skills that build on vendored content record a report-only Upstream pin (the lockfile hash they were validated against) so eval movement attributes to skill, environment, or upstream drift.

## Considered Options

- **93/93 uniform gate** — rejected: commits HFS to maintaining reachability wrappers for 50 skills it cannot edit, whose descriptions upstream can rewrite without an HFS commit (observed: `sentry-instrument` grew 131→196 lines mid-audit).
- **Enumerate all 94 in the index** — rejected: ~2,019 always-on tokens per session versus ~1,120, to solve a discovery-cueing problem one pointer line solves.
- **Vendor the mattpocock set into devkit** — rejected (OQ-04): forfeits upstream updates and converts a lockfile dependency into 39 forked files.

## Consequences

- `health()` and the index deliberately report different counts (94 traversable vs 44 listed); gates must not equate them.
- A name collision across roots is refused loudly (`AMBIGUOUS_SKILL`), never resolved by root order; wrappers reference their vendored target in qualified form (`agents:tdd`).
- The Portability Test governs promotion of org-authored skills only; a vendored skill is never promoted — it is upgraded by re-install.
