#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -d "$ROOT_DIR/apps/api" ]; then
  echo "Running backend tests..." >&2
  (cd "$ROOT_DIR/apps/api" && python -m pytest)
fi

if [ -d "$ROOT_DIR/apps/web" ]; then
  echo "Running frontend checks..." >&2
  (cd "$ROOT_DIR/apps/web" && npm test -- --run || npm run build)
fi
