# Warehouse Management

Phần mềm **Warehouse Management** là ứng dụng desktop phục vụ quản lý hệ thống nhà kho, camera an ninh, hệ thống cứu hỏa và các công trình xây mới/sửa chữa/nâng cấp. Ứng dụng được xây dựng theo mô hình chạy cục bộ trên máy người dùng, sử dụng **Electron**, **SQLite** và giao diện web nội bộ.

## Mục tiêu

- Quản lý tập trung dữ liệu nhà kho, camera, cứu hỏa và công trình.
- Hỗ trợ nhập liệu thủ công và import dữ liệu từ Excel.
- Xuất dữ liệu quản lý ra Excel để phục vụ báo cáo/tổng hợp.
- Cung cấp dashboard tổng quan và cảnh báo theo dữ liệu hiện có.
- Tích hợp tìm kiếm thông minh nhẹ, không dùng LLM, để tra cứu nhanh dữ liệu trong cơ sở dữ liệu cục bộ.

## Tính năng chính

### Dashboard

- Thống kê nhanh số lượng nhà kho theo phân loại.
- Thống kê hệ thống camera, cứu hỏa và công trình.
- Hiển thị danh sách công trình theo năm.
- Cảnh báo dữ liệu cần chú ý theo năm xây dựng/sửa chữa/nâng cấp.

### Quản lý nhà kho

- Thêm, sửa, xóa, xem danh sách nhà kho.
- Quản lý thông tin đơn vị cha/con, địa chỉ, phân loại kho.
- Quản lý diện tích, năm xây dựng, năm sửa chữa/nâng cấp.
- Quản lý sức chứa, trữ lượng hiện tại, loại hàng, chất lượng kho.
- Quản lý nhu cầu và hiện trạng hệ thống cứu hỏa của nhà kho.
- Import/export Excel.

### Quản lý camera an ninh

- Quản lý số lượng hệ thống/camera/màn hình.
- Quản lý năm lắp đặt, năm sửa chữa.
- Quản lý cơ quan chủ đầu tư, tình trạng hoạt động.
- Quản lý nhu cầu sửa chữa/cải tạo/lắp mới.
- Import/export Excel.

### Quản lý hệ thống cứu hỏa

- Quản lý hệ thống cứu hỏa tập trung theo đơn vị.
- Quản lý số nhà bơm, số họng, năm lắp đặt/sửa chữa.
- Quản lý tình trạng, chủ đầu tư, nhu cầu sửa chữa/lắp mới.
- Import/export Excel.

### Quản lý công trình

- Quản lý công trình xây mới, sửa chữa, nâng cấp.
- Quản lý quyết định phê duyệt, hợp đồng, nhà thầu.
- Quản lý khối lượng, thời gian thực hiện, giá trị đầu tư/quyết toán.
- Quản lý trạng thái, mô tả và ghi chú công trình.
- Import/export Excel.

### Cấu hình hệ thống

- Quản lý phân cấp đơn vị.
- Quản lý tỉnh/xã.
- Quản lý danh mục loại kho, loại hàng, chất lượng kho, chống sét.

## Tìm kiếm thông minh

Ứng dụng có module **Smart Search** tích hợp trực tiếp vào ô tìm kiếm toàn hệ thống.

Giải pháp tìm kiếm sử dụng:

- **SQLite FTS5** để tìm kiếm toàn văn nhanh trong dữ liệu cục bộ.
- **Normalize tiếng Việt** để hỗ trợ tìm kiếm có dấu/không dấu.
- **Từ điển đồng nghĩa/viết tắt nghiệp vụ** như `cam`, `pccc`, `ct`, `hckt`, `qlda`.
- **Rule-based query parser** để hiểu các điều kiện đơn giản như năm, số lượng, trạng thái.
- **Ranking theo ngữ cảnh** để ưu tiên kết quả đúng phân hệ, đúng tên, đúng mã và đúng điều kiện.

Ví dụ truy vấn:

```text
kho xang dau k02
camera hong
cuu hoa pccc
cong trinh dang thi cong
kho xay truoc 2010
camera lap truoc 2020
kho suc chua tren 100
```

## Công nghệ sử dụng

- Electron
- JavaScript
- SQLite / better-sqlite3
- SQLite FTS5
- XLSX
- Playwright cho kiểm thử UI/automation

## Cài đặt và chạy ứng dụng

Yêu cầu:

- Node.js
- npm

Cài dependencies:

```bash
npm install
```

Chạy ứng dụng:

```bash
npm start
```

Chạy chế độ dev:

```bash
npm run dev
```

## Build ứng dụng desktop

Ứng dụng dùng `electron-builder` để đóng gói.

```bash
npm run build
```

File build sẽ được sinh trong thư mục cấu hình output của Electron Builder.

## Cấu trúc thư mục

```text
src/
  main/
    main.js                 # Electron main process
    preload.js              # API bridge cho renderer
    database/               # SQLite database, migrations, queries
    search/                 # Smart Search: normalize, dictionary, FTS index, ranking
  renderer/
    index.html              # Giao diện chính
    css/                    # Style giao diện
    js/
      app.js                # Router, dashboard, global search
      modules/              # Module nhà kho, camera, cứu hỏa, công trình, cấu hình

docs/
  template/                 # File Excel template gốc
  sample_data/              # Dữ liệu mẫu
  mau_nhap_*.xlsx           # File mẫu nhập liệu
```

## Dữ liệu và lưu trữ

Ứng dụng lưu dữ liệu trong SQLite cục bộ tại thư mục `userData` của Electron trên máy người dùng. Đây là mô hình phù hợp cho bản desktop chạy trên một máy, một người dùng hoặc môi trường nội bộ.

## Kiểm thử và debug

Một số script hỗ trợ kiểm thử/automation:

```bash
node test_smart_search.js
node e2e_smart_search.js
node e2e_test.js
```

Các script này dùng Playwright để kiểm tra thao tác trên ứng dụng Electron, import/export và tìm kiếm thông minh.

## Ghi chú triển khai web

Phiên bản hiện tại là **Electron desktop app**, không thể chạy nguyên trạng trên GitHub Pages vì GitHub Pages chỉ hỗ trợ web tĩnh. Nếu cần gửi khách hàng bản demo qua link web, nên tạo thêm bản `web-demo` tĩnh dùng JSON/localStorage hoặc triển khai backend riêng cho bản web production.

## Trạng thái hiện tại

- Đã có các module quản lý chính.
- Đã có import/export Excel.
- Đã có Smart Search bản nhẹ tích hợp vào ô tìm kiếm.
- Đã có script test và báo cáo QA cho Smart Search.

## Hướng phát triển tiếp theo

- Click kết quả tìm kiếm mở đúng bản ghi chi tiết.
- Cập nhật Smart Search index ngay sau khi thêm/sửa/xóa/import dữ liệu.
- Tinh chỉnh ranking và dictionary theo dữ liệu thực tế.
- Bổ sung cấu hình dictionary từ file ngoài hoặc màn hình quản trị.
- Dọn dữ liệu trùng do test/import nhiều lần.
- Xây dựng bản web demo nếu cần gửi khách hàng qua link `.github.io`.

## Production Hardening (`hardening/v0.2`)

Dự án đã có mốc rollback an toàn trước khi nâng cấp production:

```bash
git checkout v0.1.0-mvp
```

Nhánh phát triển hardening:

```bash
git checkout hardening/v0.2
```

Các nâng cấp trong nhánh này:

- Validation tại main process cho Nhà kho, Camera, Cứu hỏa và Công trình.
- Audit log cho thao tác tạo/sửa/xóa/export/backup.
- Backup/restore IPC API và lịch sử backup.
- Schema migration tracking bằng bảng `schema_migrations`.
- File guard cho Excel import/export: chỉ đọc/ghi đường dẫn đã chọn qua dialog của ứng dụng.
- Import Excel có escape HTML và báo cáo lỗi dòng import.
- Test smoke tổng hợp cho Electron, Smart Search, mở record, validation, index sync và backup.

### Lệnh kiểm tra

```bash
npm run check
npm run test:search
npm run test:smoke
npm test
```

### Báo cáo liên quan

- `docs/production_hardening_plan.md`
- `docs/production_hardening_report.md`
- `docs/hardening_smoke_report.json`

### Lưu ý production còn lại

- Chưa có auth/session thật cho nhiều người dùng.
- Renderer vẫn còn một số vùng legacy dùng `innerHTML`; cần tiếp tục thay bằng safe rendering.
- Backup/restore API đã có nhưng cần UI quản trị hoàn chỉnh.
- Migration tracking đã có nhưng legacy migrations chưa tách hết thành từng version file.
- Mapping Excel template chính thức cho `KHO.xls` và `CONG-TRINH.xlsx` cần parser chuyên biệt hơn nếu dùng production.

## Hardening v0.2

Bản nâng cấp hardening bổ sung các chức năng nền để bảo vệ dữ liệu và kiểm thử hệ thống:

- Migration runner có version theo từng bước, theo dõi trong `schema_migrations`.
- Tab Cấu hình có khu vực An toàn dữ liệu để tạo backup, restore và xem audit log.
- Import Excel đọc workbook nhiều sheet, có parser nền cho mẫu `KHO.xls` và `CONG-TRINH.xlsx`, preview dòng hợp lệ/lỗi.
- Màn Rà soát dữ liệu nghi trùng chỉ gợi ý nhóm nghi trùng, không tự xóa dữ liệu.
- Smart Search render kết quả bằng DOM event listener thay cho inline `onclick`.
- Smoke test mở rộng kiểm tra search, validation, backup, audit, migration, duplicate review và parser import.

Chạy kiểm tra:

```bash
npm test
```

Báo cáo đánh giá: `docs/hardening_v0_2_evaluation.md`.

## Product Completion

Giai đoạn hoàn thiện sản phẩm hiện bám theo tài liệu gốc `docs/mota.md`, ưu tiên đúng phạm vi ban đầu thay vì thêm công nghệ mới:

- Phạm vi sản phẩm chính thức: `docs/product_scope.md`.
- Đối chiếu khoảng cách theo mô tả ban đầu: `docs/mota_gap_analysis.md`.
- Registry nghiệp vụ dùng làm nguồn chuẩn cho module/field/list/search/import: `src/shared/module_registry.js`.
- Test đã được gom vào `tests/`, script tạo dữ liệu/demo gom vào `scripts/`, artifact QA gom vào `docs/qa/`.

Nguyên tắc phát triển tiếp: mọi trường nghiệp vụ mới phải được khai báo trong registry trước, sau đó mới nối vào form, import/export, search và test.

### Renderer Consolidation

Hai module `cameras` và `fire_systems` đã được gom về core CRUD dùng chung tại `src/renderer/js/core/asset_crud.js`. Mục tiêu là giảm lặp code renderer nhưng vẫn giữ nguyên nghiệp vụ, API và UI flow hiện có.

## Product Completion 2026-05-06

Đã hoàn thiện một vòng consolidation theo `docs/mota.md`:

- Scope sản phẩm: `docs/product_scope.md`.
- Gap analysis: `docs/mota_gap_analysis.md`.
- Báo cáo hoàn thiện: `docs/product_completion_report.md`.
- Registry nghiệp vụ: `src/shared/module_registry.js`.
- CRUD renderer core: `src/renderer/js/core/asset_crud.js`.
- `cameras`, `fire_systems`, `constructions` đã giảm mạnh render HTML rời rạc.
- `warehouses` đã an toàn hơn ở phần danh sách; form giữ nguyên để tránh rủi ro với tỉnh/xã/danh mục.

## Module Quản lý tài liệu

Đã bổ sung thiết kế module tài liệu tập trung:

- Thiết kế nghiệp vụ/schema/UI: `docs/document_management_module.md`.
- Kế hoạch triển khai mã nguồn: `docs/document_management_implementation_plan.md`.
- Kế hoạch test hệ thống: `docs/document_management_test_plan.md`.

Định hướng: tài liệu là bản ghi độc lập, file lưu trong kho tài liệu hệ thống, SQLite chỉ lưu metadata và liên kết hai chiều với các record nghiệp vụ.

### Document Management Implementation

Đã triển khai module Quản lý tài liệu tập trung:

- Backend service: `src/main/documents.js`.
- DB migration: `005_document_management` trong `src/main/database/hardening_migrations.js`.
- UI module: `src/renderer/js/modules/documents.js`.
- Panel dùng chung: `src/renderer/js/core/document_panel.js`.
- Test: `tests/test_documents_service.js`.
- Báo cáo: `docs/document_management_implementation_report.md`.

File tài liệu được copy vào kho tài liệu của hệ thống, SQLite chỉ lưu metadata và liên kết.
