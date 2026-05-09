# Production Hardening Report

## Branch and rollback
- Stable rollback tag: `v0.1.0-mvp`
- Development branch: `hardening/v0.2`

## Implemented
- Main-process validation layer for warehouses, cameras, fire systems and constructions.
- Audit log table and write path for create/update/delete/export/backup operations.
- Schema migration tracking table: `schema_migrations`.
- Backup history table and backup/restore IPC APIs.
- Safer Excel file path guard: reads/writes must come from application file dialogs.
- Import preview HTML escaping and import error report modal.
- npm scripts: `check`, `test:search`, `test:smoke`, `test`.
- Hardening smoke test for Electron launch, Smart Search, record opening, validation, index sync and backup.

## Validation scope
- Required names for warehouses and constructions.
- Non-negative numeric values for counts, areas, capacities and investments.
- Year range validation from 1900 to current year + 1.
- Construction settlement value cannot exceed total investment when both are present.

## Test results
- `npm run check`: PASS
- `npm run test:search`: PASS
- `npm run test:smoke`: PASS
- `npm test`: PASS

## Generated artifacts
- `docs/hardening_smoke_report.json`
- `docs/smart_search_test_report.json`
- `docs/production_hardening_plan.md`

## Remaining production gaps
- Authentication is still a fixed/local assumption; no real login/session layer yet.
- Renderer still has legacy `innerHTML` in several tables/forms; high-risk import/search paths are improved, but full renderer sanitization should continue.
- Backup restore API exists, but a polished UI for backup/restore is still needed.
- Migration tracking exists, but current legacy migration file is not yet split into numbered migration modules.
- Excel mapping for official `KHO.xls` and `CONG-TRINH.xlsx` still needs deeper parser work if those are required as production import templates.
