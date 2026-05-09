# Module Quản Lý Tài Liệu

## 1. Mục tiêu

Module Quản lý tài liệu bổ sung một kho tài liệu tập trung cho hệ thống. Tài liệu không chỉ là file đính kèm trong từng bản ghi nghiệp vụ mà là một bản ghi độc lập, có metadata riêng và có thể liên kết hai chiều với nhiều bản ghi thuộc các module nghiệp vụ.

Module này áp dụng cho các module nghiệp vụ:

- Nhà kho (`warehouses`)
- Camera (`cameras`)
- Cứu hỏa (`fireSystems`)
- Công trình (`constructions`)

Không áp dụng cho cấu hình, danh mục, tỉnh/xã, đơn vị.

## 2. Nguyên tắc thiết kế

- File vật lý không lưu trong SQLite.
- File được copy vào kho tài liệu nội bộ của hệ thống.
- SQLite chỉ lưu metadata tài liệu và quan hệ liên kết.
- Tài liệu có thể được upload từ record nghiệp vụ hoặc upload từ module Tài liệu.
- Một tài liệu có thể liên kết với 0, 1 hoặc nhiều bản ghi nghiệp vụ.
- Một bản ghi nghiệp vụ có thể có nhiều tài liệu liên quan.
- Xóa liên kết khác với xóa tài liệu.
- Xóa tài liệu nên là xóa mềm trong giai đoạn đầu.

## 3. Luồng nghiệp vụ

### 3.1. Upload từ bản ghi nghiệp vụ

1. Người dùng mở bản ghi Nhà kho/Camera/Cứu hỏa/Công trình.
2. Trong panel Tài liệu liên quan, bấm `Upload tài liệu mới`.
3. Chọn file từ máy.
4. Hệ thống copy file vào kho tài liệu.
5. Hệ thống tạo bản ghi `documents`.
6. Hệ thống tạo liên kết `document_links` tới bản ghi hiện tại.
7. Panel tài liệu trong record hiển thị tài liệu vừa upload.

### 3.2. Upload từ module Quản lý tài liệu

1. Người dùng mở tab `Tài liệu`.
2. Bấm `Upload tài liệu`.
3. Chọn file và nhập metadata: tiêu đề, loại tài liệu, mô tả, tags.
4. Hệ thống tạo bản ghi tài liệu độc lập.
5. Người dùng có thể mở chi tiết tài liệu và chọn `Gắn với bản ghi`.
6. Người dùng chọn module nghiệp vụ và bản ghi cụ thể.
7. Hệ thống tạo liên kết.

### 3.3. Gắn tài liệu có sẵn từ record nghiệp vụ

1. Người dùng mở bản ghi nghiệp vụ.
2. Bấm `Gắn tài liệu có sẵn`.
3. Tìm tài liệu trong kho tài liệu tập trung.
4. Chọn tài liệu.
5. Hệ thống tạo liên kết từ tài liệu tới record hiện tại.

## 4. Mô hình dữ liệu

### 4.1. Bảng `documents`

```sql
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT,
  tags TEXT,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  extension TEXT,
  mime_type TEXT,
  size_bytes INTEGER DEFAULT 0,
  sha256 TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
```

### 4.2. Bảng `document_links`

```sql
CREATE TABLE IF NOT EXISTS document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  relation_type TEXT DEFAULT 'attachment',
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### 4.3. Index

```sql
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
CREATE INDEX IF NOT EXISTS idx_document_links_entity ON document_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_links_document ON document_links(document_id);
```

## 5. Kho lưu file

File được lưu trong `app.getPath('userData')/documents`.

Đề xuất cấu trúc:

```txt
userData/
  warehouse.db
  documents/
    by-id/
      1/
        hop-dong-kho-k02.pdf
      2/
        quyet-dinh-cong-trinh.xlsx
```

Lý do chọn `by-id/{document_id}`:

- Dễ truy vết từ DB sang file.
- Một tài liệu liên kết nhiều record vẫn chỉ có một file vật lý.
- Đổi title/tags không cần đổi đường dẫn.
- Dễ backup/restore.

## 6. Metadata tài liệu

Các trường metadata tối thiểu:

- Tiêu đề tài liệu.
- Mô tả.
- Loại tài liệu.
- Tags.
- Tên file gốc.
- Đường dẫn file lưu trong kho tài liệu.
- Extension.
- Kích thước.
- SHA-256 để phát hiện trùng file.
- Trạng thái.
- Ngày tạo/cập nhật.

## 7. Loại file hỗ trợ giai đoạn đầu

- PDF: `.pdf`
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`
- Ảnh: `.jpg`, `.jpeg`, `.png`
- File nén: `.zip`, `.rar` nếu cần

Giới hạn kích thước mặc định nên giữ theo `file_guard.js`: 25MB/file.

## 8. UI module Tài liệu

### 8.1. Sidebar

Thêm tab mới:

```txt
Tài liệu
```

### 8.2. Danh sách tài liệu

Cột đề xuất:

- Tiêu đề
- Loại tài liệu
- File gốc
- Tags
- Dung lượng
- Số liên kết
- Ngày upload
- Hành động: Mở, Chi tiết, Xóa

### 8.3. Chi tiết tài liệu

Gồm hai phần:

**Thông tin tài liệu**

- Tiêu đề
- Mô tả
- Loại tài liệu
- Tags
- Tên file gốc
- Dung lượng
- Đường dẫn lưu

**Liên kết nghiệp vụ**

- Danh sách record đang liên kết
- Module
- Tên bản ghi
- Loại liên kết
- Ghi chú
- Hành động: Mở record, Gỡ liên kết

### 8.4. Panel tài liệu trong từng record

Trong form chi tiết của Nhà kho/Camera/Cứu hỏa/Công trình thêm section:

```txt
Tài liệu liên quan
[Upload tài liệu mới] [Gắn tài liệu có sẵn]
```

Danh sách:

- Tên tài liệu
- Loại
- Ngày upload
- Hành động: Mở, Xem chi tiết, Gỡ liên kết

Nếu record chưa được lưu và chưa có `id`, hiển thị:

```txt
Lưu bản ghi trước khi đính kèm tài liệu.
```

## 9. Backend service

Tạo file:

```txt
src/main/documents.js
```

Các hàm cần có:

```js
listDocuments(filters)
getDocument(id)
createDocumentFromFile(filePath, metadata)
updateDocument(id, metadata)
deleteDocument(id)
listLinks(documentId)
linkDocument(documentId, entityType, entityId, relationType, note)
unlinkDocument(linkId)
listDocumentsForEntity(entityType, entityId)
openDocument(id)
revealDocument(id)
```

## 10. IPC và preload

### IPC

```js
ipcMain.handle('documents:list', ...)
ipcMain.handle('documents:getById', ...)
ipcMain.handle('documents:createFromFile', ...)
ipcMain.handle('documents:update', ...)
ipcMain.handle('documents:delete', ...)
ipcMain.handle('documents:listForEntity', ...)
ipcMain.handle('documents:link', ...)
ipcMain.handle('documents:unlink', ...)
ipcMain.handle('documents:open', ...)
ipcMain.handle('documents:reveal', ...)
```

### Preload

```js
documents: {
  list: (filters) => ipcRenderer.invoke('documents:list', filters),
  getById: (id) => ipcRenderer.invoke('documents:getById', id),
  createFromFile: (filePath, metadata) => ipcRenderer.invoke('documents:createFromFile', filePath, metadata),
  update: (id, metadata) => ipcRenderer.invoke('documents:update', id, metadata),
  delete: (id) => ipcRenderer.invoke('documents:delete', id),
  listForEntity: (entityType, entityId) => ipcRenderer.invoke('documents:listForEntity', entityType, entityId),
  link: (documentId, entityType, entityId, relationType, note) => ipcRenderer.invoke('documents:link', documentId, entityType, entityId, relationType, note),
  unlink: (linkId) => ipcRenderer.invoke('documents:unlink', linkId),
  open: (id) => ipcRenderer.invoke('documents:open', id),
  reveal: (id) => ipcRenderer.invoke('documents:reveal', id)
}
```

## 11. Tích hợp registry

Trong `src/shared/module_registry.js`:

- Thêm module `documents`.
- Với module nghiệp vụ, thêm `documents: { enabled: true }`.
- Không bật tài liệu cho cấu hình.

## 12. Smart Search

Giai đoạn đầu chỉ tìm metadata tài liệu:

- title
- original_name
- description
- document_type
- tags

Không OCR, không đọc nội dung PDF/Word trong giai đoạn đầu.

Khi click kết quả tài liệu, mở chi tiết tài liệu.

## 13. Audit log

Các thao tác cần ghi audit:

- `document:create`
- `document:update`
- `document:delete`
- `document:open`
- `document:link`
- `document:unlink`

## 14. Backup/restore

Vì file tài liệu không nằm trong DB, backup cần nâng cấp theo hướng backup cả DB và thư mục `documents`.

Giai đoạn đầu có thể:

- Backup DB như hiện tại.
- Hiển thị cảnh báo rằng tài liệu nằm trong kho tài liệu hệ thống.

Giai đoạn hoàn thiện nên tạo backup package gồm:

```txt
warehouse.db
documents/
manifest.json
```

## 15. Kiểm tra chất lượng dữ liệu tài liệu

Các case cần rà soát:

- Tài liệu chưa gắn record nào.
- Link trỏ tới record không còn tồn tại.
- Metadata có nhưng file vật lý mất.
- File trùng SHA-256.
- Tài liệu đã xóa mềm nhưng vẫn còn link active.

## 16. Kết luận

Module tài liệu nên được xây như một module nghiệp vụ mới có quản lý tập trung, đồng thời cung cấp panel tài liệu liên quan trong từng record nghiệp vụ. Đây là mô hình hai chiều phù hợp nhất với hệ thống hiện tại.

## Backup và tài liệu

Module Tài liệu lưu file vật lý trong `userData/documents/by-id/{document_id}`. DB chỉ lưu metadata và liên kết.

Lưu ý giai đoạn hiện tại: backup DB bảo vệ metadata, nhưng để khôi phục đầy đủ tài liệu cần sao lưu thêm thư mục `documents` trong thư mục dữ liệu ứng dụng. Phase tiếp theo nên nâng backup thành package gồm `warehouse.db`, `documents/` và `manifest.json`.
