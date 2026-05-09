# Báo cáo đánh giá mã nguồn — Warehouse Management

> Ngày đánh giá: 2026-05-07
> Phiên bản: v1.0.0 (hardening/v0.2 + product completion)

---

## 1. Tổng quan dự án

| Chỉ tiêu | Giá trị |
|----------|---------|
| **Ngôn ngữ** | JavaScript (Node.js) |
| **Framework** | Electron 33 + SQLite (better-sqlite3) |
| **Số file nguồn** | 49 files |
| **Tổng dòng code** | ~4,345 dòng |
| **Kiến trúc** | Desktop app (Main process + Renderer process) |
| **Cơ sở dữ liệu** | SQLite với WAL mode |
| **Kiểm thử** | Node.js check + smoke tests |

---

## 2. Cấu trúc thư mục

```
src/
  main/              # Electron main process
    database/        # DB queries, migrations
    search/          # Smart Search module (FTS5)
    validation/      # Input validation
    audit.js         # Audit logging
    backup.js        # Backup/restore
    documents.js     # Document management service
    file_guard.js    # File path security
  renderer/          # UI layer
    js/core/         # Shared components (asset_crud, document_panel)
    js/modules/      # Feature modules
  shared/            # module_registry.js (shared config)
```

**Nhận xét:** Phân tách rõ ràng giữa Main process (backend logic) và Renderer process (UI). Có tách riêng validation, audit, backup, search thành các module độc lập.

---

## 3. Đánh giá theo khía cạnh

### 3.1. Kiến trúc & Thiết kế

| Điểm | Đánh giá |
|------|----------|
| **Module Registry Pattern** | **Rất tốt** — Tập trung cấu hình 4 module (warehouses, cameras, fireSystems, constructions) vào `src/shared/module_registry.js`. Giảm lặp code, dễ bảo trì. |
| **Asset CRUD Core** | **Khá tốt** — `src/renderer/js/core/asset_crud.js` cung cấp base CRUD cho camera và cứu hỏa. Giảm trùng lặp renderer đáng kể. |
| **IPC API Design** | **Tốt** — Preload script expose API rõ ràng qua `contextBridge`, không dùng `nodeIntegration`. |
| **Separation of Concerns** | **Tốt** — Validation, audit, search, documents, backup tách biệt hoàn toàn. |

**Vấn đề nhỏ:**
- `warehouses` và `constructions` vẫn giữ form riêng (không dùng `asset_crud.js`), gây một chút không nhất quán. Nhưng có lý do hợp lý: warehouses có tỉnh/xã/danh mục phức tạp, constructions có nhiều trường đặc thù.

### 3.2. Bảo mật

| Điểm | Đánh giá |
|------|----------|
| **Input Validation** | **Tốt** — Validation ở main process (`src/main/validation/`) trước khi ghi DB. Có validator riêng cho từng module. |
| **SQL Injection** | **An toàn** — Dùng `better-sqlite3` prepared statements tất cả queries. |
| **XSS Prevention** | **Khá tốt** — `escapeHTML()` trong renderer (`src/renderer/js/app.js:226-227`), tránh `innerHTML` trong search results. |
| **File Guard** | **Tốt** — `src/main/file_guard.js` chỉ cho phép đọc/ghi file đã chọn qua dialog, giới hạn extension và kích thước 25MB. |
| **Context Isolation** | **Tốt** — `contextIsolation: true`, `nodeIntegration: false` trong cả login và main window. |

**Vấn đề nhỏ:**
- `openModal()` vẫn dùng `innerHTML` trong `src/renderer/js/app.js:56-58` (footerHTML và bodyHTML).
- Một số chỗ còn inline `onclick` trong HTML string (dashboard filters).

### 3.3. Tìm kiếm thông minh (Smart Search)

**Giải pháp:**
- SQLite FTS5 cho full-text search (`src/main/search/search_index.js`)
- Normalize tiếng Việt (`src/main/search/normalize.js`) — hỗ trợ có dấu/không dấu
- Rule-based query parser (`src/main/search/query_parser.js`) — xử lý `năm > 2010`, `sức chứa > 100`
- Từ điển đồng nghĩa/viết tắt (`src/main/search/dictionary.js`)
- Ranking theo ngữ cảnh (`src/main/search/ranking.js`)

**Ưu điểm:** Không phụ thuộc LLM, chạy cục bộ nhanh, đủ dùng cho dữ liệu nhà kho.

### 3.4. Quản lý tài liệu (Document Management)

**Thiết kế tốt:**
- File lưu trong kho tài liệu hệ thống (`userData/documents/by-id/`), SQLite chỉ lưu metadata
- SHA256 checksum để kiểm tra toàn vẹn
- Liên kết hai chiều với các record nghiệp vụ (warehouses, cameras, fireSystems, constructions)
- Audit log đầy đủ cho mọi thao tác tài liệu
- Soft delete (có `deleted_at`)

### 3.5. Cơ sở dữ liệu

**Tốt:**
- WAL mode enabled (`src/main/database/db.js:9`)
- Foreign keys ON (`src/main/database/db.js:10`)
- Migration tracking (`schema_migrations`)
- Hardening migrations tách biệt với migrations cũ (`src/main/database/hardening_migrations.js`)
- Audit log table (`src/main/audit.js`)
- Backup history table (`src/main/backup.js`)

### 3.6. Code Quality

| Điểm | Trạng thái |
|------|-----------|
| `npm run check` | **Pass** — Tất cả file đều pass syntax check |
| Consistent naming | **Tốt** — camelCase cho JS, snake_case cho DB |
| Error handling | **Khá tốt** — try/catch ở nhiều nơi, audit log không throw |
| Comment | **Tối thiểu** — Code tự giải thích qua tên biến/hàm |

---

## 4. Các vấn đề phát hiện

### 4.1. Nhẹ (Không ảnh hưởng chức năng)

| STT | Vấn đề | Vị trí | Đề xuất |
|-----|--------|--------|---------|
| 1 | `id` và `record_id` trùng lặp trong kết quả search | `src/main/search/smart_search.js:152-153` | Chỉ giữ lại `id` hoặc `record_id` |
| 2 | `confirmAction` dùng inline `onclick` trong HTML string | `src/renderer/js/app.js:99-101` | Thay bằng DOM event listener hoàn toàn |
| 3 | Fields trong `constructions.js` form không khớp với `module_registry.js` | `src/renderer/js/modules/constructions.js` | Đồng bộ lại (approved_investment, settlement_approved, total_estimated, total_investment) |

### 4.2. Trung bình

| STT | Vấn đề | Vị trí | Đề xuất |
|-----|--------|--------|---------|
| 4 | File Guard path cache là Set tĩnh trong memory | `src/main/file_guard.js:3` | Document rõ behavior (mất khi restart) hoặc persist ra disk |
| 5 | Backup restore chưa enforce restart | `src/main/backup.js:20-25` | Thông báo rõ ràng yêu cầu restart app sau restore |

### 4.3. Cần cải thiện

| STT | Vấn đề | Vị trí | Đề xuất |
|-----|--------|--------|---------|
| 6 | Chưa có auth/session thật | `src/main/main.js:29-30` | Đã ghi nhận trong README. Cần implement nếu cần multi-user. |
| 7 | Renderer còn một số `innerHTML` | Dashboard filters, modal | Dọn dần để tránh XSS risk |

---

## 5. Tóm tắt đánh giá tổng thể

| Khía cạnh | Điểm | Nhận xét |
|-----------|------|----------|
| Kiến trúc | 8/10 | Rõ ràng, có registry, tách biệt tốt |
| Bảo mật | 7.5/10 | Validation, file guard, audit đầy đủ. Còn vài chỗ innerHTML. |
| Maintainability | 8/10 | Code có cấu trúc, giảm lặp tốt qua registry và asset_crud |
| Performance | 8/10 | SQLite WAL, FTS5, local app — đủ nhanh cho use case |
| Testing | 6/10 | Có smoke test, chưa có unit test đầy đủ cho validation và business logic |
| Documentation | 8/10 | README chi tiết, nhiều docs trong `docs/` |

**Tổng điểm trung bình: 7.6/10**

---

## 6. Khuyến nghị hành động

### Ưu tiên cao
1. Thay hết `innerHTML` còn lại trong renderer bằng DOM API
2. Đồng bộ fields trong `constructions.js` với `module_registry.js`

### Ưu tiên trung bình
3. Thêm unit tests cho validation functions (`src/main/validation/`)
4. Thêm integration test cho import/export Excel
5. Hoàn thiện auth (nếu có kế hoạch multi-user)

### Ưu tiên thấp
6. Tách migrations legacy thành từng version file riêng
7. Bổ sung TypeScript definitions (nếu có kế hoạch scale)

---

## 7. Tài liệu tham khảo liên quan

- `docs/product_scope.md` — Phạm vi sản phẩm
- `docs/production_hardening_plan.md` — Kế hoạch hardening
- `docs/production_hardening_report.md` — Báo cáo hardening
- `docs/hardening_v0_2_evaluation.md` — Đánh giá v0.2
- `docs/product_completion_report.md` — Báo cáo hoàn thiện
- `docs/smart_search_qa_report.md` — QA Smart Search
