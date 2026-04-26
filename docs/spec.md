# Đặc tả hệ thống phần mềm quản lý nhà kho

## 1. Thông tin chung

- Tên phần mềm: Warehouse Management
- Loại phần mềm: Web application có cơ sở dữ liệu
- Mục tiêu: Quản lý nhà kho, hệ thống camera, hệ thống cứu hỏa, công trình xây mới/nâng cấp/sửa chữa và các danh mục cấu hình liên quan.
- Đối tượng sử dụng: Bản đầu tiên phục vụ 1 máy/1 người dùng duy nhất với tài khoản cố định `admin`.

## 1.1 Phạm vi phiên bản đầu tiên

- Database mặc định là SQLite.
- Phần mềm đóng gói bằng Inno Setup thành file `.exe`.
- Installer không tạo sẵn database.
- Database chỉ được tạo trong setup wizard sau khi người dùng chọn vị trí lưu và xác nhận.
- Tài khoản ứng dụng duy nhất là `admin`; mật khẩu mặc định là `admin`.
- Người dùng được đổi mật khẩu, không được đổi username `admin`.
- Phạm vi vận hành là 1 máy/1 người dùng duy nhất; không thiết kế cho nhiều máy cùng ghi dữ liệu đồng thời trong LAN ở bản đầu tiên.

## 2. Phạm vi hệ thống

Hệ thống gồm các phân hệ chính:

1. Dashboard
2. Quản lý nhà kho
3. Quản lý hệ thống cứu hỏa
4. Quản lý hệ thống camera an ninh
5. Quản lý công trình xây mới, nâng cấp, sửa chữa
6. Cấu hình hệ thống
7. Tài khoản admin và đổi mật khẩu
8. Báo cáo, thống kê, xuất dữ liệu

## 3. Cấu trúc hệ thống

```text
Warehouse Management
├── Authentication & Authorization
│   ├── Đăng nhập
│   ├── Đăng xuất
│   ├── Tài khoản cố định admin
│   ├── Đổi mật khẩu admin
│   └── Bảo vệ route yêu cầu đăng nhập
│
├── Dashboard
│   ├── Tổng quan số liệu
│   ├── Tìm kiếm nhanh
│   ├── Thống kê theo đơn vị
│   ├── Thống kê nhà kho
│   ├── Thống kê camera
│   ├── Thống kê cứu hỏa
│   └── Thống kê công trình
│
├── Module quản lý nhà kho
│   ├── Danh sách nhà kho
│   ├── Thêm mới nhà kho
│   ├── Cập nhật nhà kho
│   ├── Xóa nhà kho
│   ├── Tìm kiếm / lọc nhà kho
│   ├── Hiển thị danh sách theo cây đơn vị
│   ├── Quản lý diện tích, sức chứa, trữ lượng
│   ├── Quản lý loại hàng
│   ├── Quản lý chất lượng nhà kho
│   └── Quản lý nhu cầu / hiện trạng cứu hỏa của nhà kho
│
├── Module quản lý hệ thống camera
│   ├── Danh sách hệ thống camera
│   ├── Thêm mới hệ thống camera
│   ├── Cập nhật hệ thống camera
│   ├── Xóa hệ thống camera
│   ├── Quản lý số lượng camera
│   ├── Quản lý số màn hình
│   ├── Quản lý năm lắp đặt / năm sửa chữa
│   ├── Quản lý cơ quan đầu tư
│   ├── Quản lý tình trạng
│   └── Quản lý nhu cầu sửa chữa / lắp đặt mới
│
├── Module quản lý hệ thống cứu hỏa
│   ├── Danh sách hệ thống cứu hỏa
│   ├── Thêm mới hệ thống cứu hỏa
│   ├── Cập nhật hệ thống cứu hỏa
│   ├── Xóa hệ thống cứu hỏa
│   ├── Quản lý hiện trạng thiết bị
│   ├── Quản lý nhu cầu sửa chữa
│   └── Quản lý nhu cầu lắp đặt mới
│
├── Module quản lý công trình
│   ├── Công trình xây mới
│   ├── Công trình nâng cấp
│   ├── Công trình sửa chữa
│   ├── Quản lý tiến độ
│   ├── Quản lý kinh phí
│   ├── Quản lý đơn vị phụ trách
│   └── Quản lý hồ sơ đính kèm
│
├── Module cấu hình
│   ├── Phân cấp đơn vị đa cấp
│   ├── Địa phương cấp tỉnh
│   ├── Địa phương cấp xã
│   ├── Phân loại kho
│   ├── Loại hàng
│   ├── Phân cấp chất lượng nhà kho
│   ├── Danh mục hệ thống cứu hỏa
│   ├── Danh mục hệ thống chống sét
│   └── Các danh mục dùng chung
│
└── Báo cáo
    ├── Báo cáo nhà kho
    ├── Báo cáo hệ thống camera
    ├── Báo cáo hệ thống cứu hỏa
    ├── Báo cáo công trình
    ├── Xuất Excel
    └── Xuất PDF
```

## 4. Cấu trúc giao diện

### 4.1 Layout tổng thể

```text
Main Layout
├── Sidebar menu bên trái
├── Header
│   ├── Ô tìm kiếm
│   ├── Thông tin người dùng
│   └── Đăng xuất
├── Content area
│   ├── Bộ lọc
│   ├── Form nhập liệu
│   ├── Bảng danh sách
│   ├── Phân trang
│   └── Modal xác nhận
└── Notification area
```

### 4.2 Danh sách màn hình

```text
/login
/dashboard

/warehouses
/warehouses/create
/warehouses/:id/edit
/warehouses/:id

/camera-systems
/camera-systems/create
/camera-systems/:id/edit
/camera-systems/:id

/fire-protection-systems
/fire-protection-systems/create
/fire-protection-systems/:id/edit
/fire-protection-systems/:id

/construction-projects
/construction-projects/create
/construction-projects/:id/edit
/construction-projects/:id

/settings/units
/settings/locations/provinces
/settings/locations/communes
/settings/warehouse-types
/settings/goods-types
/settings/warehouse-quality-levels
/settings/fire-protection-types
/settings/lightning-protection-types
/settings/change-password

/reports/warehouses
/reports/camera-systems
/reports/fire-protection-systems
/reports/construction-projects
```

## 5. Cấu trúc dữ liệu

## 5.1 Bảng tài khoản admin

Bản SQLite 1 user chỉ có một tài khoản ứng dụng duy nhất là `admin`. Username này cố định, không cho phép đổi. Mật khẩu mặc định sau setup là `admin`; người dùng được đổi mật khẩu sau khi đăng nhập.

### users

```text
id: uuid, primary key
username: varchar, unique, not null, fixed value: admin
password_hash: varchar, not null
full_name: varchar, default admin
is_active: boolean, default true
last_login_at: timestamp, nullable
created_at: timestamp
updated_at: timestamp
```

Ràng buộc:

- Chỉ có đúng một bản ghi user trong bản đầu tiên.
- Không có màn hình tạo/xóa user.
- Không có roles, permissions, role_permissions trong bản đầu tiên.
- Mọi chức năng sau đăng nhập đều thuộc quyền admin.

## 5.2 Nhóm bảng cấu hình đơn vị, địa phương

### units

Dùng để quản lý phân cấp đơn vị đa cấp.

```text
id: uuid, primary key
parent_id: uuid, nullable, foreign key -> units.id
name: varchar, not null
code: varchar, unique, nullable
level: integer, not null
path: varchar, nullable
sort_order: integer, default 0
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### provinces

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
created_at: timestamp
updated_at: timestamp
```

### communes

```text
id: uuid, primary key
province_id: uuid, foreign key -> provinces.id
name: varchar, not null
code: varchar, unique, nullable
created_at: timestamp
updated_at: timestamp
```

## 5.3 Nhóm bảng danh mục

### warehouse_types

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### goods_types

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### warehouse_quality_levels

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### fire_protection_types

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### lightning_protection_types

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, nullable
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

## 5.4 Bảng quản lý nhà kho

### warehouses

```text
id: uuid, primary key
name: varchar, not null
parent_unit_id: uuid, foreign key -> units.id
child_unit_id: uuid, nullable, foreign key -> units.id
province_id: uuid, foreign key -> provinces.id
commune_id: uuid, foreign key -> communes.id
quantity: numeric, nullable
land_area: numeric, nullable
warehouse_area: numeric, nullable
construction_year: integer, nullable
renovation_year: integer, nullable
warehouse_type_id: uuid, foreign key -> warehouse_types.id
storage_capacity: numeric, nullable
current_storage: numeric, nullable
goods_type_id: uuid, foreign key -> goods_types.id
quality_level_id: uuid, foreign key -> warehouse_quality_levels.id
fire_protection_required: varchar, nullable
fire_protection_available: varchar, nullable
note: text, nullable
created_by: uuid, foreign key -> users.id
updated_by: uuid, nullable, foreign key -> users.id
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp, nullable
```

## 5.5 Bảng quản lý hệ thống camera

### camera_systems

```text
id: uuid, primary key
parent_unit_id: uuid, foreign key -> units.id
child_unit_id: uuid, nullable, foreign key -> units.id
unit_of_measure: varchar, nullable
quantity: numeric, nullable
installation_year: integer, nullable
repair_year: integer, nullable
monitor_count: numeric, nullable
camera_count: numeric, nullable
investment_agency: varchar, nullable
status: text, nullable
repair_need_quantity: numeric, nullable
new_installation_need_quantity: numeric, nullable
note: text, nullable
created_by: uuid, foreign key -> users.id
updated_by: uuid, nullable, foreign key -> users.id
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp, nullable
```

## 5.6 Bảng quản lý hệ thống cứu hỏa

### fire_protection_systems

Do tài liệu mô tả hiện chưa có đầy đủ trường chi tiết cho module cứu hỏa, cấu trúc dưới đây là cấu trúc đề xuất ban đầu.

```text
id: uuid, primary key
parent_unit_id: uuid, foreign key -> units.id
child_unit_id: uuid, nullable, foreign key -> units.id
warehouse_id: uuid, nullable, foreign key -> warehouses.id
fire_protection_type_id: uuid, nullable, foreign key -> fire_protection_types.id
quantity: numeric, nullable
installation_year: integer, nullable
repair_year: integer, nullable
status: text, nullable
repair_need_quantity: numeric, nullable
new_installation_need_quantity: numeric, nullable
note: text, nullable
created_by: uuid, foreign key -> users.id
updated_by: uuid, nullable, foreign key -> users.id
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp, nullable
```

## 5.7 Bảng quản lý công trình

### construction_projects

Do tài liệu mô tả hiện chưa có đầy đủ trường chi tiết cho module công trình, cấu trúc dưới đây là cấu trúc đề xuất ban đầu.

```text
id: uuid, primary key
name: varchar, not null
project_type: varchar, not null
parent_unit_id: uuid, foreign key -> units.id
child_unit_id: uuid, nullable, foreign key -> units.id
province_id: uuid, nullable, foreign key -> provinces.id
commune_id: uuid, nullable, foreign key -> communes.id
location: text, nullable
start_year: integer, nullable
end_year: integer, nullable
status: varchar, nullable
progress_percent: numeric, nullable
estimated_budget: numeric, nullable
approved_budget: numeric, nullable
contractor: varchar, nullable
description: text, nullable
created_by: uuid, foreign key -> users.id
updated_by: uuid, nullable, foreign key -> users.id
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp, nullable
```

Giá trị đề xuất cho `project_type`:

```text
NEW_BUILD
UPGRADE
REPAIR
RENOVATION
```

## 5.8 Bảng file đính kèm

### attachments

```text
id: uuid, primary key
module: varchar, not null
record_id: uuid, not null
file_name: varchar, not null
file_path: text, not null
file_type: varchar, nullable
file_size: numeric, nullable
uploaded_by: uuid, foreign key -> users.id
created_at: timestamp
```

## 5.9 Bảng nhật ký hệ thống

### audit_logs

```text
id: uuid, primary key
user_id: uuid, nullable, foreign key -> users.id
action: varchar, not null
module: varchar, not null
record_id: uuid, nullable
old_data: jsonb, nullable
new_data: jsonb, nullable
ip_address: varchar, nullable
user_agent: text, nullable
created_at: timestamp
```

## 6. Quan hệ dữ liệu chính

```text
units 1 -- n units
provinces 1 -- n communes
units 1 -- n warehouses
units 1 -- n camera_systems
units 1 -- n fire_protection_systems
units 1 -- n construction_projects
warehouse_types 1 -- n warehouses
goods_types 1 -- n warehouses
warehouse_quality_levels 1 -- n warehouses
warehouses 1 -- n fire_protection_systems
users 1 -- n audit_logs
```

## 7. API dự kiến

### Authentication

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Admin account

```text
GET  /api/admin/profile
PUT  /api/admin/password
```

### Units

```text
GET    /api/units
POST   /api/units
GET    /api/units/:id
PUT    /api/units/:id
DELETE /api/units/:id
```

### Locations

```text
GET    /api/provinces
POST   /api/provinces
PUT    /api/provinces/:id
DELETE /api/provinces/:id

GET    /api/communes
GET    /api/communes?province_id=:province_id
POST   /api/communes
PUT    /api/communes/:id
DELETE /api/communes/:id
```

### Warehouses

```text
GET    /api/warehouses
POST   /api/warehouses
GET    /api/warehouses/:id
PUT    /api/warehouses/:id
DELETE /api/warehouses/:id
GET    /api/warehouses/export
GET    /api/warehouses/import-template
POST   /api/warehouses/import
```

### Camera systems

```text
GET    /api/camera-systems
POST   /api/camera-systems
GET    /api/camera-systems/:id
PUT    /api/camera-systems/:id
DELETE /api/camera-systems/:id
GET    /api/camera-systems/export
GET    /api/camera-systems/import-template
POST   /api/camera-systems/import
```

### Fire protection systems

```text
GET    /api/fire-protection-systems
POST   /api/fire-protection-systems
GET    /api/fire-protection-systems/:id
PUT    /api/fire-protection-systems/:id
DELETE /api/fire-protection-systems/:id
GET    /api/fire-protection-systems/export
GET    /api/fire-protection-systems/import-template
POST   /api/fire-protection-systems/import
```

### Construction projects

```text
GET    /api/construction-projects
POST   /api/construction-projects
GET    /api/construction-projects/:id
PUT    /api/construction-projects/:id
DELETE /api/construction-projects/:id
GET    /api/construction-projects/export
GET    /api/construction-projects/import-template
POST   /api/construction-projects/import
```

### Reports

```text
GET /api/reports/dashboard
GET /api/reports/warehouses
GET /api/reports/camera-systems
GET /api/reports/fire-protection-systems
GET /api/reports/construction-projects
```

### Excel import/export

Bản đầu tiên hỗ trợ xuất Excel và import nhanh từ Excel cho các module nghiệp vụ chính.

Yêu cầu import Excel:

- Có API tải file mẫu import cho từng module.
- File mẫu phải bám theo cấu trúc trường dữ liệu bắt buộc/không bắt buộc của module.
- Hệ thống phải kiểm tra header/cột bắt buộc.
- Hệ thống phải kiểm tra kiểu dữ liệu: text, number, integer year, enum/danh mục, tỉnh/xã, đơn vị.
- Hệ thống phải kiểm tra định dạng dữ liệu và quan hệ phụ thuộc, ví dụ xã phải thuộc tỉnh đã chọn.
- Nếu dữ liệu sai, không import âm thầm; phải trả danh sách lỗi theo dòng/cột để người dùng sửa.
- Chỉ ghi dữ liệu hợp lệ sau khi validate thành công theo chính sách import đã chốt.

## 8. Tài khoản và quyền truy cập

Bản đầu tiên không có phân quyền nhiều vai trò. Hệ thống chỉ có một tài khoản ứng dụng duy nhất:

```text
username: admin
default password: admin
role: admin toàn quyền
```

Quy tắc:

- Setup wizard tự tạo tài khoản `admin` với mật khẩu mặc định `admin` sau khi database được người dùng xác nhận tạo.
- Người dùng được đổi mật khẩu sau khi đăng nhập; nên đổi ngay sau lần đăng nhập đầu tiên.
- Không cho phép đổi username `admin`.
- Không cho phép tạo thêm user, role hoặc permission trong bản đầu tiên.
- Tất cả API nghiệp vụ chỉ yêu cầu đã đăng nhập bằng tài khoản `admin`.
- Nếu sau này cần nhiều người dùng/phân quyền, sẽ bổ sung schema roles/permissions và migration riêng.

## 9. Kế hoạch triển khai phần mềm

Đây là kế hoạch tổng quan ở mức đặc tả. Kế hoạch task chi tiết và thứ tự triển khai chính thức nằm tại `docs/implementation-plan.md`. Khi có khác biệt, ưu tiên `docs/implementation-plan.md` cho execution và giữ `docs/spec.md` làm nguồn sự thật về yêu cầu/ràng buộc.

### Giai đoạn 1: Chuẩn hóa yêu cầu

- Rà soát `mota.md`
- Thu thập file Excel mẫu cho từng module
- Chuẩn hóa danh sách trường dữ liệu
- Xác định cơ chế tài khoản admin duy nhất
- Xác định luồng đổi mật khẩu admin
- Xác định mẫu báo cáo cần xuất

Kết quả:

- Tài liệu đặc tả hệ thống
- Danh sách trường dữ liệu cuối cùng
- Quy định tài khoản admin duy nhất
- Danh sách báo cáo

### Giai đoạn 2: Thiết kế kỹ thuật

- Thiết kế kiến trúc frontend/backend/database
- Thiết kế ERD cơ sở dữ liệu
- Thiết kế API
- Thiết kế wireframe giao diện
- Thiết kế luồng đăng nhập và đổi mật khẩu admin

Kết quả:

- Sơ đồ kiến trúc hệ thống
- Sơ đồ cơ sở dữ liệu
- Tài liệu API
- Prototype giao diện

### Giai đoạn 3: Xây dựng nền tảng

- Khởi tạo frontend
- Khởi tạo backend
- Cấu hình migration/seed scripts; database thật chỉ tạo trong setup wizard
- Xây dựng đăng nhập / đăng xuất
- Xây dựng tài khoản admin cố định
- Xây dựng chức năng đổi mật khẩu admin
- Xây dựng layout chính

Kết quả:

- Người dùng có thể đăng nhập
- Có sidebar menu
- Có bảo vệ đăng nhập cơ bản
- Có chức năng đổi mật khẩu admin

### Giai đoạn 4: Xây dựng module cấu hình

- Quản lý đơn vị đa cấp
- Quản lý tỉnh / xã
- Quản lý phân loại kho
- Quản lý loại hàng
- Quản lý chất lượng nhà kho
- Quản lý danh mục cứu hỏa
- Quản lý danh mục chống sét

Kết quả:

- Các danh mục nền sẵn sàng cho form nghiệp vụ
- Combobox động theo dữ liệu cấu hình

### Giai đoạn 5: Xây dựng module nhà kho

- Form thêm mới nhà kho
- Form cập nhật nhà kho
- Danh sách nhà kho
- Xóa mềm nhà kho
- Tìm kiếm, lọc, phân trang
- Hiển thị theo cấu trúc đơn vị
- Xuất Excel
- Tải file mẫu import Excel
- Import Excel có validate và báo lỗi theo dòng/cột

Kết quả:

- Hoàn chỉnh module quản lý nhà kho

### Giai đoạn 6: Xây dựng module camera

- Form thêm mới hệ thống camera
- Form cập nhật hệ thống camera
- Danh sách hệ thống camera
- Xóa mềm hệ thống camera
- Tìm kiếm, lọc, phân trang
- Quản lý nhu cầu sửa chữa / lắp mới
- Xuất Excel
- Tải file mẫu import Excel
- Import Excel có validate và báo lỗi theo dòng/cột

Kết quả:

- Hoàn chỉnh module quản lý hệ thống camera

### Giai đoạn 7: Xây dựng module cứu hỏa

- Form thêm mới hệ thống cứu hỏa
- Form cập nhật hệ thống cứu hỏa
- Danh sách hệ thống cứu hỏa
- Xóa mềm hệ thống cứu hỏa
- Tìm kiếm, lọc, phân trang
- Liên kết với nhà kho nếu cần
- Xuất Excel
- Tải file mẫu import Excel
- Import Excel có validate và báo lỗi theo dòng/cột

Kết quả:

- Hoàn chỉnh module quản lý hệ thống cứu hỏa

### Giai đoạn 8: Xây dựng module công trình

- Quản lý công trình xây mới
- Quản lý công trình nâng cấp
- Quản lý công trình sửa chữa
- Quản lý tiến độ
- Quản lý kinh phí
- Quản lý hồ sơ đính kèm
- Xuất báo cáo
- Tải file mẫu import Excel
- Import Excel có validate và báo lỗi theo dòng/cột

Kết quả:

- Hoàn chỉnh module quản lý công trình

### Giai đoạn 9: Dashboard và báo cáo

- Dashboard tổng quan
- Thống kê số lượng nhà kho
- Thống kê diện tích / sức chứa / trữ lượng
- Thống kê camera theo đơn vị
- Thống kê cứu hỏa theo đơn vị
- Thống kê nhu cầu sửa chữa / lắp đặt mới
- Thống kê công trình
- Xuất Excel / PDF

Kết quả:

- Dashboard quản trị
- Bộ báo cáo vận hành

### Giai đoạn 10: Kiểm thử, triển khai, bàn giao

- Kiểm thử chức năng
- Kiểm thử đăng nhập admin và đổi mật khẩu
- Kiểm thử dữ liệu nhập / sửa / xóa
- Kiểm thử xuất báo cáo
- Kiểm thử hiệu năng cơ bản
- Sửa lỗi
- Đóng gói installer bằng Inno Setup
- Kiểm thử setup wizard tạo database ở bước cuối
- Triển khai production
- Bàn giao tài liệu hướng dẫn sử dụng

Kết quả:

- Phần mềm sẵn sàng sử dụng
- Có installer `.exe`
- Có setup wizard để người dùng chọn vị trí database, xác nhận tạo database và hệ thống tự tạo tài khoản `admin/admin`
- Có tài liệu hướng dẫn

## 10. Thứ tự ưu tiên triển khai

```text
1. Đăng nhập admin và đổi mật khẩu
2. Cấu hình đơn vị, địa phương, danh mục
3. Quản lý nhà kho
4. Quản lý hệ thống camera
5. Quản lý hệ thống cứu hỏa
6. Quản lý công trình
7. Dashboard
8. Báo cáo, xuất Excel/PDF, import Excel
9. Setup wizard tạo database ở bước cuối
10. Đóng gói Inno Setup, kiểm thử, tối ưu, triển khai
```

## 11. Nội dung cần bổ sung

Các nội dung sau cần được bổ sung trước khi triển khai chi tiết:

- File Excel mẫu cho module nhà kho
- File Excel mẫu cho module camera
- File Excel mẫu cho module cứu hỏa
- File Excel mẫu cho module công trình
- Danh sách trường chi tiết của module cứu hỏa
- Danh sách trường chi tiết của module công trình
- Mẫu báo cáo đầu ra
- Quy định nếu sau này cần nâng cấp nhiều user/phân quyền
- Quy định dữ liệu bắt buộc / không bắt buộc cho từng form

## 12. Rà soát spec trước triển khai

Chi tiết rà soát được tách tại `docs/spec-review.md`. Các điểm cần chốt trước khi triển khai mã nguồn chi tiết:

- Stack đã chốt thêm: Ant Design, session cookie, Windows service, PyInstaller.
- Bộ lệnh phát triển chuẩn: install, dev, build, lint, test, migrate/seed cho môi trường dev-test; installer không tạo database trước setup wizard.
- File Excel mẫu cho module nhà kho, camera, cứu hỏa và công trình.
- Danh sách trường bắt buộc/không bắt buộc, kiểu dữ liệu, giới hạn và validation cho từng form.
- Quy tắc nâng cấp nhiều user/phân quyền nếu phát sinh sau này.
- Mẫu báo cáo Excel/PDF đầu ra; PDF dùng ReportLab trong bản đầu tiên.
- Mẫu import Excel cho từng module và quy tắc validate dữ liệu.
- Upload hồ sơ đính kèm nằm trong bản đầu tiên.

## 13. Kế hoạch triển khai mã nguồn

Kế hoạch triển khai chi tiết được tách tại `docs/implementation-plan.md` để dễ theo dõi và cập nhật trong quá trình phát triển.

## 13.1 Backup và xuất PDF

### Backup

Bản đầu tiên có chức năng backup tự động theo lịch.

Yêu cầu backup:

- Cho phép backup thủ công từ giao diện admin.
- Cho phép cấu hình backup tự động theo lịch cơ bản, ví dụ hằng ngày hoặc hằng tuần.
- Cho phép chọn thư mục lưu backup.
- File backup phải bao gồm database SQLite và thư mục file đính kèm.
- Restore từ backup phải có xác nhận trước khi ghi đè dữ liệu hiện tại.
- Export Excel không được xem là backup database.

### Xuất PDF

Bản đầu tiên dùng ReportLab để xuất PDF nhằm tối ưu độ ổn định khi đóng gói Windows/PyInstaller và tránh phụ thuộc native/browser phức tạp.

Yêu cầu PDF:

- PDF dùng cho báo cáo đầu ra chính.
- Cần đóng gói font hỗ trợ tiếng Việt.
- Template PDF nên tách riêng để dễ bảo trì.
- Nếu sau này cần HTML-to-PDF phức tạp, sẽ đánh giá công cụ khác sau.

## 14. Yêu cầu đóng gói và triển khai

Theo yêu cầu hệ thống trong `docs/mota.md`, phần mềm cần có khả năng đóng gói thành bộ cài đặt Windows. Phương án đã chốt cho bản đầu tiên là dùng SQLite và Inno Setup.

Nguyên tắc bắt buộc: installer không được tạo sẵn database trong quá trình build, không được đóng gói kèm một database đã tạo trước và không được tự tạo database nếu người dùng chưa xác nhận ở bước cấu hình cuối. Database chỉ được tạo tại máy người dùng trong bước khởi tạo cuối cùng trước khi phần mềm đi vào hoạt động.

### 14.1 Database SQLite trong bộ cài

SQLite là database mặc định cho bản 1 user/1 máy thao tác chính. Database được lưu dưới dạng file dữ liệu ứng dụng, không cần cài database server riêng.

Bộ cài chỉ được đóng gói:

- Frontend/backend và các runtime cần thiết.
- Migration scripts.
- Seed templates hoặc seed scripts cho tài khoản `admin/admin` và danh mục mặc định.
- Setup wizard dùng để người dùng tự khởi tạo database.

Bộ cài không được đóng gói:

- File database SQLite đã tạo sẵn.
- Tài khoản admin đã tạo sẵn.
- Dữ liệu nghiệp vụ mẫu trong database thật nếu người dùng chưa xác nhận.

### 14.2 Bước khởi tạo cuối khi cài đặt

Sau khi cài file chương trình, hệ thống phải mở setup wizard để người dùng thực hiện bước cuối cùng trước khi phần mềm hoạt động.

Setup wizard cần cho phép người dùng:

- Chọn vị trí lưu database file SQLite.
- Nhập tên database file hoặc dùng tên mặc định như `warehouse.db`.
- Xem thông tin tài khoản mặc định `admin/admin`.
- Xác nhận tạo database.
- Chạy migration tạo schema sau khi người dùng xác nhận.
- Seed tài khoản `admin/admin` và danh mục mặc định sau khi database được tạo.
- Hoàn tất cấu hình và chuyển vào màn hình đăng nhập/dashboard.

Lưu ý: SQLite không có database user/password riêng như PostgreSQL. Trong bản đầu tiên, user/password là tài khoản ứng dụng duy nhất `admin/admin`. Setup wizard tự tạo tài khoản này sau khi người dùng xác nhận tạo database. Người dùng được đổi mật khẩu sau khi đăng nhập nhưng không được đổi username `admin`. Nếu sau này yêu cầu mã hóa database file, sẽ bổ sung cơ chế mật khẩu mã hóa riêng và cần chốt kỹ thuật trước.

### 14.3 Installer Windows

Chi tiết phương án đóng gói được mô tả tại `docs/deployment-strategy.md`. Ưu tiên triển khai file `.exe` bằng Inno Setup. Chỉ triển khai `.msi` bằng WiX Toolset nếu sau này có yêu cầu bắt buộc về chuẩn MSI.

Installer chỉ cài chương trình và mở setup wizard. Việc tạo database là bước cuối do người dùng thực hiện trong setup wizard.

## 15. Quyết định database cho bản 1 user

Phạm vi hiện tại đã chốt: hệ thống dùng SQLite làm database mặc định.

SQLite đáp ứng chắc chắn các yêu cầu nghiệp vụ hiện có: dashboard, quản lý nhà kho, camera, cứu hỏa, công trình, cấu hình danh mục, đăng nhập admin, đổi mật khẩu, tìm kiếm/lọc/phân trang, xuất Excel/PDF bằng ReportLab cho PDF, audit log, backup tự động theo lịch và đóng gói installer all-in-one.

Giới hạn chính của SQLite là multi-user đồng thời. Không khuyến nghị dùng một file SQLite đặt trên thư mục mạng để nhiều máy cùng ghi dữ liệu. Nếu sau này cần nhiều người dùng/máy cùng nhập sửa dữ liệu trong LAN hoặc triển khai server tập trung, hệ thống sẽ nâng cấp database sang PostgreSQL.

Yêu cầu kỹ thuật khi dùng SQLite:

- Database file chỉ được tạo trong setup wizard sau khi người dùng chọn vị trí lưu và xác nhận.
- Database file đặt trong thư mục dữ liệu ứng dụng hoặc vị trí người dùng chọn, không đặt mặc định trong thư mục cài đặt chương trình.
- Không tạo sẵn database trong source code, build artifact hoặc installer.
- Bật foreign key cho mọi kết nối SQLite.
- Dùng transaction cho thao tác tạo/sửa/xóa nghiệp vụ.
- Dùng Alembic migration để quản lý thay đổi schema.
- Thiết kế tầng repository/service qua SQLAlchemy để có đường nâng cấp sang PostgreSQL khi cần.
