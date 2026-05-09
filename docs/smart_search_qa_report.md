# Smart Search QA Report

## Scope
- Implemented lightweight smart search for the existing global search box.
- No LLM, no external search service, no model runtime.
- Search stack: Vietnamese normalization + dictionary + SQLite FTS5 + rule-based filters + contextual ranking.

## Test Environment
- Electron app launched through Playwright.
- Search index rebuilt from the current local SQLite database on app startup.
- Test date: 2026-05-05.

## Automated Query Set
| Query | Expected intent | Observed top result |
|---|---|---|
| `kho xang dau` | Find oil/fuel warehouses | Warehouse results, top: Kho Xăng dầu K02 |
| `kho k02` | Find warehouse/code K02 | Warehouse results, top: Kho Xăng dầu K02 |
| `camera hong` | Find broken/repair camera records | Camera results, top camera records |
| `cam can sua chua` | Find cameras needing repair | Camera results |
| `cuu hoa pccc` | Find fire-fighting systems | Fire system results |
| `cong trinh chua quyet toan` | Find construction settlement-related records | Construction results |
| `cong trinh dang thi cong` | Find in-progress construction records | Construction results |
| `kho xay truoc 2010` | Find warehouses built before 2010 | Warehouse results with rule-filter reason |
| `camera lap truoc 2020` | Find cameras installed before 2020 | Camera results with rule-filter reason |
| `kho suc chua tren 100` | Find warehouses with capacity > 100 | Warehouse results with rule-filter reason |

## Findings
- Basic smart search works and is integrated into the existing search UI.
- Accent-insensitive search works for Vietnamese text.
- Dictionary expansion works for `cam`, `pccc`, repair/broken-related terms.
- Rule-based filters are active for year and numeric conditions.
- Result cards now show score and matched reasons.
- UI QA found 0 runtime/page errors.

## Known Limitations
- Current DB contains repeated test/import records, so some top results have duplicate titles but different IDs.
- `cong trinh chua quyet toan` returns construction records correctly, but ranking needs more exact settlement-specific boosting after real data cleanup.
- Click result currently opens the module tab, not the exact row/form record.
- Dictionary is static in code; it should become configurable after more user queries are collected.

## Artifacts
- JSON test report: `docs/smart_search_test_report.json`
- UI report: `docs/smart_search_ui_report.json`
- UI demo video: `docs/smart_search_ui_demo.webm`
- Screenshots: `docs/recordings/smart_search_*.png`
