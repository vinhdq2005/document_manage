# Backend — Python/FastAPI

Backend của hệ thống quản lý tài liệu nội bộ được triển khai bằng FastAPI và SQLAlchemy, giao tiếp với MySQL, lưu file vào thư mục `uploads/` trên máy chạy backend, và kiểm tra quyền truy cập ở mọi endpoint liên quan tới tài liệu.

## 1. Mục tiêu

- Xác thực người dùng bằng JWT
- Quản lý tài liệu theo phòng ban và quyền riêng từng người
- Upload/download tài liệu qua backend, không phục vụ file trực tiếp từ web server
- Quản lý phòng ban, người dùng và quyền đọc ngoài phòng cho tài liệu
- Kiểm soát role và quyền theo đặc tả MVP trong `docs/PROJECT_SPEC.md`

## 2. Công nghệ

- Python 3.12+
- FastAPI
- SQLAlchemy
- PyMySQL
- Pydantic
- python-jose + passlib
- python-multipart

## 3. Cấu trúc thư mục

```text
backend/
  app/
    db/
      database.py
    models/
      models.py
    schemas/
      schemas.py
    services/
      auth.py
    main.py
  uploads/
  requirement.txt
  README.md
```

## 4. Môi trường và cài đặt

Từ thư mục gốc dự án:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirement.txt
```

Nếu chưa tạo MySQL database, hãy tạo database trước khi chạy backend. Ví dụ:

```sql
CREATE DATABASE document_manage_dev
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;
```

## 5. Cấu hình kết nối database

Backend đọc kết nối MySQL từ biến môi trường `DATABASE_URL` nếu có, nếu không sẽ dùng giá trị mặc định:

```text
mysql+pymysql://root:123456@localhost:3306/document_manage_dev
```

Bạn có thể thiết lập trước khi chạy:

```powershell
$env:DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/document_manage_dev"
```

## 6. Chạy backend

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI sẽ mở ở:

```text
http://localhost:8000/docs
```

## 7. API hiện có

Tiền tố: `/api/v1`

### 7.1 Xác thực

#### `POST /api/v1/auth/login`
Đăng nhập bằng email và mật khẩu.

Request body:

```json
{
  "email": "admin@example.invalid",
  "password": "your_password"
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "admin@example.invalid",
  "full_name": "Quản trị viên mẫu",
  "role": "employee",
  "is_admin": true,
  "can_upload": true
}
```

#### `GET /api/v1/auth/me`
Trả về thông tin người dùng đang đăng nhập.

### 7.2 Tài liệu

#### `GET /api/v1/documents`
Danh sách tài liệu người dùng được phép xem, có hỗ trợ:
- `q`: tìm trong tiêu đề và mô tả
- `department_id`: lọc theo phòng ban sở hữu
- `category`: lọc theo danh mục
- `page`, `page_size`: phân trang

Response:

```json
{
  "items": [],
  "page": 1,
  "page_size": 10,
  "total": 0
}
```

#### `POST /api/v1/documents`
Upload tài liệu kèm metadata.

Request form-data:
- `title`
- `description` (tùy chọn)
- `category` (tùy chọn)
- `file` (bắt buộc)

Lưu ý:
- chỉ người có `can_upload = TRUE` mới upload được
- admin không có quyền upload theo MVP
- file được lưu trong `backend/uploads`

#### `GET /api/v1/documents/{id}`
Xem metadata tài liệu sau khi kiểm tra quyền.

#### `GET /api/v1/documents/{id}/download`
Tải file tài liệu sau khi kiểm tra quyền.

#### `PATCH /api/v1/documents/{id}`
Sửa metadata tài liệu. Chỉ admin hoặc người đã upload tài liệu mới được sửa.

#### `DELETE /api/v1/documents/{id}`
Xóa mềm tài liệu (`deleted_at` được set), không xóa cứng khỏi database.

### 7.3 Quản lý quyền đọc tài liệu

#### `GET /api/v1/admin/documents`
Danh sách tài liệu tối thiểu để admin chọn tài liệu cần cấp quyền. Chỉ admin được gọi.

#### `GET /api/v1/documents/{id}/grants`
Liệt kê danh sách user đã được cấp quyền đọc tài liệu.

#### `POST /api/v1/documents/{id}/grants`
Cấp quyền đọc cho một người dùng cụ thể.

Request body:

```json
{
  "user_id": 7
}
```

#### `DELETE /api/v1/documents/{id}/grants/{user_id}`
Thu hồi quyền đọc của user.

### 7.4 Quản lý phòng ban

#### `GET /api/v1/departments`
Danh sách phòng ban. Chỉ admin.

#### `POST /api/v1/departments`
Tạo phòng ban mới. Chỉ admin.

#### `PATCH /api/v1/departments/{id}`
Cập nhật tên phòng ban. Chỉ admin.

### 7.5 Quản lý người dùng

#### `GET /api/v1/users`
Danh sách người dùng. Chỉ admin.

#### `POST /api/v1/users`
Tạo người dùng mới. Chỉ admin.

#### `PATCH /api/v1/users/{id}`
Cập nhật thông tin người dùng. Chỉ admin.

### 7.6 Sức khỏe hệ thống

#### `GET /api/v1/health`
Trả về trạng thái backend:

```json
{
  "status": "ok"
}
```

## 8. Quy tắc quyền hiện hành

Theo thiết kế hiện tại:

- `is_admin = TRUE`:
  - quản trị hệ thống
  - không được xem nội dung hoặc tải file tài liệu
  - chỉ quản lý quyền, người dùng, phòng ban
- `role = director`:
  - đọc được mọi tài liệu chưa xóa
- `role = employee` hoặc `department_head`:
  - đọc được tài liệu của phòng mình
- `document_user_grants`:
  - cấp quyền đọc riêng cho từng user
  - chỉ admin được cấp và thu hồi
- `can_upload`:
  - quyền upload, độc lập với role
  - admin không có quyền upload theo MVP

## 9. Quy tắc lưu trữ file

- Tệp tài liệu được lưu trong thư mục `backend/uploads/`
- Tên file trên disk là tên tự sinh, không dựa vào tên người dùng nhập
- `original_filename` được lưu vào MySQL để trả về khi client tải xuống
- Không phục vụ thư mục `uploads/` như static folder công khai
- Khi upload xong và ghi metadata MySQL thất bại, file được xóa để tránh dữ liệu rác

## 10. Kết nối database theo migration

Backend đang giả định schema đã được tạo bằng các migration trong thư mục `database/migrations/` và seed dữ liệu trong `database/seeds/`.

Thứ tự khuyến nghị:

```sql
SOURCE database/migrations/001_initial_schema.sql;
SOURCE database/migrations/002_user_read_grants_and_roles.sql;
SOURCE database/seeds/001_demo_users.sql;
SOURCE database/seeds/002_demo_roles.sql;
```

## 11. Kiểm thử nhanh

Sau khi chạy backend, bạn có thể kiểm tra bằng Swagger UI tại `/docs` hoặc gọi API bằng curl/Postman.

Ví dụ đăng nhập:

```powershell
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.invalid","password":"your_password"}'
```

## 12. Ghi chú

- Không commit mật khẩu, token, hoặc thông tin nhạy cảm vào repository.
- Nên dùng biến môi trường cho `DATABASE_URL` và các thông tin bí mật trong môi trường production.
- Backend hiện đang tập trung đúng theo đặc tả MVP và quyền tài liệu như trong `PROJECT_SPEC.md`.
