# Tổng hợp trao đổi và rà soát trước khi viết code

## Mục đích

Tài liệu này tổng hợp các quyết định đã chốt trong session hiện tại và rà soát lại trạng thái tài liệu trước khi triển khai mã nguồn.

## Các quyết định đã chốt

### 1. Phạm vi người dùng

- Bản đầu tiên chỉ phục vụ 1 người dùng duy nhất trên 1 máy.
- Không triển khai multi-user trong bản đầu tiên.
- Không triển khai nhiều tài khoản, role hoặc permission trong bản đầu tiên.
- Nếu sau này cần nhiều người dùng/máy cùng ghi dữ liệu trong LAN, sẽ nâng cấp kiến trúc và database.

### 2. Tài khoản đăng nhập

- Username cố định: `admin`.
- Mật khẩu mặc định: `admin`.
- Setup wizard tự tạo tài khoản `admin/admin` sau khi database được người dùng xác nhận tạo.
- Người dùng được đổi mật khẩu sau khi đăng nhập.
- Người dùng không được đổi username `admin`.
- Không có màn hình tạo/xóa user, role hoặc permission trong bản đầu tiên.

### 3. Database

- Database mặc định: SQLite.
- SQLite đáp ứng chắc chắn các yêu cầu nghiệp vụ của bản 1 user.
- SQLite không dùng cho nhiều máy/nhiều người ghi dữ liệu đồng thời qua LAN.
- PostgreSQL chỉ là hướng nâng cấp tương lai nếu cần server tập trung hoặc multi-user đồng thời.

### 4. Khởi tạo database

- Installer không tạo database trước.
- Installer không đóng gói database đã tạo sẵn.
- Installer không tạo admin trước.
- Database chỉ được tạo trong setup wizard ở bước cuối trước khi phần mềm đi vào hoạt động.
- Người dùng chọn vị trí lưu database và xác nhận tạo database.
- Sau khi người dùng xác nhận, hệ thống chạy migration/seed và tự tạo `admin/admin`.

### 5. Đóng gói triển khai

- Dùng Inno Setup để tạo file `.exe` cho bản đầu tiên.
- `.msi` chỉ làm nếu sau này bắt buộc theo yêu cầu triển khai Windows doanh nghiệp.
- Backend/frontend được cài bởi installer; database file nằm ở vị trí người dùng chọn, không nằm mặc định trong thư mục cài đặt chương trình.

### 6. Stack kỹ thuật định hướng

- Backend: Python FastAPI.
- ORM/migration: SQLAlchemy + Alembic.
- Frontend: React + TypeScript + Vite.
- Style: SCSS/CSS/HTML.
- Database: SQLite.
- Installer: Inno Setup.

## Vai trò tài liệu hiện tại

- `docs/mota.md`: mô tả yêu cầu ban đầu đã được cập nhật theo quyết định 1 user/admin-only.
- `docs/spec.md`: đặc tả chính, nguồn sự thật cho nghiệp vụ, dữ liệu, API và ràng buộc đã chốt.
- `docs/spec-review.md`: biên bản rà soát, không thay thế `spec.md`.
- `docs/implementation-plan.md`: kế hoạch triển khai task/phase, phải bám theo `spec.md`.
- `docs/deployment-strategy.md`: chiến lược installer, setup database, update, backup/restore.
- `docs/README.md`: bản đồ tài liệu và triết lý thiết kế.

## Rà soát trước khi viết code

### Đã thống nhất

- [x] SQLite là database mặc định.
- [x] Chỉ có tài khoản `admin`.
- [x] Mật khẩu mặc định là `admin`.
- [x] Cho đổi mật khẩu, không cho đổi username.
- [x] Installer không tạo database trước.
- [x] Database tạo trong setup wizard sau khi người dùng xác nhận.
- [x] Inno Setup là phương án đóng gói `.exe`.
- [x] `spec.md` là tài liệu đặc tả chính; `spec-review.md` không thay thế `spec.md`.

### Quyết định kỹ thuật mới đã chốt

- [x] UI framework: dùng Ant Design để tối ưu cho hệ thống quản trị nhiều form/bảng và đảm bảo đồng bộ bảo trì.
- [x] Cơ chế auth: session cookie.
- [x] Backend runtime: Windows service.
- [x] Packaging backend: PyInstaller cho bản đầu tiên.
- [x] File đính kèm nằm trong bản đầu tiên.
- [x] Xuất Excel nằm trong bản đầu tiên.
- [x] Import dữ liệu nhanh từ Excel nằm trong bản đầu tiên.
- [x] Import Excel phải có file mẫu theo cấu trúc trường dữ liệu, kiểm tra định dạng, kiểu dữ liệu và báo lỗi rõ khi người dùng nhập sai.

### Quyết định kỹ thuật cuối đã chốt

- [x] Backup tự động theo lịch nằm trong bản đầu tiên.
- [x] Xuất PDF dùng ReportLab cho bản đầu tiên để tối ưu độ ổn định khi đóng gói Windows/PyInstaller và tránh phụ thuộc native/browser phức tạp.

## Kết luận rà soát

Các tài liệu trong `docs/` hiện đã thống nhất theo cùng một triết lý thiết kế: bản đầu tiên là web app SQLite chạy 1 máy/1 người dùng duy nhất, đăng nhập bằng tài khoản cố định `admin`, đóng gói bằng Inno Setup, và database chỉ được tạo ở setup wizard sau khi người dùng xác nhận.

Các điểm kỹ thuật chính đã được chốt; có thể chuyển sang triển khai mã nguồn khi người dùng xác nhận bắt đầu code.
