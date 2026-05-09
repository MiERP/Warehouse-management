# Kế Hoạch Chỉnh Sửa Cấu Trúc Dữ Liệu & Dashboard

> Ngày tạo: 2026-05-04
> Cập nhật lần cuối: 2026-05-04T08:15+07:00
> Trạng thái: ✅ Hoàn thành

## Phase 1: Database Migration — Schema mới ✅
- [x] Thêm cột warehouses (category, address, chống sét, chất lượng chi tiết, notes)
- [x] Thêm cột cameras (notes)
- [x] Thêm cột fire_systems (unit_measure, pump_house_count, hydrant_count)
- [x] Thêm cột constructions (~15 cột: hợp đồng, nhà thầu, quyết toán)
- [x] Cập nhật queries (warehouses, cameras, fire_systems, constructions)
- [x] Cập nhật preload.js & main.js IPC
- [x] Thêm migrateExistingTables() cho safe migration DB cũ

## Phase 2: UI Forms — Cập nhật form nhập liệu ✅
- [x] warehouses.js — fields mới (category chiến dịch/chiến thuật, chống sét, chất lượng chi tiết, address)
- [x] fire_systems.js — nhà bơm, họng nước, ĐVT; ẩn fields không cần (sprinkler, báo cháy)
- [x] constructions.js — sections mới (Hợp đồng, Nhà thầu, Thẩm tra, Tài chính/Quyết toán)
- [x] cameras.js — notes field, sắp xếp cột đúng ảnh 1

## Phase 3: UI Tables — Cập nhật bảng hiển thị ✅
- [x] Cập nhật thead index.html cho đúng cột (tất cả 4 module)
- [x] Cập nhật loadList() render dữ liệu mới
- [x] overflow-x:auto cho tất cả bảng (horizontal scroll)

## Phase 4: Dashboard Redesign (theo mockup ảnh 5) ✅
- [x] 4 stat cards: Kho Chiến dịch, Kho Chiến thuật, Camera, Cứu hỏa tập trung
- [x] Danh sách nhà kho theo phân loại (table)
- [x] Danh sách công trình theo năm hiện tại (table)
- [x] Cảnh báo theo năm XD/SC/NC (table, highlight warning)
- [x] Cập nhật stats:overview IPC handler (category counts, alerts query)
- [x] Stat cards clickable → navigate to module

## Phase 5: Global Search + Excel Mapping ✅
- [x] Global search IPC handler (search across 4 modules)
- [x] Search dropdown UI với debounce 300ms
- [x] Navigate to module on result click
- [x] Preload API bridge cho search:global

## Tổng kết thay đổi

| File | Thay đổi |
|------|----------|
| `migrations.js` | +migrateExistingTables(), schema mở rộng 4 bảng |
| `queries/warehouses.js` | +10 cột, +countByCategory(), +getByWarehouseType() |
| `queries/cameras.js` | +notes field |
| `queries/fire_systems.js` | Redesign: +pump_house_count, +hydrant_count, +unit_measure |
| `queries/constructions.js` | +15 cột tài chính/hợp đồng, +getByCurrentYear() |
| `main.js` | Redesign stats:overview, +search:global IPC |
| `preload.js` | +search API bridge |
| `index.html` | Dashboard redesign, table headers cập nhật, search dropdown |
| `app.js` | Dashboard render mới (3 sections), global search logic |
| `warehouses.js` | Form +12 fields, table +2 cột |
| `cameras.js` | Form +notes, table khớp ảnh 1 |
| `fire_systems.js` | Redesign form (nhà bơm, họng), bỏ sprinkler/báo cháy |
| `constructions.js` | Redesign form 4 sections, table 12 cột |
