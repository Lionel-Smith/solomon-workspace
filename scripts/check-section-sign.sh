#!/bin/bash
# SKE-R-05 (D10): fail the commit if any staged file adds the section-sign
# character (U+00A7). Write "section N" instead. Exit 2 per HFS hook rules;
# HFS_HOOK_MODE=warn downgrades to a warning.
set -uo pipefail
CHAR=$(printf '\xc2\xa7')
hits=$(git diff --cached -U0 | grep '^+' | grep -F "$CHAR" | head -5 || true)
if [ -n "$hits" ]; then
  echo "section-sign character (U+00A7) in staged changes — write 'section N' instead:" >&2
  echo "$hits" >&2
  [ "${HFS_HOOK_MODE:-block}" = "warn" ] && exit 0
  exit 2
fi
exit 0
