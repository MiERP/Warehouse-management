# Testing, Seed Data, and Packaging

## Test Plan

See `tests/TEST_PLAN.md` for backend, frontend, packaging, backup, Excel, and PDF coverage.

## Seed Sample Data

Create a local dev/test SQLite database with sample Vietnamese data:

```bash
python scripts/seed_sample_data.py --db ./database/dev.db
python scripts/smoke_sqlite.py --db ./database/dev.db
```

Add `--include-admin` only for test databases that need a placeholder `admin` row. The real installer must not create the production database/admin before setup wizard confirmation.

## Packaging Commands

```bash
bash scripts/packaging/build-backend.sh
bash scripts/packaging/build-web.sh
```

On Windows:

```powershell
ISCC.exe installer\inno\warehouse-management.iss
powershell.exe -NoProfile -ExecutionPolicy Bypass -File installer\windows-service\install-service.ps1 -InstallDir "C:\Program Files\Warehouse Management"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File installer\windows-service\register-backup-task.ps1
```

## Current Constraints

- `scripts/packaging/warehouse-api.spec` expects `apps/api/app/main.py` once backend implementation is complete.
- `scripts/packaging/build-web.sh` expects `apps/web` once frontend implementation is complete.
