# Kế hoạch triển khai mã nguồn Warehouse Management

## Tổng quan

Kế hoạch này chuyển `docs/mota.md` và `docs/spec.md` thành các giai đoạn triển khai mã nguồn theo thứ tự từ nền tảng kỹ thuật, dữ liệu cấu hình, module nghiệp vụ, báo cáo đến kiểm thử và bàn giao. Mỗi giai đoạn để lại hệ thống ở trạng thái có thể chạy, kiểm thử và demo được.

## Giả định kỹ thuật ban đầu

- Ứng dụng là web app quản trị nội bộ.
- Frontend dùng TypeScript; backend dùng Python; database dùng SQLite.
- Source code sẽ tách rõ frontend, backend Python, migration/seed SQLite và docs.
- API dùng REST theo danh sách endpoint trong `docs/spec.md`.
- Xóa dữ liệu nghiệp vụ dùng soft delete qua `deleted_at`.
- Audit log ghi lại thao tác tạo/sửa/xóa và đăng nhập quan trọng.

## Cấu trúc thư mục đề xuất

```text
.
├── apps/
│   ├── web/                 # Frontend application
│   └── api/                 # Backend API application
├── packages/
│   └── shared/              # Kiểu dữ liệu/schema dùng chung nếu thật sự cần
├── database/
│   ├── migrations/          # Alembic migrations
│   └── seeds/               # Dữ liệu mẫu ban đầu
├── docs/
│   ├── README.md
│   ├── mota.md
│   ├── spec.md
│   ├── spec-review.md
│   ├── deployment-strategy.md
│   └── implementation-plan.md
└── README.md
```

## Pha 1: Khởi tạo nền tảng dự án

### Task 1.1: Chốt và scaffold monorepo

**Mô tả:** Khởi tạo cấu trúc source code cho frontend TypeScript, backend Python, lint/format và biến môi trường mẫu.

**Tiêu chí nghiệm thu:**

- [ ] Có cấu trúc `apps/web`, `apps/api`, `packages/shared`, `database`, `docs`.
- [ ] Có lệnh chạy dev/build/test/lint cho frontend và backend.
- [ ] Có file `.env.example` cho đường dẫn SQLite, auth và app URL.

**Xác minh:**

- [ ] Lệnh build frontend chạy được.
- [ ] Lệnh kiểm tra backend Python chạy được.

**Phụ thuộc:** Không có.

### Task 1.2: Thiết lập database và ORM

**Mô tả:** Cấu hình SQLite, ORM/migration và seed templates/scripts; database thật chỉ được tạo trong setup wizard sau khi người dùng xác nhận.

**Tiêu chí nghiệm thu:**

- [ ] Có migration cho users, units, provinces, communes.
- [ ] Có seed script/template tạo `admin/admin` và danh mục mặc định; không tạo admin trước setup wizard.
- [ ] Có script migrate/seed rõ ràng.

**Xác minh:**

- [ ] Chạy migrate tạo được schema trong SQLite test/dev.
- [ ] Seed script/template hoạt động trong môi trường test/dev; installer không tạo database/admin trước setup wizard.

**Phụ thuộc:** Task 1.1.

### Checkpoint pha 1

- [ ] Repository có thể install, build và chạy dev tối thiểu.
- [ ] Migration/seed script sẵn sàng; database thật chỉ tạo trong setup wizard khi người dùng xác nhận.
- [ ] Tài liệu lệnh chạy được cập nhật trong `README.md` hoặc `docs/`.

## Pha 2: Xác thực admin và layout

### Task 2.1: Xây dựng authentication backend

**Mô tả:** Tạo API đăng nhập, đăng xuất, lấy thông tin tài khoản admin và đổi mật khẩu an toàn.

**Tiêu chí nghiệm thu:**

- [ ] `POST /api/auth/login` xác thực tài khoản `admin`.
- [ ] `POST /api/auth/logout` kết thúc phiên/token.
- [ ] `GET /api/auth/me` trả về thông tin admin.
- [ ] `PUT /api/admin/password` đổi mật khẩu admin.

**Xác minh:**

- [ ] Test đăng nhập thành công/thất bại với `admin`.
- [ ] Test đổi mật khẩu thành công/thất bại.
- [ ] Test route bảo vệ từ chối request chưa xác thực.

**Phụ thuộc:** Task 1.2.

### Task 2.2: Bảo vệ API sau đăng nhập

**Mô tả:** Tạo middleware/guard kiểm tra trạng thái đăng nhập cho toàn bộ API nghiệp vụ. Bản đầu tiên không có nhiều role/permission.

**Tiêu chí nghiệm thu:**

- [ ] API nghiệp vụ yêu cầu đăng nhập admin.
- [ ] Không có API tạo user, role hoặc permission.
- [ ] Username `admin` không thể thay đổi.

**Xác minh:**

- [ ] Test API nghiệp vụ từ chối request chưa đăng nhập.
- [ ] Test không tồn tại route tạo user/role/permission trong MVP.

**Phụ thuộc:** Task 2.1.

### Task 2.3: Xây dựng frontend layout và luồng đăng nhập

**Mô tả:** Tạo màn hình `/login`, layout chính gồm sidebar, header, search box, user menu và content area.

**Tiêu chí nghiệm thu:**

- [ ] Admin đăng nhập được và vào `/dashboard`.
- [ ] Sidebar hiển thị đầy đủ module cho admin.
- [ ] Admin đổi được mật khẩu.
- [ ] Logout đưa người dùng về `/login`.

**Xác minh:**

- [ ] E2E cơ bản cho login/logout.
- [ ] Build frontend thành công.

**Phụ thuộc:** Task 2.1, Task 2.2.

### Checkpoint pha 2

- [ ] Admin có thể đăng nhập và thấy layout chính.
- [ ] Route/API được bảo vệ bằng auth.
- [ ] Đổi mật khẩu admin hoạt động.

## Pha 3: Module cấu hình nền

### Task 3.1: Quản lý đơn vị đa cấp

**Mô tả:** Xây dựng CRUD đơn vị theo cây cha-con và API lấy danh sách cây đơn vị.

**Tiêu chí nghiệm thu:**

- [ ] Tạo/sửa/xóa mềm đơn vị.
- [ ] Hiển thị cây đơn vị nhiều cấp.
- [ ] Không cho xóa đơn vị đang có dữ liệu phụ thuộc nếu chưa xử lý rõ.

**Xác minh:**

- [ ] Test API CRUD đơn vị.
- [ ] Kiểm tra UI tạo đơn vị cha/con.

**Phụ thuộc:** Pha 2.

### Task 3.2: Quản lý tỉnh/xã

**Mô tả:** Xây dựng CRUD tỉnh, xã và combobox xã lọc theo tỉnh.

**Tiêu chí nghiệm thu:**

- [ ] Tạo/sửa/xóa tỉnh và xã.
- [ ] `GET /api/communes?province_id=...` trả đúng xã thuộc tỉnh.
- [ ] UI chọn tỉnh tự cập nhật danh sách xã.

**Xác minh:**

- [ ] Test API province/commune.
- [ ] Manual test combobox phụ thuộc.

**Phụ thuộc:** Pha 2.

### Task 3.3: Quản lý danh mục dùng chung

**Mô tả:** Xây CRUD các danh mục: phân loại kho, loại hàng, chất lượng nhà kho, loại cứu hỏa, chống sét.

**Tiêu chí nghiệm thu:**

- [ ] Có API và UI CRUD cho từng danh mục.
- [ ] Danh mục có `is_active` để ẩn/hiện khi chọn trong form.
- [ ] Combobox nghiệp vụ chỉ lấy danh mục đang active.

**Xác minh:**

- [ ] Test API danh mục.
- [ ] UI tạo/sửa/ẩn danh mục hoạt động.

**Phụ thuộc:** Pha 2.

### Checkpoint pha 3

- [ ] Toàn bộ dữ liệu nền phục vụ form nghiệp vụ đã có.
- [ ] Combobox động hoạt động đúng.
- [ ] Permission áp dụng cho nhóm cấu hình.

## Pha 4: Module quản lý nhà kho

### Task 4.1: Backend CRUD nhà kho

**Mô tả:** Xây dựng schema, validation và API cho module nhà kho theo trường trong spec.

**Tiêu chí nghiệm thu:**

- [ ] CRUD nhà kho đầy đủ.
- [ ] Validate số không âm, năm hợp lệ, xã thuộc tỉnh.
- [ ] Soft delete qua `deleted_at`.

**Xác minh:**

- [ ] Test API tạo/sửa/xóa/lọc nhà kho.
- [ ] Test API yêu cầu đăng nhập admin.

**Phụ thuộc:** Pha 3.

### Task 4.2: Frontend form và danh sách nhà kho

**Mô tả:** Xây dựng màn hình danh sách, bộ lọc, form tạo/sửa và chi tiết nhà kho.

**Tiêu chí nghiệm thu:**

- [ ] Form có đủ trường theo `docs/spec.md`.
- [ ] Danh sách có tìm kiếm, lọc, phân trang.
- [ ] Dữ liệu hiển thị theo cây đơn vị hoặc lọc theo đơn vị.

**Xác minh:**

- [ ] E2E tạo/sửa/xóa mềm nhà kho.
- [ ] Manual test combobox đơn vị, tỉnh/xã và danh mục.

**Phụ thuộc:** Task 4.1.

### Task 4.3: Xuất Excel nhà kho

**Mô tả:** Tạo API và nút xuất Excel theo bộ lọc hiện tại.

**Tiêu chí nghiệm thu:**

- [ ] Xuất đúng dữ liệu theo filter hiện tại.
- [ ] File có header tiếng Việt rõ ràng.
- [ ] Không xuất dữ liệu đã xóa mềm.

**Xác minh:**

- [ ] Test API export.
- [ ] Mở file Excel kiểm tra dữ liệu.

**Phụ thuộc:** Task 4.2.

### Task 4.4: Import Excel nhà kho

**Mô tả:** Tạo file mẫu import Excel và API/UI import nhà kho, có validate dữ liệu trước khi ghi vào SQLite.

**Tiêu chí nghiệm thu:**

- [ ] Tải được file mẫu import theo đúng cấu trúc trường nhà kho.
- [ ] Kiểm tra header, trường bắt buộc, kiểu dữ liệu số/năm/danh mục/tỉnh/xã.
- [ ] Báo lỗi theo dòng/cột khi dữ liệu sai định dạng hoặc sai quan hệ phụ thuộc.
- [ ] Chỉ ghi dữ liệu sau khi validate theo chính sách import đã chốt.

**Xác minh:**

- [ ] Test import file hợp lệ.
- [ ] Test import file sai kiểu dữ liệu.
- [ ] Test import file thiếu cột bắt buộc.

**Phụ thuộc:** Task 4.2.

### Checkpoint pha 4

- [ ] Module nhà kho hoàn chỉnh từ database, API đến UI.
- [ ] Quyền và giới hạn đơn vị hoạt động.
- [ ] Có thể xuất Excel nhà kho.

## Pha 5: Module camera, cứu hỏa và công trình

### Task 5.1: Module camera

**Mô tả:** Xây dựng CRUD, UI, filter, phân trang và export Excel cho hệ thống camera.

**Tiêu chí nghiệm thu:**

- [ ] Form có đủ trường camera trong `docs/mota.md` và `docs/spec.md`.
- [ ] Quản lý nhu cầu sửa chữa/lắp mới.
- [ ] Export Excel theo filter hiện tại.
- [ ] Có file mẫu import Excel và import có validate lỗi.

**Xác minh:**

- [ ] Test API CRUD/export camera.
- [ ] E2E tạo/sửa/xóa mềm camera.

**Phụ thuộc:** Pha 3.

### Task 5.2: Module cứu hỏa

**Mô tả:** Xây dựng module cứu hỏa theo schema đề xuất, có thể liên kết với nhà kho.

**Tiêu chí nghiệm thu:**

- [ ] CRUD hệ thống cứu hỏa.
- [ ] Có trường loại cứu hỏa, số lượng, năm lắp đặt/sửa chữa, tình trạng và nhu cầu.
- [ ] Có liên kết nhà kho nếu nghiệp vụ yêu cầu.

**Xác minh:**

- [ ] Test API CRUD/export cứu hỏa.
- [ ] Manual test liên kết nhà kho.

**Phụ thuộc:** Pha 4 nếu bật liên kết nhà kho; nếu không thì phụ thuộc Pha 3.

### Task 5.3: Module công trình

**Mô tả:** Xây dựng quản lý công trình xây mới/nâng cấp/sửa chữa, tiến độ, kinh phí và hồ sơ đính kèm.

**Tiêu chí nghiệm thu:**

- [ ] CRUD công trình theo `project_type`.
- [ ] Quản lý tiến độ, kinh phí, trạng thái.
- [ ] Upload/list/download file đính kèm hoạt động trong bản đầu tiên.

**Xác minh:**

- [ ] Test API CRUD công trình.
- [ ] Test upload/download file đính kèm.

**Phụ thuộc:** Pha 3.

### Checkpoint pha 5

- [ ] Camera, cứu hỏa và công trình có CRUD hoàn chỉnh.
- [ ] Các module áp dụng chung auth, audit log, soft delete.
- [ ] Export Excel và import Excel tối thiểu hoạt động cho camera/cứu hỏa/công trình.

## Pha 6: Dashboard, báo cáo và tìm kiếm

### Task 6.1: Dashboard tổng quan

**Mô tả:** Xây dựng API thống kê và màn hình dashboard theo đơn vị, nhà kho, camera, cứu hỏa và công trình.

**Tiêu chí nghiệm thu:**

- [ ] Thống kê tổng số nhà kho, diện tích, sức chứa, trữ lượng.
- [ ] Thống kê camera/cứu hỏa theo đơn vị và nhu cầu.
- [ ] Thống kê công trình theo trạng thái/loại công trình.

**Xác minh:**

- [ ] Test API dashboard.
- [ ] Manual so sánh số liệu dashboard với danh sách dữ liệu.

**Phụ thuộc:** Pha 4, Pha 5.

### Task 6.2: Báo cáo và xuất Excel/PDF

**Mô tả:** Xây dựng các báo cáo theo module, xuất Excel và xuất PDF bằng ReportLab.

**Tiêu chí nghiệm thu:**

- [ ] Báo cáo nhà kho, camera, cứu hỏa, công trình.
- [ ] Filter theo đơn vị, địa phương, năm, trạng thái nếu có dữ liệu.
- [ ] Xuất Excel theo dữ liệu/filter hiện tại.
- [ ] Xuất PDF bằng ReportLab.
- [ ] PDF đóng gói font hỗ trợ tiếng Việt.

**Xác minh:**

- [ ] Test API report/export Excel và PDF.
- [ ] Kiểm tra file xuất ra với dữ liệu mẫu.

**Phụ thuộc:** Task 6.1.

### Task 6.3: Tìm kiếm nhanh toàn hệ thống

**Mô tả:** Xây dựng ô tìm kiếm ở header để tìm nhanh theo tên kho, đơn vị, công trình hoặc module liên quan.

**Tiêu chí nghiệm thu:**

- [ ] Tìm kiếm trả kết quả theo dữ liệu hiện có.
- [ ] Có phân nhóm kết quả theo module.
- [ ] Click kết quả mở màn hình chi tiết tương ứng.

**Xác minh:**

- [ ] Test API search.
- [ ] Manual test tìm kiếm từ header.

**Phụ thuộc:** Pha 4, Pha 5.

### Checkpoint pha 6

- [ ] Dashboard và báo cáo dùng được cho vận hành.
- [ ] Số liệu khớp dữ liệu hiện có.
- [ ] File xuất đáp ứng mẫu đã chốt.

## Pha 7: Kiểm thử, bảo mật và bàn giao

### Task 7.1: Hoàn thiện test suite

**Mô tả:** Bổ sung test cho luồng chính, đăng nhập admin, đổi mật khẩu, validation, export và import Excel.

**Tiêu chí nghiệm thu:**

- [ ] Unit/integration test cho backend service và API quan trọng.
- [ ] E2E test cho đăng nhập, cấu hình, nhà kho, import Excel và báo cáo.
- [ ] Test đăng nhập admin, đổi mật khẩu, bảo vệ route và import Excel lỗi/hợp lệ.

**Xác minh:**

- [ ] `npm run test` pass.
- [ ] `npm run test:e2e` pass nếu có e2e.

**Phụ thuộc:** Pha 6.

### Task 7.2: Hardening và audit

**Mô tả:** Rà soát bảo mật, validation, logging, error handling và audit log.

**Tiêu chí nghiệm thu:**

- [ ] Không lưu secret trong source.
- [ ] Password được hash an toàn.
- [ ] API trả lỗi chuẩn hóa, không lộ stack trace production.
- [ ] Audit log ghi thao tác quan trọng.

**Xác minh:**

- [ ] Chạy lint/test/build.
- [ ] Manual review auth admin và cấu hình env.

**Phụ thuộc:** Pha 6.

### Task 7.3: Backup tự động theo lịch

**Mô tả:** Xây dựng chức năng backup thủ công và backup tự động theo lịch cho database SQLite và file đính kèm.

**Tiêu chí nghiệm thu:**

- [ ] Admin cấu hình được thư mục lưu backup.
- [ ] Admin cấu hình được lịch backup cơ bản hằng ngày/hằng tuần.
- [ ] Backup gồm database SQLite và thư mục file đính kèm.
- [ ] Restore từ backup yêu cầu xác nhận trước khi ghi đè dữ liệu.
- [ ] Ghi log kết quả backup/restore.

**Xác minh:**

- [ ] Test backup thủ công.
- [ ] Test backup theo lịch.
- [ ] Test restore từ file backup hợp lệ.

**Phụ thuộc:** Pha 6.

### Task 7.4: Tài liệu triển khai và hướng dẫn sử dụng

**Mô tả:** Viết tài liệu setup, deploy, seed dữ liệu, backup/restore và hướng dẫn thao tác chính.

**Tiêu chí nghiệm thu:**

- [ ] Có hướng dẫn chạy local.
- [ ] Có hướng dẫn deploy production.
- [ ] Có hướng dẫn tạo user, cấu hình danh mục, nhập dữ liệu và xuất báo cáo.

**Xác minh:**

- [ ] Người mới có thể làm theo tài liệu để chạy app.
- [ ] Tài liệu khớp với lệnh thực tế trong source code.

**Phụ thuộc:** Pha 7.1, Pha 7.2.

### Checkpoint pha 7

- [ ] Build production thành công.
- [ ] Test suite pass.
- [ ] Tài liệu bàn giao đầy đủ.
- [ ] Sẵn sàng triển khai/bàn giao.

## Rủi ro và phương án giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---:|---|
| Thiếu file Excel mẫu cho các module | Cao | Tạo mẫu import/export từ schema hiện có; cập nhật khi người dùng cung cấp mẫu chính thức |
| Module cứu hỏa/công trình thiếu trường nghiệp vụ | Trung bình | Thiết kế schema mở, bổ sung migration sau khi có mẫu cuối |
| Báo cáo/PDF thay đổi mẫu nhiều lần | Trung bình | Tách report service và template ReportLab riêng |
| Dữ liệu danh mục thay đổi thường xuyên | Thấp | Quản trị danh mục bằng UI, tránh hard-code |

## Thứ tự ưu tiên MVP

1. Nền tảng dự án, database, auth admin.
2. Cấu hình đơn vị, địa phương, danh mục.
3. Module nhà kho hoàn chỉnh.
4. Module camera.
5. Module cứu hỏa.
6. Module công trình.
7. Dashboard và báo cáo/export.
8. Kiểm thử, bảo mật, tài liệu bàn giao.

## Việc cần người dùng chốt trước khi bắt đầu code

- Đã chốt: Ant Design, session cookie, Windows service, PyInstaller.
- File Excel mẫu cho nhà kho, camera, cứu hỏa, công trình.
- Quy tắc nâng cấp nhiều user/phân quyền nếu phát sinh sau này.
- Mẫu báo cáo Excel/PDF đầu ra; PDF dùng ReportLab.
- File đính kèm nằm trong bản đầu tiên.
- Import Excel nằm trong bản đầu tiên, cần mẫu import và validate dữ liệu.

## Pha 8: Đóng gói installer và triển khai Windows

### Task 8.1: Chuẩn bị backend chạy dạng executable/service

**Mô tả:** Đóng gói backend Python bằng PyInstaller thành executable và cấu hình chạy dưới dạng Windows service.

**Tiêu chí nghiệm thu:**

- [ ] Backend chạy được không cần môi trường dev Python trên máy đích.
- [ ] Backend chạy dưới dạng Windows service.
- [ ] Log được ghi ra thư mục cấu hình/vận hành.

**Xác minh:**

- [ ] Cài và chạy trên máy Windows sạch.
- [ ] Restart máy và kiểm tra ứng dụng/backend hoạt động theo phương án đã chốt.

**Phụ thuộc:** Pha 7.

### Task 8.2: Tạo setup wizard khởi tạo SQLite

**Mô tả:** Xây dựng giao diện khởi tạo cuối để người dùng chọn vị trí lưu database, xác nhận tạo database, chạy migration và seed dữ liệu nền.

**Tiêu chí nghiệm thu:**

- [ ] Wizard phát hiện hệ thống chưa setup.
- [ ] Người dùng chọn được vị trí lưu database file SQLite.
- [ ] Database chỉ được tạo sau khi người dùng xác nhận.
- [ ] Chạy migration và seed dữ liệu nền thành công sau khi tạo database.
- [ ] Wizard tự tạo `admin/admin` sau khi database được xác nhận tạo.

**Xác minh:**

- [ ] Test cài mới trên môi trường chưa có database.
- [ ] Test hủy wizard thì không có database nào được tạo.
- [ ] Test chọn lại database file đã tồn tại theo luồng được cho phép.

**Phụ thuộc:** Task 8.1.

### Task 8.3: Đóng gói bộ cài `.exe`

**Mô tả:** Tạo installer all-in-one bằng Inno Setup, bao gồm frontend, backend, migration/seed scripts và setup wizard; installer không tạo sẵn database.

**Tiêu chí nghiệm thu:**

- [ ] Có một file `WarehouseManagementSetup.exe`.
- [ ] Bộ cài tự cài ứng dụng/backend nhưng không tạo database trước.
- [ ] Sau khi cài, người dùng mở được giao diện setup hoặc dashboard.
- [ ] Uninstall dừng tiến trình/service nếu có và gỡ file ứng dụng an toàn, không xóa dữ liệu nếu chưa xác nhận.

**Xác minh:**

- [ ] Test install trên Windows sạch.
- [ ] Test uninstall.
- [ ] Test cài lại không mất dữ liệu nếu người dùng chọn giữ data.

**Phụ thuộc:** Task 8.2.

### Task 8.4: Đóng gói `.msi` nếu bắt buộc

**Mô tả:** Tạo MSI bằng WiX Toolset khi cần chuẩn triển khai doanh nghiệp.

**Tiêu chí nghiệm thu:**

- [ ] Có file `.msi` tương đương `.exe` về chức năng chính.
- [ ] Hỗ trợ install/upgrade/uninstall theo chuẩn MSI.
- [ ] Tài liệu nêu rõ khác biệt giữa `.exe` và `.msi`.

**Xác minh:**

- [ ] Test install/upgrade/uninstall MSI.
- [ ] Kiểm tra ứng dụng và SQLite sau upgrade.

**Phụ thuộc:** Task 8.3.

### Checkpoint pha 8

- [ ] Có installer all-in-one hoạt động.
- [ ] Cài mới, update, uninstall được kiểm thử.
- [ ] SQLite chỉ được khởi tạo bằng setup wizard sau khi người dùng xác nhận.
- [ ] Có tài liệu vận hành, backup tự động, backup thủ công và restore.

## Điều chỉnh stack theo yêu cầu đóng gói

Sau khi đọc lại `docs/mota.md`, stack triển khai nên ưu tiên:

- Backend: Python FastAPI, đóng gói bằng PyInstaller để chạy như Windows service.
- Frontend: React + TypeScript + Vite, dùng SCSS/CSS/HTML cho giao diện.
- Database: SQLite, tạo database file qua setup wizard ở bước cuối sau khi người dùng xác nhận.
- ORM/migration: SQLAlchemy + Alembic.
- Installer `.exe`: Inno Setup cho MVP.
- Installer `.msi`: WiX Toolset nếu cần chuẩn MSI.

Chi tiết triển khai installer/database xem `docs/deployment-strategy.md`.

## Điều chỉnh database cho bản 1 user

Quyết định cập nhật: bản triển khai 1 user dùng SQLite làm database mặc định.

Tác động tới kế hoạch:

- Pha installer không cần cài PostgreSQL hoặc database server riêng.
- Setup wizard là bước cuối: người dùng chọn vị trí database, xác nhận tạo database, sau đó hệ thống chạy migration/seed và tự tạo `admin/admin`.
- Backup/restore đơn giản hơn vì database là một file tại vị trí người dùng đã chọn.
- Vẫn dùng SQLAlchemy + Alembic để giữ khả năng nâng cấp sang PostgreSQL nếu sau này cần multi-user LAN/server.
- Các chức năng nghiệp vụ trong `docs/mota.md` không bị ảnh hưởng, ngoại trừ giới hạn multi-user đồng thời.
