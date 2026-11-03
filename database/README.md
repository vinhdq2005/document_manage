# Cơ sở dữ liệu — MySQL

Schema hiện hành có bốn bảng: `departments`, `users`, `documents`, `document_user_grants`. Mỗi người thuộc một phòng ban. `users.role` nhận `employee`, `department_head` hoặc `director`; `is_admin` là quyền quản trị độc lập với role và **admin không được đọc tài liệu**. Admin cấp quyền upload qua `users.can_upload` và cấp quyền đọc ngoài phòng cho từng người, từng tài liệu qua `document_user_grants`.

## Tạo database và áp dụng migration

Yêu cầu MySQL 8.0.16 trở lên; dự án đang dùng MySQL 8.4. Mỗi máy có database và mật khẩu riêng:

```sql
CREATE DATABASE document_manage_dev
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Trên database mới, áp dụng đúng thứ tự:

```text
database/migrations/001_initial_schema.sql
database/migrations/002_user_read_grants_and_roles.sql
database/seeds/001_demo_users.sql
database/seeds/002_demo_roles.sql
```

Ví dụ trong MySQL CLI, từ thư mục gốc repository:

```sql
USE document_manage_dev;
SOURCE database/migrations/001_initial_schema.sql;
SOURCE database/migrations/002_user_read_grants_and_roles.sql;
SOURCE database/seeds/001_demo_users.sql;
SOURCE database/seeds/002_demo_roles.sql;
```

Database đã dùng migration 001 và seed 001 chỉ cần chạy migration 002 rồi seed 002. Migration 002 chuyển mỗi quyền cũ cấp cho phòng thành quyền cấp riêng cho **những người dùng hiện có** trong phòng nhận, sau đó xóa bảng cấp quyền theo phòng. Người dùng tạo sau này không tự kế thừa quyền đó. Chỉ chạy migration/seed một lần; migration không phải script chạy lặp và không có rollback tự động. Khi schema thay đổi tiếp, tạo migration mới thay vì sửa migration đã chia sẻ.

## Quy tắc dữ liệu và quyền

- `departments.name`, `users.email`, `documents.storage_path` là duy nhất. `users.department_id` bắt buộc; admin và giám đốc cũng có một phòng ban để quản lý hồ sơ người dùng.
- Seed tạo sáu tài khoản mẫu ở trạng thái vô hiệu hóa, với hash cố ý không hợp lệ. Backend phải tạo hash mật khẩu thật và kích hoạt trước khi demo; không lưu mật khẩu dùng được trong Git.
- `documents.owner_department_id` xác định phòng sở hữu. `uploaded_by` xác định người tải lên. `storage_path` do backend tạo, là đường dẫn tương đối trong `uploads/`; MySQL không lưu nội dung file.
- `documents.deleted_at IS NULL` là điều kiện bắt buộc cho danh sách, chi tiết và download. Xóa mềm giữ metadata và file cho đến khi có chính sách xóa hẳn.
- Mọi người dùng đang hoạt động, không phải admin, đọc được tài liệu của phòng mình. Giám đốc đọc được toàn bộ tài liệu chưa xóa. `department_head` hiện có cùng phạm vi đọc trong phòng với `employee`; role này được giữ để mở rộng nghiệp vụ sau.
- Ngoài phòng, người dùng chỉ đọc được tài liệu nếu có bản ghi `(document_id, user_id)` trong `document_user_grants`. Chỉ admin được cấp bằng `INSERT` và thu hồi bằng `DELETE`. Backend không tạo grant cho người thuộc phòng sở hữu, admin hoặc giám đốc vì không cần thiết. Thu hồi phải có hiệu lực ở yêu cầu API kế tiếp.
- Admin có thể xem metadata tối thiểu để chọn tài liệu cần cấp quyền (ID, tiêu đề, phòng sở hữu), nhưng không được gọi API chi tiết nội dung hoặc download. Backend phải từ chối admin **trước** khi xét phòng ban hay grant, kể cả khi admin được gán role giám đốc hoặc có grant cũ.
- Chỉ admin được đổi `role`, `can_upload` và quản lý grant. Admin hoặc người đã upload được sửa metadata/xóa mềm. `can_upload` không tự cấp quyền đọc ngoài phòng. Backend phải kiểm tra `is_active` và quyền ở mọi endpoint; khóa ngoại không thay thế kiểm tra quyền.
- Không xóa cứng người dùng/phòng ban còn được tham chiếu. Có thể vô hiệu hóa tài khoản qua `is_active = FALSE`.

Điều kiện đọc tham khảo cho danh sách, chi tiết và download:

```sql
SELECT d.*
FROM documents AS d
JOIN users AS u ON u.id = :user_id
WHERE u.is_active = TRUE
  AND u.is_admin = FALSE
  AND d.deleted_at IS NULL
  AND (
    u.role = 'director'
    OR d.owner_department_id = u.department_id
    OR EXISTS (
      SELECT 1 FROM document_user_grants AS g
      WHERE g.document_id = d.id AND g.user_id = u.id
    )
  );
```

Backend thay `:user_id` bằng tham số truy vấn, đồng thời thêm `q`, bộ lọc và phân trang. Chỉ mục trên phòng sở hữu, thời gian và `(user_id, document_id)` hỗ trợ lọc quyền. Tìm `q` trong tên/mô tả bắt đầu bằng `LIKE`; đánh giá lại chỉ mục sau khi có dữ liệu và truy vấn thực tế. `category` là văn bản tự do trong MVP.

## Kiểm tra seed và grant

```sql
SELECT id, name FROM departments ORDER BY id;
SELECT email, role, is_admin, can_upload, is_active FROM users ORDER BY id;
```

Seed không tạo tài liệu vì mỗi bản ghi cần file thật trong `uploads/`. Sau khi backend upload tài liệu của Phòng A, dùng API admin để cấp tài liệu đó cho riêng người dùng `reader.b@example.invalid`. Ví dụ SQL chỉ để kiểm tra trên database demo; thay `@document_id` bằng ID đã upload:

```sql
SET @document_id = 1;
INSERT INTO document_user_grants (document_id, user_id, granted_by)
SELECT @document_id, recipient.id, admin_user.id
FROM users AS recipient
JOIN users AS admin_user ON admin_user.email = 'admin@example.invalid'
WHERE recipient.email = 'reader.b@example.invalid';

SELECT * FROM document_user_grants WHERE document_id = @document_id;

DELETE FROM document_user_grants
WHERE document_id = @document_id
  AND user_id = (SELECT id FROM users WHERE email = 'reader.b@example.invalid');
```

Kiểm thử qua API: người A đọc tài liệu A; người B không đọc trước khi cấp, chỉ đọc đúng tài liệu được cấp, và mất quyền sau khi thu hồi; giám đốc đọc mọi tài liệu; admin chỉ quản lý quyền và không tải được file; người `can_upload = FALSE` không upload được.

## Sao lưu và khôi phục

Sao lưu database và thư mục `uploads/` cùng một thời điểm, giữ chúng thành một bộ. Ví dụ lệnh cho MySQL CLI (chạy trong shell hỗ trợ chuyển hướng đầu vào/đầu ra):

```text
mysqldump -u <your_user> -p --single-transaction --routines --triggers document_manage_dev > document_manage_dev.sql
mysql -u <your_user> -p document_manage_dev < document_manage_dev.sql
```

Khôi phục `uploads/` tương ứng trước khi phục vụ download; kiểm tra `documents.storage_path` trỏ tới file tồn tại. Không commit dump, mật khẩu hoặc file upload thật.
