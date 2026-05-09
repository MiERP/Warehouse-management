# Báo Cáo Triển Khai Module Quản Lý Tài Liệu

Thời điểm: 2026-05-06

## Đã triển khai

- Migration `005_document_management` tạo `documents` và `document_links`.
- Service backend `src/main/documents.js`.
- IPC/preload `window.api.documents`.
- Registry có module `documents` và bật tài liệu cho module nghiệp vụ.
- Sidebar/page `Tài liệu`.
- Renderer module `src/renderer/js/modules/documents.js`.
- Component `src/renderer/js/core/document_panel.js`.
- Panel tài liệu đã gắn vào:
  - Công trình,
  - Camera,
  - Cứu hỏa.
- Smart Search index metadata tài liệu.
- Test service tài liệu `tests/test_documents_service.js`.
- `npm test` PASS.

## Hành vi hiện có

- Upload tài liệu từ module Tài liệu.
- File được copy vào kho tài liệu hệ thống trong `userData/documents/by-id/{document_id}`.
- SQLite lưu metadata, không lưu file BLOB.
- Tạo/gỡ liên kết tài liệu với record nghiệp vụ.
- Panel trong record hiển thị tài liệu liên quan.
- Mở file và mở thư mục chứa file.
- Xóa mềm tài liệu và gỡ link.
- Audit log ghi thao tác tài liệu.
- Smart Search tìm metadata tài liệu.

## Giới hạn hiện tại

- Panel tài liệu chưa gắn vào form Nhà kho vì form nhà kho còn phức tạp và đang giữ ổn định.
- UI gắn tài liệu có sẵn hiện dùng nhập ID tài liệu/record dạng đơn giản, cần nâng thành modal chọn bản ghi thân thiện hơn.
- Backup hiện mới cảnh báo/docs; chưa đóng gói DB + documents thành package zip.
- Chưa OCR/đọc nội dung file, chỉ search metadata.

## Test đã chạy

```bash
npm test
```

Kết quả: PASS.

## Bước phát triển tiếp theo

1. Làm modal chọn tài liệu có sẵn thay vì nhập ID.
2. Làm modal chọn record khi gắn tài liệu từ trang Tài liệu.
3. Gắn panel tài liệu vào Nhà kho sau khi refactor form nhà kho theo section.
4. Nâng backup thành package gồm DB + thư mục documents.
5. Thêm Data Quality cho tài liệu mất file/trùng SHA/chưa gắn record.
