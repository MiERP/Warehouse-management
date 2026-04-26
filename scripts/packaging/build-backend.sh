#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f "apps/api/app/main.py" ]; then
  echo "apps/api/app/main.py not found; backend entrypoint must exist before packaging." >&2
  exit 1
fi

python -m PyInstaller scripts/packaging/warehouse-api.spec --clean --noconfirm
