# Kế Hoạch Test Module Quản Lý Tài Liệu

## Mục tiêu test

Đảm bảo module Quản lý tài liệu hoạt động đúng với mô hình hai chiều:

- Tài liệu là bản ghi độc lập.
- File lưu trong kho tài liệu hệ thống.
- DB chỉ lưu metadata và liên kết.
- Tài liệu có thể upload từ kho tài liệu chung hoặc từ record nghiệp vụ.
- Một tài liệu có thể gắn nhiều record.
- Một record có thể có nhiều tài liệu.

## 1. Unit test backend service

### File đề xuất

- `tests/test_documents_service.js`

### Test cases

1. Tạo document từ file hợp lệ.
   - Kỳ vọng: có record trong `documents`.
   - Kỳ vọng: file được copy vào `userData/documents/by-id/{id}`.
   - Kỳ vọng: có `sha256`, `size_bytes`, `extension`.

2. Từ chối file chưa chọn qua dialog/file guard.
   - Kỳ vọng: throw error.

3. Từ chối file extension không hỗ trợ.
   - Kỳ vọng: throw error.

4. List documents.
   - Kỳ vọng: document mới xuất hiện.

5. Get document by id.
   - Kỳ vọng: trả đúng metadata.

6. Update metadata.
   - Kỳ vọng: title/description/tags thay đổi.

7. Delete document mềm.
   - Kỳ vọng: `deleted_at` có giá trị.
   - Kỳ vọng: list mặc định không trả document đã xóa.

8. Link document tới record.
   - Kỳ vọng: có dòng trong `document_links`.

9. Một document link tới nhiều record.
   - Kỳ vọng: `listLinks(documentId)` trả nhiều link.

10. List documents for entity.
    - Kỳ vọng: record nghiệp vụ thấy đúng tài liệu liên quan.

11. Unlink document.
    - Kỳ vọng: link bị xóa/gỡ.
    - Kỳ vọng: document vẫn còn.

12. Audit log.
    - Kỳ vọng: create/link/unlink/delete có audit.

## 2. Integration test IPC/preload

### File đề xuất

- `tests/test_documents_ipc.js`

### Test cases

1. `window.api.documents.createFromFile` hoạt động.
2. `window.api.documents.list` trả danh sách.
3. `window.api.documents.link` tạo liên kết.
4. `window.api.documents.listForEntity` trả tài liệu theo record.
5. `window.api.documents.unlink` gỡ liên kết.
6. `window.api.documents.delete` xóa mềm.
7. `window.api.documents.open` không crash khi file tồn tại.
8. `window.api.documents.reveal` không crash khi file tồn tại.

## 3. E2E test module Tài liệu

### File đề xuất

- `tests/e2e_documents.js`

### Luồng 1: Upload từ module Tài liệu

1. Mở app.
2. Vào tab `Tài liệu`.
3. Bấm `Upload tài liệu`.
4. Chọn file mẫu.
5. Nhập title/type/tags.
6. Save.
7. Kiểm tra tài liệu xuất hiện trong danh sách.
8. Mở chi tiết tài liệu.
9. Kiểm tra metadata hiển thị đúng.

### Luồng 2: Link tài liệu tới Công trình

1. Mở chi tiết tài liệu.
2. Bấm `Gắn với bản ghi`.
3. Chọn module `Công trình`.
4. Chọn một công trình.
5. Save link.
6. Kiểm tra danh sách liên kết có công trình vừa chọn.
7. Mở công trình đó.
8. Kiểm tra panel tài liệu có tài liệu vừa link.

### Luồng 3: Upload từ record Công trình

1. Mở một công trình.
2. Trong panel tài liệu, bấm `Upload tài liệu mới`.
3. Chọn file.
4. Save metadata.
5. Kiểm tra tài liệu xuất hiện trong panel.
6. Vào tab `Tài liệu`.
7. Kiểm tra tài liệu cũng xuất hiện trong kho tài liệu chung.

### Luồng 4: Gỡ liên kết

1. Mở record có tài liệu.
2. Bấm `Gỡ liên kết`.
3. Kiểm tra tài liệu biến mất khỏi panel record.
4. Vào tab `Tài liệu`.
5. Kiểm tra tài liệu vẫn còn trong kho chung.

### Luồng 5: Xóa mềm tài liệu

1. Vào tab `Tài liệu`.
2. Chọn tài liệu.
3. Bấm xóa.
4. Kiểm tra tài liệu không còn trong danh sách mặc định.
5. Kiểm tra file vật lý vẫn còn hoặc được đưa vào trạng thái chờ dọn.

## 4. Smart Search test

### File đề xuất

- `tests/test_documents_search.js`

### Test cases

1. Tìm theo title tài liệu.
2. Tìm theo original file name.
3. Tìm theo tags.
4. Tìm theo document_type.
5. Click kết quả tài liệu mở chi tiết tài liệu.

## 5. Backup/restore test

### Giai đoạn đầu

1. Tạo document.
2. Tạo backup DB.
3. Kiểm tra UI có cảnh báo cần backup thư mục documents nếu chưa zip documents.

### Giai đoạn backup package

1. Tạo document.
2. Backup package.
3. Kiểm tra package có:
   - `warehouse.db`
   - `documents/`
   - `manifest.json`
4. Restore package.
5. Kiểm tra metadata và file vật lý khớp nhau.

## 6. Data quality test

### File đề xuất

- `tests/test_documents_quality.js`

### Test cases

1. Tài liệu không có link.
2. Link trỏ tới record không tồn tại.
3. Metadata có nhưng file vật lý bị xóa/mất.
4. Hai tài liệu trùng SHA-256.
5. Tài liệu deleted nhưng còn link active.

## 7. Test bảo mật file

1. Không cho upload file ngoài extension whitelist.
2. Không cho upload file quá 25MB.
3. Không cho attach path chưa đi qua dialog.
4. Không cho mở path ngoài kho tài liệu nếu metadata bị sửa sai.
5. Không expose đường dẫn tùy ý qua preload.

## 8. Test regression hiện có

Sau mỗi phase phải chạy:

```bash
npm test
```

Đảm bảo các luồng cũ không hỏng:

- Smart Search.
- CRUD module chính.
- Backup/audit hiện có.
- Import parser KHO.
- Registry test.

## 9. Thứ tự test theo phase

| Phase | Test bắt buộc |
|---|---|
| DB migration | syntax check + migration list |
| Service | `test_documents_service.js` |
| IPC/preload | `test_documents_ipc.js` |
| Module Tài liệu UI | `e2e_documents.js` luồng upload/list/detail |
| Panel record | `e2e_documents.js` luồng link/unlink |
| Search | `test_documents_search.js` |
| Backup | backup/restore documents test |
| Final | `npm test` + manual QA |

## 10. Tiêu chí đạt

Module tài liệu chỉ được coi là hoàn thiện khi:

- Upload từ module Tài liệu hoạt động.
- Upload từ record nghiệp vụ hoạt động.
- Link/unlink hai chiều hoạt động.
- Mở file hoạt động.
- Xóa mềm hoạt động.
- Audit log có dữ liệu.
- Search metadata tài liệu hoạt động.
- Backup không làm mất liên kết tài liệu.
- `npm test` pass.
