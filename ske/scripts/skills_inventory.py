#!/usr/bin/env python3
"""SKE-00 skills inventory — shape metrics + drift matrix across every skill root.

Read-only. Deterministic: same tree in, byte-identical JSON out (no timestamps,
no mtimes in the emitted document beyond the per-file mtime we deliberately
record for drift recency).

Deps: stdlib only, with an optional PyYAML fast path for frontmatter. The
built-in parser handles the subset HFS skills actually use (scalars, block
scalars, inline + block sequences), so the script runs on a bare python3.

Usage:
    python3 scripts/skills_inventory.py            # writes ../skills_inventory.json
    python3 scripts/skills_inventory.py --stdout   # summary table only
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path

try:
    import yaml as _yaml
except ImportError:
    _yaml = None

HOME = Path.home()
WORKSPACE = Path(__file__).resolve().parents[2]

# --- roots -----------------------------------------------------------------
# order matters: `devkit` is canonical, so it wins "authoritative" comparisons.
ROOTS: list[tuple[str, Path]] = [
    ("devkit", WORKSPACE / "hfs-development-kit" / "skills"),
    ("runtime", HOME / ".claude" / "skills"),
    ("agents", HOME / ".agents" / "skills"),
    ("solomon-repo", WORKSPACE / "solomon" / "skills"),
    ("workspace", WORKSPACE / ".claude" / "skills"),
    ("hfs-legacy", HOME / ".hfs" / "skills"),
]

PLUGIN_CACHE = HOME / ".claude" / "plugins" / "cache"

# Frontmatter keys the devkit's own template declares (SKILL_TEMPLATE_v1.9.md).
TEMPLATE_KEYS = ["name", "version", "description", "allowed-tools", "model", "hooks"]
# Frontmatter keys the SKE-00 brief assumed as "HFS v2.0 schema".
ASSUMED_V2_KEYS = [
    "name",
    "description",
    "version",
    "author",
    "date",
    "phase",
    "triggers",
    "related_skills",
]

MENTION_PATTERNS = {
    "mentions_tdd": r"\btdd\b|test[- ]driven|red[- ]green[- ]refactor",
    "mentions_worktree": r"worktree",
    "mentions_code_review": r"code[- ]review|/review\b|reviewer",
    "mentions_completion_criteria": (
        r"completion criteria|success criteria|definition of done|"
        r"acceptance criteria|exit criteria"
    ),
}

DISCLOSURE_DIRS = {
    "has_references_dir": ("references", "reference"),
    "has_scripts_dir": ("scripts",),
    "has_assets_dir": ("assets", "templates"),
    "has_evals": ("evals", "eval", "tests", "test"),
}


# --- frontmatter ------------------------------------------------------------
def split_frontmatter(text: str) -> tuple[str, str]:
    """Return (frontmatter_block, body). Empty frontmatter if none present."""
    if not text.startswith("---"):
        return "", text
    lines = text.split("\n")
    if lines[0].strip() != "---":
        return "", text
    for i in range(1, len(lines)):
        if lines[i].strip() in ("---", "..."):
            return "\n".join(lines[1:i]), "\n".join(lines[i + 1 :])
    return "", text


def yaml_validity(block: str) -> tuple[bool | None, str | None]:
    """Would Solomon's SkillParser accept this frontmatter?

    solomon_mcp/utils/skill_parser.py feeds the frontmatter straight to
    yaml.safe_load; anything that raises there degrades the skill to
    name="SKILL", description="Skill loaded from SKILL.md" in skills://index.
    Returns (None, None) when PyYAML is unavailable, so a bare-python3 run
    reports "unknown" rather than a false pass.
    """
    if _yaml is None:
        return None, None
    if not block.strip():
        return None, None
    try:
        _yaml.safe_load(block)
    except _yaml.YAMLError as exc:
        return False, str(exc).split("\n")[0]
    return True, None


def parse_frontmatter(block: str) -> dict:
    """Parse a YAML frontmatter block.

    Uses PyYAML when importable; otherwise a small parser covering the subset
    HFS skills use: `key: scalar`, `key: |` / `key: >` block scalars,
    `key: [a, b]` inline sequences, and `key:` followed by `- item` lines.
    Nested mappings (e.g. `hooks:`) are recorded as present with a raw value.
    """
    if not block.strip():
        return {}
    if _yaml is not None:
        try:
            loaded = _yaml.safe_load(block)
        except _yaml.YAMLError:
            loaded = None
        if isinstance(loaded, dict):
            return loaded
        # fall through to the manual parser on malformed YAML

    out: dict = {}
    lines = block.split("\n")
    i = 0
    top = re.compile(r"^([A-Za-z0-9_.-]+):\s*(.*)$")
    while i < len(lines):
        m = top.match(lines[i])
        if not m:
            i += 1
            continue
        key, rest = m.group(1), m.group(2).strip()
        i += 1
        if rest in ("|", "|-", "|+", ">", ">-", ">+"):
            buf = []
            while i < len(lines) and (lines[i].startswith((" ", "\t")) or not lines[i].strip()):
                buf.append(lines[i].strip())
                i += 1
            out[key] = "\n".join(buf).strip()
        elif rest:
            out[key] = rest.strip("\"'")
        else:
            items = []
            saw_nested = False
            while i < len(lines) and (lines[i].startswith((" ", "\t")) or not lines[i].strip()):
                stripped = lines[i].strip()
                if stripped.startswith("- "):
                    items.append(stripped[2:].strip("\"'"))
                elif stripped:
                    saw_nested = True
                i += 1
            if items:
                out[key] = items
            else:
                out[key] = "<nested>" if saw_nested else ""
    return out


def description_text(fm: dict) -> str:
    desc = fm.get("description", "")
    if isinstance(desc, str):
        return desc.strip()
    if isinstance(desc, list):
        return " ".join(str(d) for d in desc).strip()
    return str(desc).strip() if desc else ""


# --- collection -------------------------------------------------------------
def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def discover_plugin_roots() -> list[tuple[str, Path]]:
    """Installed-plugin skill dirs, from installed_plugins.json (not the whole cache)."""
    manifest = HOME / ".claude" / "plugins" / "installed_plugins.json"
    if not manifest.is_file():
        return []
    try:
        data = json.loads(manifest.read_text())
    except (OSError, json.JSONDecodeError):
        return []
    roots = []
    for plugin_id, entries in sorted(data.get("plugins", {}).items()):
        for entry in entries:
            install_path = entry.get("installPath")
            if not install_path:
                continue
            skills_dir = Path(install_path) / "skills"
            if skills_dir.is_dir():
                roots.append((f"plugin:{plugin_id.split('@')[0]}", skills_dir))
    return roots


def scan_root(label: str, root: Path) -> dict:
    """Return {'exists', 'realpath', 'entries': {name: record}} for one root."""
    info = {
        "label": label,
        "path": str(root),
        "exists": root.is_dir(),
        "realpath": str(root.resolve()) if root.exists() else None,
        "is_symlink": root.is_symlink(),
        "entries": {},
        "legacy_skill_files": [],
    }
    if not info["exists"]:
        return info

    for child in sorted(root.iterdir()):
        if child.name.startswith("."):
            continue
        if child.is_file() and child.suffix == ".skill":
            info["legacy_skill_files"].append(child.name)
            continue
        if not child.is_dir():
            continue
        skill_md = child / "SKILL.md"
        if not skill_md.is_file():
            continue
        info["entries"][child.name] = build_record(label, child, skill_md)
    return info


def build_record(root_label: str, skill_dir: Path, skill_md: Path) -> dict:
    raw = skill_md.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    fm_block, body = split_frontmatter(text)
    fm = parse_frontmatter(fm_block)
    yaml_ok, yaml_err = yaml_validity(fm_block)
    desc = description_text(fm)

    real_dir = skill_dir.resolve()
    lowered = text.lower()

    sub_files = [
        str(p.relative_to(real_dir))
        for p in sorted(real_dir.rglob("*"))
        if p.is_file() and p.name != "SKILL.md" and ".git" not in p.parts
    ]

    record = {
        "name": skill_dir.name,
        "root": root_label,
        "path": str(skill_dir),
        "real_path": str(real_dir),
        "is_symlink": skill_dir.is_symlink(),
        "symlink_target": os.readlink(skill_dir) if skill_dir.is_symlink() else None,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "mtime": int(skill_md.stat().st_mtime),
        "bytes": len(raw),
        "lines": text.count("\n") + (0 if text.endswith("\n") else 1),
        "est_tokens": round(len(raw) / 4),
        "body_bytes": len(body.encode("utf-8")),
        "has_frontmatter": bool(fm_block.strip()),
        "frontmatter_yaml_valid": yaml_ok,
        "frontmatter_yaml_error": yaml_err,
        "frontmatter_keys": sorted(str(k) for k in fm.keys()),
        "declared_name": str(fm.get("name", "")) or None,
        "name_matches_dir": str(fm.get("name", "")) == skill_dir.name,
        "description_chars": len(desc),
        "description_tokens": round(len(desc) / 4),
        "upstream_pin": (str(fm["upstream"]) if "upstream" in fm else None),
        "missing_template_keys": [k for k in TEMPLATE_KEYS if k not in fm],
        "missing_assumed_v2_keys": [k for k in ASSUMED_V2_KEYS if k not in fm],
        "sub_file_count": len(sub_files),
        "sub_files": sub_files[:50],
        "monolithic": len(sub_files) == 0,
    }

    for flag, dirnames in DISCLOSURE_DIRS.items():
        record[flag] = any((real_dir / d).is_dir() for d in dirnames)

    for flag, pattern in MENTION_PATTERNS.items():
        record[flag] = bool(re.search(pattern, lowered))

    return record


# --- drift ------------------------------------------------------------------
def build_drift(roots: list[dict]) -> list[dict]:
    by_name: dict[str, dict[str, dict]] = {}
    for root in roots:
        for name, rec in root["entries"].items():
            by_name.setdefault(name, {})[root["label"]] = rec

    drift = []
    for name in sorted(by_name):
        per_root = by_name[name]
        # collapse roots whose realpath is identical — a symlink is not a copy.
        real_to_labels: dict[str, list[str]] = {}
        for label, rec in per_root.items():
            real_to_labels.setdefault(rec["real_path"], []).append(label)
        shas = {rec["sha256"] for rec in per_root.values()}
        drift.append(
            {
                "name": name,
                "roots": sorted(per_root),
                "distinct_realpaths": len(real_to_labels),
                "distinct_copies": {
                    real: sorted(labels) for real, labels in sorted(real_to_labels.items())
                },
                "identical": len(shas) == 1,
                "sha_by_root": {label: rec["sha256"][:12] for label, rec in sorted(per_root.items())},
                "newest_mtime": max(rec["mtime"] for rec in per_root.values()),
                "in_devkit": "devkit" in per_root,
                "devkit_sha_match": (
                    None
                    if "devkit" not in per_root
                    else all(rec["sha256"] == per_root["devkit"]["sha256"] for rec in per_root.values())
                ),
            }
        )
    return drift


# --- reporting --------------------------------------------------------------
def summarize(records: list[dict]) -> dict:
    n = len(records)
    if n == 0:
        return {"unique_skills": 0}
    lines = [r["lines"] for r in records]
    descs = [r["description_chars"] for r in records]
    return {
        "unique_skills": n,
        "total_lines": sum(lines),
        "total_bytes": sum(r["bytes"] for r in records),
        "total_est_tokens": sum(r["est_tokens"] for r in records),
        "avg_lines": round(sum(lines) / n, 1),
        "median_lines": sorted(lines)[n // 2],
        "max_lines": max(lines),
        "avg_description_chars": round(sum(descs) / n, 1),
        "median_description_chars": sorted(descs)[n // 2],
        "index_cost_tokens": sum(r["description_tokens"] for r in records),
        "monolithic_count": sum(1 for r in records if r["monolithic"]),
        "with_references_dir": sum(1 for r in records if r["has_references_dir"]),
        "with_scripts_dir": sum(1 for r in records if r["has_scripts_dir"]),
        "with_assets_dir": sum(1 for r in records if r["has_assets_dir"]),
        "with_evals": sum(1 for r in records if r["has_evals"]),
        "no_frontmatter": sum(1 for r in records if not r["has_frontmatter"]),
        "frontmatter_yaml_invalid": sum(
            1 for r in records if r["frontmatter_yaml_valid"] is False
        ),
        "name_mismatch": sum(1 for r in records if not r["name_matches_dir"]),
        "mentions_tdd": sum(1 for r in records if r["mentions_tdd"]),
        "mentions_worktree": sum(1 for r in records if r["mentions_worktree"]),
        "mentions_code_review": sum(1 for r in records if r["mentions_code_review"]),
        "mentions_completion_criteria": sum(
            1 for r in records if r["mentions_completion_criteria"]
        ),
    }


def print_report(doc: dict) -> None:
    w = sys.stdout.write
    w("=" * 74 + "\n")
    w("SKILL ROOTS\n")
    w("=" * 74 + "\n")
    w(f"{'label':<26} {'skills':>6}  {'legacy':>6}  path\n")
    for root in doc["roots"]:
        if not root["exists"]:
            w(f"{root['label']:<26} {'ABSENT':>6}  {'-':>6}  {root['path']}\n")
            continue
        alias = "  (symlink)" if root["is_symlink"] else ""
        w(
            f"{root['label']:<26} {len(root['entries']):>6}  "
            f"{len(root['legacy_skill_files']):>6}  {root['path']}{alias}\n"
        )

    s = doc["summary"]
    w("\n" + "=" * 74 + "\n")
    w("SHAPE METRICS (unique skills, deduped by realpath)\n")
    w("=" * 74 + "\n")
    for key in (
        "unique_skills",
        "total_lines",
        "total_est_tokens",
        "avg_lines",
        "median_lines",
        "max_lines",
        "avg_description_chars",
        "median_description_chars",
        "index_cost_tokens",
        "monolithic_count",
        "with_references_dir",
        "with_scripts_dir",
        "with_assets_dir",
        "with_evals",
        "no_frontmatter",
        "name_mismatch",
        "mentions_tdd",
        "mentions_worktree",
        "mentions_code_review",
        "mentions_completion_criteria",
    ):
        w(f"  {key:<32} {s.get(key)}\n")

    recs = doc["skills"]
    w("\n--- top 6 by lines ---\n")
    for r in sorted(recs, key=lambda x: -x["lines"])[:6]:
        w(f"  {r['lines']:>5}  {r['root']:<14} {r['name']}\n")
    w("\n--- top 6 by description_chars ---\n")
    for r in sorted(recs, key=lambda x: -x["description_chars"])[:6]:
        w(f"  {r['description_chars']:>5}  {r['root']:<14} {r['name']}\n")

    w("\n" + "=" * 74 + "\n")
    w("DRIFT\n")
    w("=" * 74 + "\n")
    divergent = [d for d in doc["drift"] if d["distinct_realpaths"] > 1 and not d["identical"]]
    w(f"  names with >1 distinct copy: "
      f"{sum(1 for d in doc['drift'] if d['distinct_realpaths'] > 1)}\n")
    w(f"  divergent (different sha):   {len(divergent)}\n")
    for d in divergent:
        w(f"    ! {d['name']}: {d['sha_by_root']}\n")
    w(f"  in devkit, not in runtime:   {doc['coverage']['devkit_not_installed']}\n")
    w(f"  in runtime, not in devkit:   {len(doc['coverage']['runtime_not_in_devkit'])}\n")


SKILL_LOCK_PATH = HOME / ".agents" / ".skill-lock.json"


def build_coverage(scanned: list[dict]) -> dict:
    """D5 enforcement field: org-authored (devkit) reachability.

    Reachable = frontmatter YAML parses (invalid YAML makes a skill
    unfindable by search - the SKE-R-02 bug class). Report-only until
    SKE-02 sets the floor: vendored skills never enter this population
    (ADR-0002).
    """
    devkit = next((r for r in scanned if r["label"] == "devkit"), None)
    entries = list(devkit["entries"].values()) if devkit else []
    unreachable = [
        {"name": r["name"], "reason": r["frontmatter_yaml_error"] or "invalid frontmatter"}
        for r in entries
        if r["frontmatter_yaml_valid"] is False
    ]
    return {
        "total": len(entries),
        "reachable": len(entries) - len(unreachable),
        "unreachable": sorted(unreachable, key=lambda u: u["name"]),
    }


def build_name_collisions(scanned: list[dict]) -> list[str]:
    """Q4 tripwire: bare names present in BOTH devkit and ~/.agents/skills.

    Any name here resolves only via qualified form (devkit:x / agents:x);
    the server returns AMBIGUOUS_SKILL for the bare name.
    """
    devkit = next((r for r in scanned if r["label"] == "devkit"), None)
    agents = next((r for r in scanned if r["label"] == "agents"), None)
    if not devkit or not agents:
        return []
    return sorted(set(devkit["entries"]) & set(agents["entries"]))


def build_upstream_drift(scanned: list[dict]) -> list[dict]:
    """Q3 report-only field: frontmatter `upstream:` pins vs live lockfile.

    Devkit wrapper skills may pin an upstream vendored hash (SKE-07). A pin
    that no longer prefixes the lockfile's skillFolderHash means upstream
    moved - reported, never enforced.
    """
    try:
        lock = json.loads(SKILL_LOCK_PATH.read_text()).get("skills", {})
    except (OSError, ValueError):
        lock = {}
    devkit = next((r for r in scanned if r["label"] == "devkit"), None)
    drift: list[dict] = []
    for rec in (devkit["entries"].values() if devkit else []):
        pin = rec.get("upstream_pin")
        if not pin:
            continue
        # pin forms: "<name>@<hash-prefix>" or bare "<hash-prefix>"
        target, _, pinned_hash = pin.rpartition("@")
        target = target or rec["name"]
        lock_hash = (lock.get(target) or {}).get("skillFolderHash")
        if lock_hash is None:
            status = "lock_missing"
        elif lock_hash.startswith(pinned_hash):
            status = "match"
        else:
            status = "drift"
        drift.append({
            "name": rec["name"],
            "pin": pin,
            "lock_hash": lock_hash,
            "status": status,
        })
    return sorted(drift, key=lambda d: d["name"])


def main() -> int:
    ap = argparse.ArgumentParser(description="SKE-00 skills inventory")
    ap.add_argument("--stdout", action="store_true", help="report only, do not write JSON")
    ap.add_argument(
        "--coverage-floor",
        type=int,
        default=0,
        help="fail (exit 1) when org-authored reachable count is below this "
        "(default 0 = report-only until SKE-02 sets the floor)",
    )
    ap.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parents[1] / "skills_inventory.json"),
        help="output JSON path",
    )
    args = ap.parse_args()

    all_roots = ROOTS + discover_plugin_roots()
    scanned = [scan_root(label, path) for label, path in all_roots]

    # unique skills = one record per distinct realpath, preferring the earliest root
    seen: dict[str, dict] = {}
    for root in scanned:
        for rec in root["entries"].values():
            seen.setdefault(rec["real_path"], rec)
    records = sorted(seen.values(), key=lambda r: (r["root"], r["name"]))

    devkit = next((r for r in scanned if r["label"] == "devkit"), None)
    runtime = next((r for r in scanned if r["label"] == "runtime"), None)
    devkit_names = set(devkit["entries"]) if devkit else set()
    runtime_names = set(runtime["entries"]) if runtime else set()

    doc = {
        "schema_version": 1,
        "workspace": str(WORKSPACE),
        "yaml_backend": "pyyaml" if _yaml is not None else "builtin",
        # Every field except frontmatter_yaml_{valid,error} is interpreter-
        # independent. Those three need PyYAML, so only a pyyaml run is a valid
        # SKE-10 baseline; a builtin run still gives identical shape/drift data.
        "baseline_comparable": _yaml is not None,
        "roots": scanned,
        "skills": records,
        "drift": build_drift(scanned),
        "coverage": {
            "devkit_not_installed": sorted(devkit_names - runtime_names),
            "runtime_not_in_devkit": sorted(runtime_names - devkit_names),
        },
        "summary": summarize(records),
        "name_collisions": build_name_collisions(scanned),
        "upstream_drift": build_upstream_drift(scanned),
    }
    # Reachability fields merge into the existing install-coverage dict
    # (SKE-01: coverage.{reachable,total,unreachable} over org-authored)
    doc["coverage"].update(build_coverage(scanned))

    print_report(doc)

    if not args.stdout:
        out = Path(args.out)
        out.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n")
        sys.stdout.write(f"\nwrote {out} ({out.stat().st_size} bytes)\n")

    if _yaml is None:
        sys.stderr.write(
            "\nNOTE: PyYAML unavailable — frontmatter_yaml_valid/_error are null and this\n"
            "run is NOT baseline-comparable. Re-run with an interpreter that has PyYAML\n"
            "(e.g. solomon/.venv/bin/python3) to regenerate the canonical baseline.\n"
        )

    # Validity guard (SKE-R-02): invalid frontmatter makes a skill unfindable
    # by search_skills - fail the run so regressions can't land silently.
    invalid = [
        r["name"] for r in records if r["frontmatter_yaml_valid"] is False
    ]
    if invalid:
        sys.stderr.write(
            f"\nERROR: {len(invalid)} skill(s) with invalid frontmatter YAML: "
            + ", ".join(sorted(invalid)) + "\n"
        )
        return 1

    # Coverage floor (SKE-01): report-only at floor 0; SKE-02 raises it
    if doc["coverage"]["reachable"] < args.coverage_floor:
        sys.stderr.write(
            f"\nERROR: coverage {doc['coverage']['reachable']}/"
            f"{doc['coverage']['total']} below floor {args.coverage_floor}\n"
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
