#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"

if [ ! -d "$WEB_DIR" ]; then
  echo "apps/web not found; frontend must exist before packaging." >&2
  exit 1
fi

(cd "$WEB_DIR" && npm ci && npm run build)
