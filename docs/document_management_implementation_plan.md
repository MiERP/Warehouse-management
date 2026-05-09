# Kế Hoạch Triển Khai Module Quản Lý Tài Liệu

## Mục tiêu

Triển khai module Quản lý tài liệu tập trung theo tài liệu `docs/document_management_module.md`, phù hợp kiến trúc Electron + SQLite hiện tại, không thêm công nghệ mới.

## Nguyên tắc triển khai

1. Làm theo từng lớp: DB -> service -> IPC/preload -> UI module -> panel trong record -> search/backup.
2. Không lưu file trong SQLite.
3. Không gắn tài liệu vào cấu hình/danh mục.
4. Mọi thao tác file phải qua dialog và `file_guard`.
5. Ghi audit cho thao tác tạo/sửa/xóa/link/unlink/open tài liệu.
6. Test từng giai đoạn trước khi làm tiếp.

## Phase 1 - Database & migration

### File cần sửa/tạo

- Sửa: `src/main/database/hardening_migrations.js`
- Có thể tạo sau nếu muốn tách rõ: `src/main/database/document_migrations.js`

### Việc cần làm

- Thêm migration version mới, ví dụ `005_document_management`.
- Tạo bảng `documents`.
- Tạo bảng `document_links`.
- Tạo index cần thiết.

### Đầu ra

- App khởi động tự tạo bảng tài liệu nếu chưa có.
- `schema_migrations` ghi nhận version mới.

## Phase 2 - Backend document service

### File cần tạo

- `src/main/documents.js`

### Hàm cần có

- `listDocuments(filters)`
- `getDocument(id)`
- `createDocumentFromFile(filePath, metadata)`
- `updateDocument(id, metadata)`
- `deleteDocument(id)`
- `listLinks(documentId)`
- `linkDocument(documentId, entityType, entityId, relationType, note)`
- `unlinkDocument(linkId)`
- `listDocumentsForEntity(entityType, entityId)`
- `openDocument(id)`
- `revealDocument(id)`

### Logic chính

- Validate `entityType` theo module registry.
- Validate extension/kích thước qua `file_guard`.
- Tính SHA-256.
- Copy file vào `userData/documents/by-id/{document_id}`.
- Ghi metadata vào SQLite.
- Ghi audit log.

### Đầu ra

- Có thể upload file thành document record độc lập.
- Có thể link/unlink tài liệu với record nghiệp vụ.

## Phase 3 - IPC & preload

### File cần sửa

- `src/main/main.js`
- `src/main/preload.js`

### IPC cần thêm

- `documents:list`
- `documents:getById`
- `documents:createFromFile`
- `documents:update`
- `documents:delete`
- `documents:listForEntity`
- `documents:link`
- `documents:unlink`
- `documents:open`
- `documents:reveal`

### Đầu ra

- Renderer gọi được `window.api.documents.*`.

## Phase 4 - Registry

### File cần sửa

- `src/shared/module_registry.js`

### Việc cần làm

- Thêm module `documents`.
- Thêm `documents: { enabled: true }` cho:
  - `warehouses`
  - `cameras`
  - `fireSystems`
  - `constructions`

### Đầu ra

- Module tài liệu có metadata thống nhất.
- Các module nghiệp vụ biết có bật tài liệu hay không.

## Phase 5 - UI module Tài liệu

### File cần tạo/sửa

- Sửa: `src/renderer/index.html`
- Tạo: `src/renderer/js/modules/documents.js`

### UI cần có

- Sidebar item `Tài liệu`.
- Page `page-documents`.
- Toolbar: Upload, Làm mới, Tìm kiếm.
- Danh sách tài liệu.
- Form/Modal chi tiết tài liệu.
- Danh sách liên kết nghiệp vụ của tài liệu.

### Đầu ra

- Người dùng upload tài liệu độc lập.
- Người dùng xem danh sách tài liệu.
- Người dùng mở file/xem chi tiết/xóa mềm tài liệu.

## Phase 6 - Document panel trong record nghiệp vụ

### File cần tạo

- `src/renderer/js/core/document_panel.js`

### File cần sửa

- `src/renderer/js/modules/constructions.js`
- `src/renderer/js/modules/cameras.js`
- `src/renderer/js/modules/fire_systems.js`
- `src/renderer/js/modules/warehouses.js`
- `src/renderer/index.html` để include script mới

### Thứ tự gắn panel

1. `constructions` trước.
2. `cameras`.
3. `fireSystems`.
4. `warehouses` cuối cùng.

### Đầu ra

- Trong mỗi record đã lưu có panel Tài liệu liên quan.
- Có thể upload tài liệu mới từ record.
- Có thể gắn tài liệu có sẵn.
- Có thể gỡ liên kết.

## Phase 7 - Search metadata tài liệu

### File cần sửa

- `src/main/search/search_index.js`
- `src/main/search/smart_search.js`
- `src/renderer/js/app.js`

### Việc cần làm

- Index metadata tài liệu.
- Kết quả search có module `document` hoặc `documents`.
- Click kết quả mở chi tiết tài liệu.

### Đầu ra

- Tìm được tài liệu theo title/original name/type/tags/description.

## Phase 8 - Backup awareness

### File cần sửa

- `src/main/backup.js`
- `src/renderer/js/modules/config.js`
- `docs/product_scope.md`

### Việc cần làm

Giai đoạn đầu:

- Hiển thị cảnh báo backup DB chưa đủ nếu chưa backup thư mục documents.

Giai đoạn hoàn thiện:

- Backup cả `warehouse.db` và `documents/` thành package.

## Phase 9 - Tài liệu & release notes

### File cần sửa

- `README.md`
- `docs/product_completion_report.md`
- `docs/document_management_module.md`

### Đầu ra

- Hướng dẫn sử dụng module tài liệu.
- Ghi rõ dữ liệu tài liệu nằm ở kho tài liệu hệ thống.

## Thứ tự triển khai khuyến nghị

1. Phase 1 + 2 + 3: backend hoàn chỉnh.
2. Test service backend.
3. Phase 5: module Tài liệu tập trung.
4. Test upload/list/open/delete.
5. Phase 6: panel trong `constructions`.
6. Test link hai chiều.
7. Nhân rộng panel sang các module còn lại.
8. Phase 7 search metadata.
9. Phase 8 backup awareness.

## Tiêu chí hoàn thành

- Upload tài liệu từ module Tài liệu thành công.
- File được copy vào `userData/documents/by-id/{id}`.
- DB chỉ lưu metadata, không lưu BLOB.
- Tài liệu có thể gắn với một hoặc nhiều record nghiệp vụ.
- Record nghiệp vụ hiển thị tài liệu liên quan.
- Gỡ link không xóa tài liệu gốc.
- Xóa tài liệu là xóa mềm.
- Audit log có ghi thao tác tài liệu.
- `npm test` pass.
