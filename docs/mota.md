# Mô tả phần mềm quản lý nhà kho.
- Tên phần mềm: Phần mềm quản lý nhà kho Warehouse Management
- Dạng phần mềm: Web app có cơ sở dữ liệu.

## Mô tả chung về phần mềm
- Bản đầu tiên của hệ thống được xây dựng cho 1 người dùng duy nhất trên 1 máy, dùng tài khoản cố định `admin`; không có phân quyền nhiều người dùng trong bản đầu tiên.
- Phần mềm quản lý nhà kho, quản lý hệ thống camera, quản lý hệ thống cứu hỏa. Ngoài ra phần mềm còn quản lý các công trình xây dựng mới, nâng cấp, sửa chữa.
- Phần mềm được bố cục gồm các tab chính: Tab dashboard; tab quản lý nhà kho; tab quản lý hệ thống cứu hỏa, tab quản lý hệ thống camera; tab quản lý các công trình xây mới, nâng cấp; tab cấu hình.

## Mô tả chi tiết.

### tab dashboard
- Tab này có chức năng quản lý chung, tab này gồm những thành phần sau: Menu chính (cột bên trái); textbox tìm kiếm; (Có hình ảnh kèm theo)
- Tab quản lý nhà kho: gồm những trường thông tin dựa trên những cột được định nghĩa trong file excel (có hình ảnh kèm theo)
- Tab quản lý hệ thống cứu hỏa: gồm những trường thông tin dựa trên những cột được định nghĩa trong file excel (có hình ảnh kèm theo)
- Tab quản lý hệ thống camera: gồm những trường thông tin dựa trên những cột được định nghĩa trong file excel (có hình ảnh kèm theo)
- tab quàn lý công trình xây mới: gồm những trường thông tin dựa trên những cột được định nghĩa trong file excel (có hình ảnh kèm theo)
- Tab cấu hình: dùng để cấu hình: phân cấp đơn vị (đa cấp độ); địa phương (tỉnh, xã); phân loại kho; loại hàng; phân cấp chất lượng nhà kho;
hệ thống chống sét; 

### tab quản lý nhà kho (module quản lý nhà kho)

#### Các trường dữ liệu trong from cần có
id nhà kho (trường ẩn, tự sinh)
Tên kho-text-nhập liệu
đơn vị cha-combobox
đơn vị con-combobox
địa điểm cấp xã-text-combobox (danh sách xã được lấy theo tên tỉnh)
địa điểm cấp tỉnh-text-combobox
Số lượng-number-nhập liệu
Diện tích chiếm đất-number-nhập liệu
diện tích nhà kho-number-nhập liệu
năm xây dựng-number-nhập liệu
năm sửa chữa/cải tạo/nâng cấp-number-nhập liệu
loại nhà kho-combobox
khả năng cất chứa-number-nhập liệu
trữ lượng cất chứa hiện nay-number-nhập liệu
loại hàng-combobox
phân cấp chất lượng nhà kho-combobox
hệ thống cứu hỏa 
+ nhu cầu hệ thống cứu hỏa-combobox
+ Hiện có hệ thống cứu hỏa-combobox
#### Giao diện trình bày.
các trường nhập liệu được trình bày theo dạng ô để dễ dàng nhập liệu. Có các button giúp tạo mới, sửa, xóa.
Các nhà kho sau khi nhập xong sẽ được hiển thị theo dạng list với cấu trúc phân cấp theo đơn vị.

### tab quản lý hệ thống camera an ninh (module quản lý hệ thống camera)
id hệ thống camera (trường ẩn, tự sinh)
Tên đơn vị cha-combobox
tên đơn vị con-combobox
đơn vị tính-combobox
Số lượng-text-nhập liệu
năm lắp đặt-text-nhập liệu
năm sửa chữa-text-nhập liệu
số màn hình-text-nhập liệu
Số camera-text-nhập liệu
cơ quan đầu tư-combobox
tình trạng-text-nhập liệu
Nhu cầu
+ sửa chữa lắp đặt-nhập số lượng
+ lắp đặt mới-Nhập số lượng
#### giao diện trình bày
giao diện trình bày được bố trí cấu trúc giống như giao diện trình bày của module quản lý nhà kho 


## Yêu cầu hệ thống
Hệ thống được định hướng dạng web app có cơ sở dữ liệu. sử dụng ngôn ngữ lập trình python, js, scss, css, html. 
Hệ thống mặc dù là web app nhưng có thể đóng gói thành file install (exe, msi). Database dùng SQLite và không được tạo sẵn trong bộ cài. Sau khi cài đặt xong, trước khi phần mềm đi vào hoạt động, hệ thống mở giao diện setup wizard để người dùng tự chọn vị trí lưu database và xác nhận tạo database; sau đó hệ thống tự tạo tài khoản quản trị cố định `admin` với mật khẩu mặc định `admin`. Người dùng được đổi mật khẩu sau khi đăng nhập, không được đổi username `admin`. 