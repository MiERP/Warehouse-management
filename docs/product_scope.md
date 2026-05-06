# Product Scope - Warehouse Management

## Nguồn định hướng

Tài liệu gốc: `docs/mota.md`.

Mục tiêu giai đoạn hoàn thiện là bám đúng mô tả ban đầu, không mở rộng sang công nghệ hoặc phạm vi mới nếu không phục vụ trực tiếp nghiệp vụ quản lý kho.

## Phạm vi sản phẩm chính thức

### Kiểu triển khai

- Desktop app chạy local trên một máy.
- Một người dùng chính, tài khoản cố định `admin` trong giai đoạn đầu.
- Dữ liệu lưu local bằng SQLite.
- Không yêu cầu SaaS, cloud sync hoặc phân quyền nhiều người dùng trong bản hoàn thiện đầu tiên.

### Module chính thức

1. Dashboard quản lý chung.
2. Quản lý nhà kho.
3. Quản lý hệ thống camera an ninh.
4. Quản lý hệ thống cứu hỏa.
5. Quản lý công trình xây mới, sửa chữa, nâng cấp.
6. Cấu hình danh mục:
   - phân cấp đơn vị,
   - tỉnh/xã,
   - loại nhà kho,
   - loại hàng,
   - phân cấp chất lượng nhà kho,
   - hệ thống chống sét.

### Năng lực bắt buộc

- Thêm/sửa/xóa/xem danh sách cho từng module chính.
- Form nhập liệu bám các trường trong `docs/mota.md` và file Excel mẫu.
- Import Excel có preview và báo lỗi theo dòng.
- Export Excel theo dữ liệu đang có.
- Tìm kiếm thông minh nhẹ trong dữ liệu hiện có.
- Backup dữ liệu thủ công.
- Audit log thao tác dữ liệu quan trọng.
- Rà soát dữ liệu nghi trùng, không tự xóa.

## Ngoài phạm vi giai đoạn này

- LLM/chatbot/model AI nặng.
- SaaS web app nhiều tenant.
- Phân quyền nhiều vai trò phức tạp.
- Mobile app.
- Dashboard BI nâng cao.
- Module ngoài nhóm kho/camera/cứu hỏa/công trình/cấu hình.

## Nguyên tắc phát triển tiếp

1. Không thêm module mới nếu chưa đối chiếu với `docs/mota.md`.
2. Mọi field nghiệp vụ phải được khai báo trong `src/shared/module_registry.js` trước khi dùng ở form/import/export/search.
3. Không thêm parser rời trong renderer; import/export phải dần chuyển về service dùng template khai báo.
4. Không viết thêm CRUD lặp nếu có thể dùng core chung.
5. Tài liệu sản phẩm để trong `docs`, artifact QA để trong `docs/qa`.

## Bổ sung module Quản lý tài liệu

Module Quản lý tài liệu được bổ sung vào phạm vi sản phẩm như một module nghiệp vụ hỗ trợ toàn hệ thống.

Tài liệu chi tiết: `docs/document_management_module.md`.

Nguyên tắc phạm vi:

- Tài liệu là bản ghi độc lập trong kho tài liệu tập trung.
- File vật lý lưu trong kho tài liệu của hệ thống, không lưu BLOB trong SQLite.
- SQLite chỉ lưu metadata và liên kết.
- Tài liệu có thể được upload từ module Tài liệu hoặc từ từng record nghiệp vụ.
- Tài liệu có thể liên kết nhiều bản ghi nghiệp vụ.
- Chỉ áp dụng cho Nhà kho, Camera, Cứu hỏa, Công trình.
- Không áp dụng cho Cấu hình/danh mục trong giai đoạn đầu.
