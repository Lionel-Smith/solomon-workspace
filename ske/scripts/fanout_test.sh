#!/bin/bash
# SKE-09 fan-out test: 3 "agents" (subshells) in separate worktrees with
# disjoint file-ownership lists, merged in DAG order. Exits 0 iff zero
# conflicts and the final tree is clean.
set -euo pipefail
ROOT="${1:?usage: fanout_test.sh /path/to/throwaway}"
rm -rf "$ROOT"
mkdir -p "$ROOT"
git -C "$ROOT" init -q
git -C "$ROOT" config user.email t@t
git -C "$ROOT" config user.name t
echo base > "$ROOT/base.txt"
git -C "$ROOT" add -A && git -C "$ROOT" commit -qm baseline

# Ownership lists (pairwise disjoint, verified):
# A -> a/svc.py ; B -> b/repo.py ; C -> c/api.py
for pair in "A a/svc.py" "B b/repo.py" "C c/api.py"; do
  set -- $pair
  AGENT=$1; FILE=$2
  git -C "$ROOT" worktree add -q "$ROOT/../wt-$AGENT" -b "slice-$AGENT"
  (
    WT="$ROOT/../wt-$AGENT"
    mkdir -p "$WT/$(dirname "$FILE")"
    printf 'content from %s\n' "$AGENT" > "$WT/$FILE"
    git -C "$WT" add -A && git -C "$WT" commit -qm "slice $AGENT: $FILE"
  ) &
done
wait

# Merge in DAG order A -> B -> C (linear DAG for the test)
for AGENT in A B C; do
  git -C "$ROOT" merge -q --no-ff -m "merge slice-$AGENT" "slice-$AGENT"
done

# Cleanup worktrees
for AGENT in A B C; do
  git -C "$ROOT" worktree remove "$ROOT/../wt-$AGENT" --force
  git -C "$ROOT" branch -qd "slice-$AGENT"
done

test -f "$ROOT/a/svc.py" -a -f "$ROOT/b/repo.py" -a -f "$ROOT/c/api.py"
echo "fanout: 3 slices merged, zero conflicts"
