# Tài liệu dự án Warehouse Management

## Vai trò từng file

- `mota.md`: mô tả yêu cầu ban đầu từ người dùng.
- `spec.md`: đặc tả hệ thống chính, là nguồn sự thật cho nghiệp vụ, dữ liệu, API và các ràng buộc kỹ thuật đã chốt.
- `spec-review.md`: biên bản rà soát đặc tả, ghi rõ điểm đã rõ, điểm còn thiếu, quyết định kỹ thuật và rủi ro; không thay thế `spec.md`.
- `implementation-plan.md`: kế hoạch triển khai mã nguồn theo phase/task; phải bám theo `spec.md` và `deployment-strategy.md`.
- `deployment-strategy.md`: phương án đóng gói, cài đặt, setup database, backup/restore và update.
- `session-summary.md`: tổng hợp quyết định trong session và checklist rà soát trước khi viết code.

## Triết lý thiết kế đã thống nhất

- Bản đầu tiên là web app quản trị nội bộ chạy trên một máy/1 người dùng duy nhất.
- Chỉ có một tài khoản ứng dụng cố định: `admin`.
- Database mặc định là SQLite.
- Installer dùng Inno Setup tạo file `.exe`.
- Installer không tạo sẵn database, không đóng gói database đã tạo trước và không tạo admin trước.
- Database chỉ được tạo ở bước setup cuối sau khi người dùng chọn vị trí lưu và xác nhận.
- Sau khi tạo database, setup wizard tự tạo tài khoản `admin` với mật khẩu mặc định `admin`.
- Người dùng được đổi mật khẩu, không được đổi username `admin`.
- User/password trong bản SQLite là tài khoản ứng dụng, không phải database user/password riêng.
- Migration/seed chỉ chạy sau khi database được người dùng xác nhận tạo.
- Không dùng SQLite cho nhiều máy/nhiều người ghi dữ liệu đồng thời qua LAN; nếu cần mô hình đó thì nâng cấp sang PostgreSQL.


## Quyết định kỹ thuật đã chốt thêm

- UI framework: Ant Design.
- Auth: session cookie.
- Backend runtime: Windows service.
- Packaging backend: PyInstaller.
- File đính kèm: có trong bản đầu tiên.
- Excel: có xuất Excel và import nhanh từ Excel bằng file mẫu, có kiểm tra định dạng/kiểu dữ liệu và báo lỗi.
- PDF: dùng ReportLab cho bản đầu tiên.
- Backup: có backup tự động theo lịch trong bản đầu tiên.

## Trạng thái trước khi triển khai mã nguồn

Chưa triển khai mã nguồn. Cần người dùng chốt các điểm còn lại trong `implementation-plan.md` và `deployment-strategy.md` trước khi bắt đầu code.
