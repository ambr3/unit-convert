#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  node --test test/logic.test.mjs
elif [[ -x /home/ambr3/ambr3-dev/tools/nvm/versions/node/v24.21.0/bin/node ]]; then
  /home/ambr3/ambr3-dev/tools/nvm/versions/node/v24.21.0/bin/node --test test/logic.test.mjs
else
  echo "node not found" >&2
  exit 1
fi
