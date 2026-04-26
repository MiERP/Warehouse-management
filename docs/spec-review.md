# Rà soát đặc tả hệ thống Warehouse Management

## Vai trò của các tài liệu

- `docs/spec.md` là đặc tả hệ thống chính, dùng làm nguồn sự thật cho nghiệp vụ, dữ liệu, API và ràng buộc kỹ thuật đã chốt.
- `docs/spec-review.md` là biên bản rà soát/ghi chú quyết định, dùng để chỉ ra điểm đã rõ, điểm còn thiếu và rủi ro; không thay thế `docs/spec.md`.
- `docs/implementation-plan.md` là kế hoạch triển khai theo task, phụ thuộc vào `docs/spec.md`.
- `docs/deployment-strategy.md` là chiến lược đóng gói/cài đặt, phụ thuộc vào quyết định SQLite + Inno Setup trong `docs/spec.md`.

## Kết luận nhanh

`docs/spec.md` đã bao phủ tốt phạm vi nghiệp vụ chính: đăng nhập admin, dashboard, quản lý nhà kho, camera, cứu hỏa, công trình, cấu hình, báo cáo và xuất dữ liệu. Theo quyết định hiện tại, bản đầu tiên sẽ triển khai theo mô hình 1 user/1 máy thao tác chính, dùng SQLite để đóng gói đơn giản bằng Inno Setup.

## Điểm đã rõ

- Hệ thống là web app có cơ sở dữ liệu.
- Phạm vi hiện tại chốt theo hướng 1 user/1 máy thao tác chính.
- Các module nghiệp vụ chính đã được xác định.
- Layout tổng thể, danh sách màn hình và API CRUD cơ bản đã có.
- Cấu trúc dữ liệu nền cho tài khoản admin duy nhất, đơn vị, địa phương và danh mục đã tương đối đầy đủ.
- Module nhà kho và camera đã có trường dữ liệu tương đối sát với `docs/mota.md`.
- Có định hướng xóa mềm, audit log, file đính kèm, xuất Excel/PDF và báo cáo.
- Có yêu cầu đóng gói Windows installer dạng `.exe` hoặc `.msi`.

## Quyết định kỹ thuật đã chốt

- Database mặc định: SQLite.
- Installer mặc định: Inno Setup tạo file `.exe`.
- Backend ưu tiên: Python FastAPI.
- ORM/migration: SQLAlchemy + Alembic.
- Frontend: React + TypeScript + Vite.
- Styling: SCSS/CSS/HTML theo yêu cầu trong `docs/mota.md`.

## Quyết định kỹ thuật bổ sung đã chốt

- UI component: Ant Design, vì phù hợp hệ thống quản trị nhiều form/bảng và giúp giao diện đồng bộ, dễ bảo trì.
- Auth: session cookie.
- Backend runtime: Windows service.
- Packaging backend: PyInstaller cho bản đầu tiên.
- File đính kèm: có trong bản đầu tiên.
- Excel: có xuất Excel và import nhanh từ Excel.
- Import Excel: phải có file mẫu theo cấu trúc trường dữ liệu, kiểm tra định dạng/kiểu dữ liệu và báo lỗi rõ ràng khi dữ liệu sai.
- Export PDF: dùng ReportLab cho bản đầu tiên để ổn định với Windows/PyInstaller và tránh phụ thuộc native/browser phức tạp.
- Backup tự động theo lịch: có trong bản đầu tiên.

## Nguyên tắc khởi tạo database

- Không tạo database trước trong source code, build artifact hoặc installer.
- Installer chỉ cài chương trình và mở setup wizard.
- Database chỉ được tạo ở bước cuối trước khi phần mềm hoạt động, sau khi người dùng chọn vị trí lưu và xác nhận.
- Setup wizard tự tạo tài khoản ứng dụng duy nhất `admin/admin` sau khi người dùng xác nhận tạo database.
- Người dùng được đổi mật khẩu, không được đổi username `admin`.
- Với SQLite, user/password là tài khoản ứng dụng; SQLite không có database user/password riêng như PostgreSQL.

## Lý do chọn SQLite

SQLite đáp ứng chắc chắn các yêu cầu nghiệp vụ hiện tại nếu phạm vi là 1 user hoặc một máy thao tác dữ liệu chính:

- Web app có cơ sở dữ liệu.
- Đăng nhập bằng tài khoản admin duy nhất.
- Dashboard và báo cáo.
- CRUD cho nhà kho, camera, cứu hỏa, công trình.
- Cấu hình đơn vị, địa phương và danh mục.
- Combobox động, lọc, tìm kiếm, phân trang.
- Xóa mềm, audit log, migration và transaction.
- Xuất Excel/PDF bằng ReportLab cho PDF.
- Đóng gói all-in-one bằng Inno Setup.
- Setup wizard ở bước cuối cho người dùng chọn vị trí database, xác nhận tạo database, chạy migration/seed và tự tạo `admin/admin`.

## Giới hạn cần ghi rõ

SQLite chỉ không phù hợp nếu yêu cầu chuyển sang multi-user đồng thời theo nghĩa nhiều máy/nhiều người cùng ghi dữ liệu trong LAN hoặc server tập trung.

Không khuyến nghị:

- Đặt file SQLite trên ổ mạng để nhiều máy cùng ghi.
- Dùng SQLite cho nhiều người nhập/sửa dữ liệu đồng thời liên tục.
- Coi SQLite database-level là cơ chế bảo mật tài khoản; bảo vệ truy cập nằm ở tầng ứng dụng qua đăng nhập admin.

Nếu phát sinh các yêu cầu trên, cần nâng cấp database sang PostgreSQL.

## Nội dung cần bổ sung vào spec trước khi code chi tiết

### 1. Lệnh phát triển chuẩn

Spec hiện chưa có phần commands. Cần bổ sung sau khi scaffold dự án:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run db:migrate
npm run db:seed
```

Lệnh thực tế có thể thay đổi nếu dùng `uv`, `poetry`, `pnpm` hoặc công cụ tương đương.

### 2. Quy tắc dữ liệu bắt buộc

Cần đánh dấu rõ từng trường là bắt buộc/không bắt buộc, kiểu dữ liệu, min/max và format. Ví dụ:

- Năm xây dựng, năm sửa chữa: số nguyên 4 chữ số, không lớn hơn năm hiện tại.
- Diện tích, sức chứa, trữ lượng: số không âm.
- Tên kho: bắt buộc, không trùng trong cùng đơn vị nếu nghiệp vụ yêu cầu.
- Tỉnh/xã: xã phải thuộc tỉnh đã chọn.

### 3. Tài khoản admin duy nhất

Với SQLite bản 1 user, hệ thống không triển khai nhiều user/role/permission trong bản đầu tiên:

- Username cố định: `admin`.
- Mật khẩu mặc định: `admin`.
- Setup wizard tự tạo `admin/admin` sau khi database được người dùng xác nhận tạo.
- Người dùng được đổi mật khẩu sau khi đăng nhập.
- Không cho phép đổi username `admin`.
- Không có màn hình tạo user, role hoặc permission trong bản đầu tiên.
- Nếu sau này cần nhiều người dùng/phân quyền, bổ sung schema và migration riêng.

### 4. Module còn thiếu trường chi tiết

Theo `docs/spec.md`, các module sau vẫn là đề xuất ban đầu và cần bổ sung từ Excel/mẫu nghiệp vụ:

- Hệ thống cứu hỏa.
- Công trình xây mới/nâng cấp/sửa chữa.
- Mẫu báo cáo đầu ra.
- Quy định chi tiết file đính kèm.
- Mẫu Excel import/export cho từng module.

### 5. Tiêu chí kiểm thử và nghiệm thu

Cần bổ sung rõ:

- Unit test cho service, validation, đăng nhập admin và đổi mật khẩu.
- Integration test cho API CRUD và auth.
- E2E test cho các luồng chính: đăng nhập, cấu hình danh mục, tạo/sửa/xóa nhà kho, xuất báo cáo.
- Kiểm thử setup wizard và installer trên Windows sạch.

### 6. Ranh giới triển khai

Đề xuất thêm vào spec:

- Luôn làm: validation server-side, audit log cho thao tác thay đổi dữ liệu, soft delete cho dữ liệu nghiệp vụ, bật SQLite foreign key.
- Hỏi trước: thay đổi schema lớn, thêm dependency lớn, thay đổi cơ chế auth, thêm nhiều user/role/permission.
- Không làm: lưu mật khẩu dạng plaintext, cho đổi username `admin`, hard-code secrets, xóa cứng dữ liệu nghiệp vụ khi chưa được duyệt, đặt database file mặc định trong thư mục cài đặt chương trình, tạo sẵn database trước khi người dùng xác nhận trong setup wizard.

## Các giả định dùng cho kế hoạch triển khai

- Dự án sẽ được triển khai mới từ đầu trong repository này.
- Ưu tiên web app quản trị nội bộ, responsive mức desktop/tablet trước.
- Database mặc định là SQLite.
- Database file chỉ được tạo trong setup wizard sau khi người dùng chọn vị trí lưu và xác nhận; vị trí gợi ý là `%ProgramData%/WarehouseManagement/data/warehouse.db`.
- Tất cả tài liệu Markdown mới đặt trong `docs/`.
- Chưa triển khai code cho tới khi người dùng chốt kỹ thuật cuối cùng.
