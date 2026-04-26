# Test Plan — Warehouse Management MVP

## Scope

Covers the agreed MVP stack: FastAPI backend, React frontend, SQLite admin-only database, ReportLab PDF export, Excel import/export, PyInstaller packaging, Windows service hosting, Inno Setup installer, and scheduled backups.

## Test Levels

### Backend API

- Authentication: login/logout, `GET /api/auth/me`, password change, protected route rejection.
- Admin-only model: no public user/role/permission creation routes; username remains fixed as `admin`.
- Configuration data: units tree CRUD, province/commune filtering, catalog CRUD with unique `category + code`.
- Warehouse data: CRUD, soft delete, search/filter, relationships to unit/province/commune/catalogs.
- Camera/fire/construction modules: CRUD, soft delete, warehouse/unit relationships, status and need fields.
- Import/export: Excel template validation, invalid-row reporting, export columns and Vietnamese text preservation.
- PDF reports: generated file opens, contains requested filters/summary, Unicode Vietnamese text renders.
- Backup/restore: backup creates a timestamped SQLite copy; restore validates file before replacing active DB.

### Frontend

- Login/logout and password change flows.
- Dashboard renders aggregate cards and empty/loading/error states.
- CRUD forms validate required fields and preserve entered Vietnamese text.
- Tree/unit filters and province/commune dependent comboboxes update correctly.
- Import/export/report buttons show success and failure feedback.

### Packaging & Install

- PyInstaller builds a backend executable with all FastAPI dependencies.
- Windows service installs, starts, stops, and removes cleanly.
- Inno Setup installs bundled backend, web build, service scripts, and default config.
- Installer does not create the production database before the setup wizard confirmation.
- Scheduled backup task is installed only when user opts in or setup config enables it.

## Smoke Checklist

1. Install app on a clean Windows VM.
2. Start service and confirm health endpoint responds on `127.0.0.1`.
3. Complete setup wizard; create SQLite database in a user-selected folder.
4. Log in with `admin` / `admin` and change password.
5. Create a province, commune, unit, catalog items, and warehouse.
6. Add camera, fire system, and construction project linked to the warehouse.
7. Export Excel and PDF reports; open generated files.
8. Run backup task; verify timestamped backup file exists.
9. Stop/start service; confirm data persists.
10. Uninstall; confirm service and scheduled task are removed.

## Suggested Commands

```bash
./scripts/test.sh
python scripts/seed_sample_data.py --db ./database/dev.db
python scripts/smoke_sqlite.py --db ./database/dev.db
bash scripts/packaging/build-backend.sh
bash scripts/packaging/build-web.sh
```
