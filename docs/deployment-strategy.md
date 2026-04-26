# Phương án triển khai và đóng gói Warehouse Management

## Kết luận đã chốt

Bản đầu tiên của Warehouse Management sẽ dùng SQLite làm database mặc định và đóng gói bằng Inno Setup thành một file cài đặt `.exe`.

Lý do chốt SQLite:

- Phạm vi hiện tại là 1 user hoặc một máy thao tác dữ liệu chính.
- SQLite đáp ứng chắc chắn các chức năng nghiệp vụ trong `docs/mota.md`.
- Không cần cài PostgreSQL hay database server riêng.
- Dễ đóng gói all-in-one bằng Inno Setup.
- Ít lỗi môi trường hơn khi triển khai cho người dùng cuối.
- Backup/restore đơn giản hơn vì database là một file dữ liệu do người dùng tạo trong setup wizard.

## Kiến trúc triển khai khuyến nghị

```text
Windows PC
├── Warehouse Management Backend
│   ├── Python FastAPI executable
│   ├── REST API
│   ├── Static frontend files
│   └── Migration/seed runner chỉ chạy sau khi người dùng xác nhận setup
│
├── SQLite database file
│   └── Do người dùng chọn/tạo trong setup wizard
│
├── Config
│   ├── %ProgramData%/WarehouseManagement/config/app.env
│   ├── %ProgramData%/WarehouseManagement/config/installer-state.json
│   └── %ProgramData%/WarehouseManagement/logs/
│
└── Browser UI
    └── http://localhost:<port>
```

## Stack kỹ thuật đề xuất

- Backend: Python 3 + FastAPI.
- ORM/migration: SQLAlchemy 2 + Alembic.
- Database: SQLite.
- Auth: session cookie.
- Frontend: React + TypeScript + Vite.
- Style: SCSS/CSS/HTML.
- UI component: Ant Design.
- Export/Import Excel: openpyxl hoặc xlsxwriter ở backend.
- Export PDF: ReportLab.
- Backend packaging: PyInstaller.
- Installer `.exe`: Inno Setup.
- Installer `.msi`: WiX Toolset chỉ dùng nếu sau này bắt buộc chuẩn MSI.

## Các yêu cầu chắc chắn làm được với SQLite

- Web app có cơ sở dữ liệu.
- Đăng nhập bằng tài khoản cố định `admin` và đổi mật khẩu.
- Dashboard tổng quan.
- Quản lý nhà kho: thêm, sửa, xóa, tìm kiếm, lọc, phân trang, hiển thị theo đơn vị.
- Quản lý hệ thống camera.
- Quản lý hệ thống cứu hỏa.
- Quản lý công trình xây mới, nâng cấp, sửa chữa.
- Tab cấu hình: đơn vị đa cấp, tỉnh/xã, phân loại kho, loại hàng, chất lượng kho, cứu hỏa, chống sét.
- Combobox động lấy dữ liệu từ danh mục.
- Ràng buộc khóa ngoại, transaction và migration schema.
- Audit log ở mức ứng dụng.
- Upload/lưu metadata file đính kèm.
- Xuất Excel.
- Import Excel nhanh từ file mẫu, có kiểm tra header, định dạng, kiểu dữ liệu và báo lỗi theo dòng/cột.
- Xuất PDF bằng ReportLab.
- Đóng gói all-in-one bằng Inno Setup.
- Setup wizard ở bước cuối cho người dùng chọn vị trí database, xác nhận tạo database, chạy migration/seed và tự tạo `admin/admin`.
- Backup/restore bằng chức năng backup trong app, gồm backup thủ công và backup tự động theo lịch.

## Giới hạn thật sự của SQLite

SQLite chỉ ảnh hưởng đáng kể đến yêu cầu multi-user đồng thời:

- Không phù hợp nhiều người cùng ghi dữ liệu đồng thời.
- Không khuyến nghị đặt file `.sqlite` trên thư mục mạng để nhiều máy cùng mở/ghi.
- Không có mô hình database server/service như PostgreSQL.
- Không triển khai phân quyền nhiều vai trò trong bản đầu tiên; mọi chức năng sau đăng nhập thuộc quyền admin.

Nếu phát sinh nhu cầu nhiều máy trong LAN cùng nhập/sửa dữ liệu đồng thời hoặc server tập trung, cần nâng cấp sang PostgreSQL.

## Luồng cài đặt bằng Inno Setup

Nguyên tắc bắt buộc: installer không tạo sẵn database. Database chỉ được tạo ở bước cuối, trên máy người dùng, sau khi người dùng chọn vị trí lưu database và xác nhận tạo.

1. Người dùng chạy `WarehouseManagementSetup.exe`.
2. Installer cài ứng dụng vào `Program Files/Warehouse Management` hoặc thư mục người dùng chọn.
3. Installer cài backend executable và frontend static files.
4. Installer tạo Windows service cho backend và shortcut mở ứng dụng.
5. Installer không tạo database file, không tạo admin và không seed dữ liệu thật.
6. Sau khi cài xong, ứng dụng mở setup wizard.
7. Người dùng chọn vị trí lưu database file SQLite.
8. Người dùng nhập tên database file hoặc dùng tên mặc định như `warehouse.db`.
9. Wizard hiển thị thông tin tài khoản mặc định `admin/admin`.
10. Người dùng xác nhận tạo database.
11. Wizard tạo database file tại vị trí người dùng đã chọn.
12. Wizard chạy Alembic migration để tạo schema.
13. Wizard seed tài khoản `admin/admin` và danh mục mặc định.
14. Wizard hoàn tất setup và chuyển sang màn hình đăng nhập/dashboard.

## Setup wizard khởi tạo cuối

Setup wizard là bước cuối cùng trước khi phần mềm đi vào hoạt động. Nếu chưa hoàn tất setup, ứng dụng chỉ được hiển thị wizard, không được cho vào dashboard nghiệp vụ.

### Chức năng wizard

- Kiểm tra trạng thái setup.
- Cho người dùng chọn vị trí lưu database file SQLite.
- Cho người dùng nhập tên database file.
- Cảnh báo nếu vị trí không có quyền ghi hoặc nằm trong thư mục không phù hợp.
- Hiển thị tài khoản mặc định `admin/admin`.
- Hiển thị màn hình xác nhận trước khi tạo database.
- Chỉ tạo database sau khi người dùng xác nhận.
- Bật SQLite foreign key.
- Chạy migration.
- Seed dữ liệu nền.
- Lưu trạng thái setup hoàn tất.
- Kiểm tra trạng thái hệ thống sau setup.

### Trạng thái cần lưu

- App đã setup hay chưa.
- Đường dẫn database file do người dùng chọn.
- Version schema hiện tại.
- Version ứng dụng hiện tại.
- Thời điểm setup và trạng thái tài khoản admin.

### Lưu ý về user/password

SQLite không có database user/password riêng như PostgreSQL. Bản đầu tiên chỉ có tài khoản ứng dụng cố định `admin/admin`. Người dùng được đổi mật khẩu sau khi đăng nhập, nhưng không được đổi username `admin`. Nếu cần mật khẩu mã hóa database file, phải chốt thêm cơ chế SQLCipher hoặc phương án mã hóa tương đương trước khi triển khai.

## Chiến lược update phần mềm

Bộ cài cần hỗ trợ update version sau này:

1. Dừng backend nếu đang chạy.
2. Backup database file trước khi migrate.
3. Cập nhật file backend/frontend.
4. Chạy Alembic migration.
5. Khởi động lại ứng dụng.
6. Ghi log kết quả update.
7. Nếu migration lỗi, giữ backup và hiển thị hướng dẫn rollback.

## Backup và restore

Cần đưa backup/restore vào phạm vi triển khai:

- Backup thủ công từ giao diện admin.
- Backup tự động theo lịch trong bản đầu tiên.
- Cho phép cấu hình lịch backup cơ bản, ví dụ hằng ngày/hằng tuần và thư mục lưu backup.
- File backup gồm database file và thư mục file đính kèm.
- Restore từ file backup có xác nhận.
- Export dữ liệu nghiệp vụ ra Excel không thay thế backup database.

## Quyền cài đặt và vận hành

- Installer cần quyền Administrator để cài Windows service nếu người dùng chọn cài theo chuẩn đề xuất.
- Database file không đặt trong `Program Files`.
- Database file đặt tại vị trí người dùng chọn trong setup wizard; vị trí gợi ý là `%ProgramData%/WarehouseManagement/data/`.
- Secret như khóa ký token/session lưu trong file cấu hình, không hard-code trong source code.
- Uninstall không xóa database file do người dùng tạo nếu người dùng chưa xác nhận rõ.

## Khi nào cần chuyển sang PostgreSQL

Chỉ nên chuyển sang PostgreSQL nếu phát sinh một trong các yêu cầu sau:

- Nhiều máy trong LAN cùng truy cập và nhập/sửa dữ liệu đồng thời.
- Cần chạy như server tập trung cho nhiều đơn vị.
- Dữ liệu tăng lớn và báo cáo nặng.
- Cần backup/restore và vận hành theo chuẩn database server.
- Cần tích hợp hệ thống khác truy cập database/API đồng thời với tải cao.

## Quyết định cần chốt trước khi code

- App chạy dạng mở trình duyệt local hay đóng gói kèm desktop shell?
- Có cần `.msi` không, hay chỉ cần `.exe` bằng Inno Setup?
