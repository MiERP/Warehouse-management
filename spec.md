# Đặc tả hệ thống phần mềm quản lý nhà kho

## 1. Thông tin chung

- Tên phần mềm: Warehouse Management
- Loại phần mềm: Web application có cơ sở dữ liệu
- Mục tiêu: Quản lý nhà kho, hệ thống camera, hệ thống cứu hỏa, công trình xây mới/nâng cấp/sửa chữa và các danh mục cấu hình liên quan.
- Đối tượng sử dụng: Nhiều người dùng, có phân quyền theo chức năng hoặc theo phân cấp đơn vị.

## 2. Phạm vi hệ thống

Hệ thống gồm các phân hệ chính:

1. Dashboard
2. Quản lý nhà kho
3. Quản lý hệ thống cứu hỏa
4. Quản lý hệ thống camera an ninh
5. Quản lý công trình xây mới, nâng cấp, sửa chữa
6. Cấu hình hệ thống
7. Quản lý người dùng và phân quyền
8. Báo cáo, thống kê, xuất dữ liệu

## 3. Cấu trúc hệ thống

```text
Warehouse Management
├── Authentication & Authorization
│   ├── Đăng nhập
│   ├── Đăng xuất
│   ├── Quản lý người dùng
│   ├── Quản lý vai trò
│   └── Phân quyền theo module / hành động / đơn vị
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
/settings/users
/settings/roles
/settings/permissions

/reports/warehouses
/reports/camera-systems
/reports/fire-protection-systems
/reports/construction-projects
```

## 5. Cấu trúc dữ liệu

## 5.1 Nhóm bảng người dùng và phân quyền

### users

```text
id: uuid, primary key
username: varchar, unique, not null
password_hash: varchar, not null
full_name: varchar, not null
email: varchar, nullable
phone: varchar, nullable
unit_id: uuid, foreign key -> units.id
role_id: uuid, foreign key -> roles.id
is_active: boolean, default true
last_login_at: timestamp, nullable
created_at: timestamp
updated_at: timestamp
```

### roles

```text
id: uuid, primary key
name: varchar, not null
code: varchar, unique, not null
description: text, nullable
is_active: boolean, default true
created_at: timestamp
updated_at: timestamp
```

### permissions

```text
id: uuid, primary key
module: varchar, not null
action: varchar, not null
code: varchar, unique, not null
description: text, nullable
```

### role_permissions

```text
id: uuid, primary key
role_id: uuid, foreign key -> roles.id
permission_id: uuid, foreign key -> permissions.id
```

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
units 1 -- n users
roles 1 -- n users
roles n -- n permissions
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

### Users / roles / permissions

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PUT    /api/roles/:id
DELETE /api/roles/:id

GET    /api/permissions
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
```

### Camera systems

```text
GET    /api/camera-systems
POST   /api/camera-systems
GET    /api/camera-systems/:id
PUT    /api/camera-systems/:id
DELETE /api/camera-systems/:id
GET    /api/camera-systems/export
```

### Fire protection systems

```text
GET    /api/fire-protection-systems
POST   /api/fire-protection-systems
GET    /api/fire-protection-systems/:id
PUT    /api/fire-protection-systems/:id
DELETE /api/fire-protection-systems/:id
GET    /api/fire-protection-systems/export
```

### Construction projects

```text
GET    /api/construction-projects
POST   /api/construction-projects
GET    /api/construction-projects/:id
PUT    /api/construction-projects/:id
DELETE /api/construction-projects/:id
GET    /api/construction-projects/export
```

### Reports

```text
GET /api/reports/dashboard
GET /api/reports/warehouses
GET /api/reports/camera-systems
GET /api/reports/fire-protection-systems
GET /api/reports/construction-projects
```

## 8. Phân quyền đề xuất

### Nhóm vai trò

```text
ADMIN: toàn quyền hệ thống
MANAGER: quản lý dữ liệu trong phạm vi đơn vị phụ trách
UNIT_USER: nhập, sửa dữ liệu trong đơn vị được phân quyền
VIEWER: chỉ xem và xuất báo cáo
```

### Nhóm quyền

```text
user:view
user:create
user:update
user:delete

unit:view
unit:create
unit:update
unit:delete

warehouse:view
warehouse:create
warehouse:update
warehouse:delete
warehouse:export

camera:view
camera:create
camera:update
camera:delete
camera:export

fire_protection:view
fire_protection:create
fire_protection:update
fire_protection:delete
fire_protection:export

construction:view
construction:create
construction:update
construction:delete
construction:export

report:view
report:export
```

## 9. Kế hoạch triển khai phần mềm

### Giai đoạn 1: Chuẩn hóa yêu cầu

- Rà soát `mota.md`
- Thu thập file Excel mẫu cho từng module
- Chuẩn hóa danh sách trường dữ liệu
- Xác định vai trò người dùng
- Xác định quyền theo từng vai trò
- Xác định mẫu báo cáo cần xuất

Kết quả:

- Tài liệu đặc tả hệ thống
- Danh sách trường dữ liệu cuối cùng
- Danh sách vai trò và quyền
- Danh sách báo cáo

### Giai đoạn 2: Thiết kế kỹ thuật

- Thiết kế kiến trúc frontend/backend/database
- Thiết kế ERD cơ sở dữ liệu
- Thiết kế API
- Thiết kế wireframe giao diện
- Thiết kế luồng đăng nhập, phân quyền

Kết quả:

- Sơ đồ kiến trúc hệ thống
- Sơ đồ cơ sở dữ liệu
- Tài liệu API
- Prototype giao diện

### Giai đoạn 3: Xây dựng nền tảng

- Khởi tạo frontend
- Khởi tạo backend
- Cấu hình database
- Xây dựng đăng nhập / đăng xuất
- Xây dựng quản lý người dùng
- Xây dựng quản lý vai trò / quyền
- Xây dựng layout chính

Kết quả:

- Người dùng có thể đăng nhập
- Có sidebar menu
- Có phân quyền cơ bản
- Có module quản trị người dùng

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
- Kiểm thử phân quyền
- Kiểm thử dữ liệu nhập / sửa / xóa
- Kiểm thử xuất báo cáo
- Kiểm thử hiệu năng cơ bản
- Sửa lỗi
- Triển khai production
- Bàn giao tài liệu hướng dẫn sử dụng

Kết quả:

- Phần mềm sẵn sàng sử dụng
- Có tài liệu hướng dẫn
- Có tài khoản quản trị ban đầu

## 10. Thứ tự ưu tiên triển khai

```text
1. Đăng nhập, người dùng, vai trò, phân quyền
2. Cấu hình đơn vị, địa phương, danh mục
3. Quản lý nhà kho
4. Quản lý hệ thống camera
5. Quản lý hệ thống cứu hỏa
6. Quản lý công trình
7. Dashboard
8. Báo cáo, xuất Excel/PDF
9. Kiểm thử, tối ưu, triển khai
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
- Quy định phân quyền cụ thể theo từng cấp đơn vị
- Quy định dữ liệu bắt buộc / không bắt buộc cho từng form
