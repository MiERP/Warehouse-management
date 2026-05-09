# Gap Analysis Theo docs/mota.md

## Tổng quan

Codebase hiện tại đã có đủ các module chính trong mô tả ban đầu, nhưng cần hoàn thiện theo hướng thống nhất dữ liệu và giảm lặp code.

## Bảng đối chiếu

| Hạng mục | Mục tiêu trong mota.md | Hiện trạng codebase | Việc cần hoàn thiện |
|---|---|---|---|
| Kiểu triển khai | Desktop/local, một người dùng admin | Electron + SQLite local đã đáp ứng | Giữ nguyên, không mở rộng SaaS/phân quyền vội |
| Dashboard | Quản lý chung, menu trái, ô tìm kiếm | Có dashboard và Smart Search | Bổ sung cảnh báo dữ liệu thiếu/sai, giữ dashboard thực dụng |
| Nhà kho | Form theo trường Excel, list phân cấp đơn vị | Có CRUD/schema/import/export/search | Đối chiếu đầy đủ field với Excel thật, chuẩn hóa list theo đơn vị |
| Camera | Form giống nhà kho, trường theo Excel | Có CRUD/schema/import/export/search | Gom renderer với module cứu hỏa vì cấu trúc rất giống |
| Cứu hỏa | Form theo Excel, trạng thái/nhu cầu | Có CRUD/schema/import/export/search | Gom renderer với camera, chuẩn hóa field pump/hydrant |
| Công trình | Quản lý xây mới/sửa chữa/nâng cấp | Có CRUD/schema/import/export/search | Khóa mapping từ `CONG-TRINH.xlsx`, tách dòng hạng mục/chi phí rõ hơn |
| Cấu hình | Đơn vị, địa phương, loại kho, loại hàng, chất lượng, chống sét | Có đủ danh mục chính, thêm backup/audit/duplicate | Tách phần hệ thống khỏi cấu hình nghiệp vụ nếu UI quá dài |
| Excel | Trường dữ liệu dựa trên file Excel | Có parser nền và sample files | Chuyển parser khỏi renderer, khai báo template trong registry/service |
| Tìm kiếm | Textbox tìm kiếm trong dashboard/layout | Smart Search nhẹ đã có | Giữ hướng FTS/rule, không thêm LLM |
| An toàn dữ liệu | Không nêu rõ ban đầu nhưng cần cho dùng thật | Có backup/audit/duplicate nền | Hoàn thiện như tính năng hỗ trợ, không để lấn át nghiệp vụ chính |

## Khoảng cách kỹ thuật ảnh hưởng trực tiếp sản phẩm

1. Renderer còn nhiều logic CRUD lặp giữa 4 module chính.
2. Import/export đang phụ thuộc nhiều vào `excel_helper.js` ở renderer.
3. `main.js` chứa nhiều IPC handler, nên khó kiểm soát khi thêm nghiệp vụ.
4. Test/debug scripts trước đây nằm ở root, đã được gom vào `tests/` và `scripts/`.
5. Artifact QA trước đây nằm lẫn trong `docs`, đã được gom vào `docs/qa/`.

## Hướng hoàn thiện tiếp theo

1. Dùng `src/shared/module_registry.js` làm nguồn chuẩn cho field/list/import/search.
2. Refactor camera và cứu hỏa trước vì ít field và giống nhau.
3. Sau đó refactor công trình, cuối cùng là nhà kho vì phức tạp nhất.
4. Chuyển import/export sang main service dùng template khai báo.
5. Viết test nghiệp vụ cho từng module thay vì chỉ test smoke kỹ thuật.

## Cập nhật refactor renderer

Đã bắt đầu gom logic CRUD lặp ở renderer theo hướng không đổi nghiệp vụ:

- Tạo core dùng chung: `src/renderer/js/core/asset_crud.js`.
- Refactor `src/renderer/js/modules/cameras.js` thành cấu hình mỏng dùng core.
- Refactor `src/renderer/js/modules/fire_systems.js` thành cấu hình mỏng dùng core.
- Giữ nguyên API, dữ liệu, import/export và hành vi người dùng.
- Smoke test sau refactor: PASS.

Bước tiếp theo nên refactor `constructions.js`, sau đó mới đến `warehouses.js` vì nhà kho có nhiều field và phụ thuộc địa phương/danh mục hơn.

## Gap mới: Module Quản lý tài liệu

| Hạng mục | Mục tiêu | Hiện trạng | Cần triển khai |
|---|---|---|---|
| Kho tài liệu tập trung | Có tab Tài liệu riêng | Chưa có | Thêm page/sidebar/module renderer |
| Metadata tài liệu | Tài liệu là bản ghi độc lập | Chưa có bảng `documents` | Thêm migration + service |
| Liên kết hai chiều | Một tài liệu gắn nhiều record, một record có nhiều tài liệu | Chưa có | Thêm `document_links` |
| Upload từ record | Upload tài liệu trong form bản ghi | Chưa có | Thêm `document_panel.js` |
| Upload từ module tài liệu | Upload tài liệu độc lập | Chưa có | Thêm documents page |
| File storage | Copy file vào kho tài liệu hệ thống | Chưa có | Lưu trong `userData/documents/by-id/{id}` |
| Audit | Ghi thao tác tài liệu | Chưa có | Tích hợp audit hiện có |
| Backup | Backup cả DB và tài liệu | DB backup đã có, chưa backup documents | Nâng backup hoặc cảnh báo giai đoạn đầu |
| Search | Tìm metadata tài liệu | Chưa có | Bổ sung vào Smart Search sau khi module ổn định |

Ưu tiên triển khai: service + DB trước, sau đó module Tài liệu, sau đó panel liên kết trong record nghiệp vụ.
