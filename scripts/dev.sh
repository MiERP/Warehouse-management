#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Warehouse Management development services..." >&2
if [ -d "$ROOT_DIR/apps/api" ]; then
  (cd "$ROOT_DIR/apps/api" && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
  API_PID=$!
else
  echo "apps/api not found" >&2
  API_PID=""
fi

if [ -d "$ROOT_DIR/apps/web" ]; then
  (cd "$ROOT_DIR/apps/web" && npm run dev) &
  WEB_PID=$!
else
  echo "apps/web not found" >&2
  WEB_PID=""
fi

trap '[[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true; [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true' EXIT
wait
