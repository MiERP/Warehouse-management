# Production Hardening Plan

## Branching strategy
- Stable tag: `v0.1.0-mvp`
- Development branch: `hardening/v0.2`
- `main` remains the rollback-safe MVP line until hardening passes QA.

## Goals
1. Protect data quality with validation in the main process.
2. Make Excel import safer and observable.
3. Reduce renderer injection risks from dynamic HTML.
4. Add audit logs for data-changing operations.
5. Add database backup/restore APIs and UI entry points.
6. Track schema migrations with a version table.
7. Add repeatable smoke tests for search, CRUD, import/export and backup.

## Phase 1 — Safety baseline
- Add npm scripts for syntax checks and smoke tests.
- Keep a rollback tag before changes.

## Phase 2 — Validation layer
- Add `src/main/validation` modules.
- Validate create/update payloads for all domain modules.
- Normalize numbers, nullable IDs and year values.

## Phase 3 — Audit logs
- Add `audit_logs` table.
- Record create/update/delete/import/export/backup/restore operations.

## Phase 4 — Safer import/export
- Validate imported rows before DB insert.
- Return user-visible import summaries.
- Log import/export events.

## Phase 5 — Renderer safety
- Add reusable HTML escaping helper.
- Use safe rendering for search/import preview and high-risk dynamic output.

## Phase 6 — Backup/restore and migrations
- Add backup/restore IPC APIs.
- Add `schema_migrations` version tracking.

## Phase 7 — Testing
- Add all-in-one smoke test covering:
  - Electron launch
  - Smart Search
  - CRUD validation
  - Search index sync
  - Backup creation
  - Import/export smoke path

## Release gates
- `npm run check`
- `npm run test:search`
- `npm run test:smoke`
- Manual import/export QA
- Manual form/search click QA

## Rollback
- `git checkout v0.1.0-mvp`
- Or create a restore branch: `git checkout -b restore/v0.1.0-mvp v0.1.0-mvp`
