#!/usr/bin/env bash
# Fail-closed BL4 Forge schema gate (Sprint 1 contracts).
# Prefer npm so Windows Node is resolved the same way as feature-gate web steps.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/examples/web"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found; install Node.js or set PATH" >&2
  exit 1
fi

if [[ ! -d node_modules/ajv ]]; then
  npm ci
fi

npm run validate:schemas
