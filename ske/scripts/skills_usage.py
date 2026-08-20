#!/usr/bin/env python3
"""SKE-00 skills usage telemetry — what actually got invoked, from session transcripts.

Streams ~/.claude/projects/**/*.jsonl and counts, per skill:
  - Skill tool invocations           (tool_use name == "Skill", input.skill)
  - slash-command invocations        (<command-name>/x</command-name> in user turns)
  - MCP skill-loader calls           (*load_skill*/*list_skills*/*search_skills*)
  - SKILL.md reads                   (Read/Bash referencing a SKILL.md path)

Read-only. Deps: stdlib only. Re-runnable for SKE-10 baseline comparison.

The observable window is bounded by transcript retention, not by --days; the
emitted JSON records the true first/last timestamp seen so a later run can tell
"not used" apart from "not retained".
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

PROJECTS = Path.home() / ".claude" / "projects"

# cheap substring gate — skip lines that cannot contain a signal
PREFILTER = ("Skill", "SKILL.md", "command-name", "load_skill", "skills")

CMD_RE = re.compile(r"<command-name>/?([A-Za-z0-9:_-]+)")
SKILL_MD_RE = re.compile(r"skills/([A-Za-z0-9._-]+)/SKILL\.md")


def iter_records(path: Path):
    with path.open("r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if not any(tok in line for tok in PREFILTER):
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def content_blocks(rec: dict):
    msg = rec.get("message")
    if not isinstance(msg, dict):
        return []
    content = msg.get("content")
    if isinstance(content, list):
        return [c for c in content if isinstance(c, dict)]
    return []


class Counter:
    def __init__(self) -> None:
        self.skill_tool: dict[str, int] = defaultdict(int)
        self.slash: dict[str, int] = defaultdict(int)
        self.mcp: dict[str, int] = defaultdict(int)
        self.md_read: dict[str, int] = defaultdict(int)
        self.last_seen: dict[str, str] = {}
        self.first_ts = None
        self.last_ts = None
        self.lines = 0
        self.files = 0

    def note(self, key: str, ts: str | None) -> None:
        if ts and (key not in self.last_seen or ts > self.last_seen[key]):
            self.last_seen[key] = ts

    def bound(self, ts: str | None) -> None:
        if not ts:
            return
        if self.first_ts is None or ts < self.first_ts:
            self.first_ts = ts
        if self.last_ts is None or ts > self.last_ts:
            self.last_ts = ts


def scan(counter: Counter, path: Path) -> None:
    counter.files += 1
    for rec in iter_records(path):
        counter.lines += 1
        ts = rec.get("timestamp")
        counter.bound(ts)

        for block in content_blocks(rec):
            btype = block.get("type")

            if btype == "tool_use":
                name = block.get("name") or ""
                inp = block.get("input") or {}

                if name == "Skill" and isinstance(inp, dict):
                    skill = str(inp.get("skill") or "").strip()
                    if skill:
                        counter.skill_tool[skill] += 1
                        counter.note(skill, ts)

                elif "load_skill" in name or "list_skills" in name or "search_skills" in name:
                    counter.mcp[name] += 1
                    if isinstance(inp, dict):
                        target = str(inp.get("skill_name") or inp.get("name") or "").strip()
                        if target:
                            counter.mcp[f"{name}:{target}"] += 1
                            counter.note(target, ts)

                elif isinstance(inp, dict):
                    blob = " ".join(
                        str(v) for v in (inp.get("file_path"), inp.get("command"), inp.get("path"))
                        if v
                    )
                    for m in SKILL_MD_RE.finditer(blob):
                        counter.md_read[m.group(1)] += 1
                        counter.note(m.group(1), ts)

            elif btype == "text":
                text = block.get("text") or ""
                if "<command-name>" in text:
                    for m in CMD_RE.finditer(text):
                        counter.slash[m.group(1)] += 1
                        counter.note(m.group(1), ts)

        # user turns carry command-name in a plain string content field
        msg = rec.get("message")
        if isinstance(msg, dict) and isinstance(msg.get("content"), str):
            text = msg["content"]
            if "<command-name>" in text:
                for m in CMD_RE.finditer(text):
                    counter.slash[m.group(1)] += 1
                    counter.note(m.group(1), ts)


def main() -> int:
    ap = argparse.ArgumentParser(description="SKE-00 skills usage telemetry")
    ap.add_argument("--out", default=str(Path(__file__).resolve().parents[1] / "skills_usage.json"))
    ap.add_argument("--stdout", action="store_true")
    args = ap.parse_args()

    if not PROJECTS.is_dir():
        sys.stderr.write(f"no transcript root at {PROJECTS}\n")
        return 1

    counter = Counter()
    for path in sorted(PROJECTS.rglob("*.jsonl")):
        scan(counter, path)

    combined: dict[str, int] = defaultdict(int)
    for src in (counter.skill_tool, counter.slash, counter.md_read):
        for k, v in src.items():
            combined[k] += v

    doc = {
        "schema_version": 1,
        "transcript_root": str(PROJECTS),
        "files_scanned": counter.files,
        "candidate_lines": counter.lines,
        "window_first_timestamp": counter.first_ts,
        "window_last_timestamp": counter.last_ts,
        "skill_tool_invocations": dict(sorted(counter.skill_tool.items(), key=lambda x: -x[1])),
        "slash_invocations": dict(sorted(counter.slash.items(), key=lambda x: -x[1])),
        "mcp_skill_calls": dict(sorted(counter.mcp.items(), key=lambda x: -x[1])),
        "skill_md_reads": dict(sorted(counter.md_read.items(), key=lambda x: -x[1])),
        "combined": dict(sorted(combined.items(), key=lambda x: -x[1])),
        "last_seen": counter.last_seen,
    }

    w = sys.stdout.write
    w(f"scanned {counter.files} transcripts, {counter.lines} candidate lines\n")
    w(f"window: {counter.first_ts} .. {counter.last_ts}\n\n")
    w("--- Skill tool invocations ---\n")
    for k, v in list(doc["skill_tool_invocations"].items())[:40]:
        w(f"  {v:>5}  {k}\n")
    w("\n--- slash invocations (top 40) ---\n")
    for k, v in list(doc["slash_invocations"].items())[:40]:
        w(f"  {v:>5}  /{k}\n")
    w("\n--- MCP skill-loader calls ---\n")
    for k, v in list(doc["mcp_skill_calls"].items())[:25]:
        w(f"  {v:>5}  {k}\n")
    w("\n--- SKILL.md reads (top 25) ---\n")
    for k, v in list(doc["skill_md_reads"].items())[:25]:
        w(f"  {v:>5}  {k}\n")

    if not args.stdout:
        out = Path(args.out)
        out.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n")
        w(f"\nwrote {out}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
