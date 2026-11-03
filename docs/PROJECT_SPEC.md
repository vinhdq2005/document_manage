# Tài liệu dự án: Quản lý tài liệu nội bộ

Trạng thái: bản thiết kế ban đầu, ngày 14/10/2026. Những mục ghi **Giả định MVP** cần chủ dự án xác nhận trước khi triển khai chức năng tương ứng.

## 1. Mục tiêu và phạm vi

Nhân viên tìm và tải tài liệu của phòng mình. Người ngoài phòng chỉ đọc được tài liệu cụ thể khi được quản trị viên cấp quyền cho chính người đó. Giám đốc đọc được mọi tài liệu; quản trị viên quản lý người dùng, phòng ban và quyền chia sẻ nhưng không đọc nội dung tài liệu.

MVP gồm: đăng nhập, danh sách và tìm kiếm tài liệu theo metadata, upload, download, quản lý người dùng/phòng ban, cấp và thu hồi quyền đọc theo từng người dùng cho tài liệu ngoài phòng. Chưa gồm: tìm kiếm trong nội dung PDF/Word, duyệt tài liệu nhiều bước, chỉnh sửa tệp trực tuyến, lịch sử phiên bản và thông báo.

## 2. Kiến trúc

```text
React -> FastAPI -> MySQL (metadata và quyền)
                  -> uploads/ trên máy chạy backend (nội dung tệp)
```

- React hiển thị dữ liệu và gửi yêu cầu qua API; không tự kết luận quyền truy cập.
- FastAPI xác thực người dùng, tính quyền từ MySQL và là điểm duy nhất đọc/ghi tệp trong MVP.
- MySQL lưu `storage_path` tương đối của tệp, không lưu nội dung tệp.
- Thư mục `uploads/` nằm trên máy chạy backend, không được phục vụ trực tiếp như thư mục tĩnh công khai. Tệp thật không đưa vào Git.
- Download đi qua FastAPI sau khi kiểm tra quyền. Khi demo từ máy khác qua LAN, mọi yêu cầu vẫn đi qua backend trên máy demo.

### Luồng upload

1. React gửi metadata và tệp cho FastAPI.
2. FastAPI xác thực, kiểm tra quyền upload, loại và kích thước tệp.
3. FastAPI tạo ID tài liệu và tên tệp lưu trữ không dựa vào tên do người dùng nhập, rồi ghi tệp vào `uploads/`.
4. FastAPI lưu metadata vào MySQL; nếu lưu thất bại, xóa tệp vừa ghi hoặc ghi nhận để dọn dẹp. Trả về ID tài liệu.

### Luồng download

1. React gọi API download với ID tài liệu.
2. FastAPI kiểm tra quyền đọc dựa trên phòng ban và các quyền đã cấp trong MySQL.
3. FastAPI đọc tệp trong `uploads/` và trả tệp với tên tải xuống phù hợp.

## 3. Quy tắc quyền đã chốt

| Hành động | Quy tắc MVP |
| --- | --- |
| Xem danh sách, metadata chi tiết, tải xuống | Người dùng đang hoạt động không phải admin: giám đốc; người thuộc phòng sở hữu; hoặc người được cấp riêng quyền đọc tài liệu đó |
| Upload | Quản trị viên hoặc người được admin bật `can_upload`; backend kiểm tra quyền theo phòng sở hữu |
| Sửa metadata/xóa tài liệu | **Giả định MVP:** quản trị viên hoặc người đã upload tài liệu |
| Cấp/thu hồi quyền đọc ngoài phòng cho từng người | Quản trị viên |
| Quản lý người dùng/phòng ban | Quản trị viên |

Admin chỉ xem metadata tối thiểu để chọn tài liệu khi quản lý quyền (ID, tiêu đề, phòng sở hữu), không được xem nội dung chi tiết hoặc tải file. Nếu tài khoản `is_admin = TRUE`, backend từ chối quyền đọc tài liệu trước khi xét role, phòng ban hoặc grant. `department_head` và `employee` có cùng phạm vi đọc trong phòng ở MVP vì mọi thành viên đều đọc được tài liệu của phòng. Giám đốc (`director`) đọc được toàn bộ tài liệu chưa xóa mềm. `can_upload` độc lập với role.

Mặc định không cấp quyền đọc ngoài phòng. Thu hồi quyền phải có hiệu lực cho yêu cầu API kế tiếp. Mọi endpoint trả thông tin hoặc nội dung tài liệu đều kiểm tra quyền tại backend; kết quả tìm kiếm chỉ gồm tài liệu người gọi được đọc.

Mỗi người dùng thuộc một phòng ban. Nếu sau này cần nhiều phòng ban, thay `users.department_id` bằng bảng liên kết `user_departments` và cập nhật quy tắc kiểm tra quyền.

## 4. Dữ liệu dự kiến

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| `departments` | `id`, `name`, `created_at` | `name` duy nhất |
| `users` | `id`, `email`, `password_hash`, `full_name`, `department_id`, `role`, `is_admin`, `can_upload`, `is_active`, `created_at` | Email duy nhất; role là `employee`, `department_head`, `director`; không lưu mật khẩu dạng rõ |
| `documents` | `id`, `title`, `description`, `category`, `owner_department_id`, `uploaded_by`, `original_filename`, `content_type`, `size_bytes`, `storage_path`, `created_at`, `updated_at`, `deleted_at` | `storage_path` là đường dẫn tương đối và duy nhất; `deleted_at` hỗ trợ xóa mềm |
| `document_user_grants` | `document_id`, `user_id`, `granted_by`, `created_at` | Khóa chính `(document_id, user_id)`; quyền đọc ngoài phòng theo từng người |

Khóa ngoại nối phòng ban/người dùng/tài liệu. Chỉ mục cho `documents.owner_department_id`, `documents.created_at`, `document_user_grants.user_id` và các trường tìm kiếm sẽ được đánh giá theo truy vấn thực tế. `storage_path` không lấy trực tiếp từ request; backend chuẩn hóa và kiểm tra đường dẫn để không đọc tệp ngoài thư mục upload.

## 5. Hợp đồng API sơ bộ

Tiền tố: `/api/v1`. Trả JSON cho dữ liệu; lỗi dùng mã HTTP phù hợp. API cần thống nhất schema chi tiết trước khi frontend và backend triển khai song song.

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/auth/login` | Đăng nhập |
| `GET` | `/auth/me` | Người dùng hiện tại và quyền |
| `GET` | `/documents` | Danh sách có phân trang, tìm kiếm và lọc; chỉ trả tài liệu được đọc |
| `POST` | `/documents` | Upload tệp cùng metadata |
| `GET` | `/documents/{id}` | Xem metadata sau khi kiểm tra quyền |
| `GET` | `/documents/{id}/download` | Tải tệp sau khi kiểm tra quyền |
| `PATCH` | `/documents/{id}` | Sửa metadata |
| `DELETE` | `/documents/{id}` | Xóa mềm tài liệu |
| `GET` | `/admin/documents` | Metadata tối thiểu để admin chọn tài liệu cấp quyền, không trả nội dung hoặc đường dẫn lưu trữ |
| `GET` | `/documents/{id}/grants` | Danh sách người dùng được cấp quyền; chỉ admin |
| `POST` | `/documents/{id}/grants` | Cấp quyền đọc cho một người dùng bằng `user_id`; chỉ admin |
| `DELETE` | `/documents/{id}/grants/{user_id}` | Thu hồi quyền đọc của người dùng; chỉ admin |
| `GET/POST/PATCH` | `/departments` và `/departments/{id}` | Quản lý phòng ban; quyền ghi cho quản trị viên |
| `GET/POST/PATCH` | `/users` và `/users/{id}` | Quản lý người dùng; quyền ghi cho quản trị viên |

Tham số danh sách dự kiến: `q`, `department_id`, `category`, `page`, `page_size`. `q` tìm trong tên và mô tả ở MVP. Response danh sách trả `items`, `page`, `page_size`, `total`. Backend phải từ chối yêu cầu không đủ quyền ngay cả khi frontend ẩn nút thao tác.

## 6. Yêu cầu vận hành và bảo mật

- Khi triển khai qua Internet, dùng HTTPS; giới hạn kích thước/loại tệp theo quyết định nghiệp vụ và xác nhận ở backend.
- Không công khai thư mục `uploads/` qua web server. Quyền đọc trong MySQL là nguồn quyết định quyền truy cập ứng dụng.
- Cấu hình riêng cho môi trường phát triển và sản xuất; không commit mật khẩu, token hoặc khóa dịch vụ.
- Sao lưu MySQL và thư mục `uploads/` cùng nhau để metadata luôn khớp với tệp; kiểm thử khôi phục trước buổi demo.
- Ghi log các lần upload, download, cấp/thu hồi quyền và lỗi truy cập để hỗ trợ kiểm tra sự cố. Mức chi tiết và thời gian lưu log sẽ được chốt khi triển khai.
- MySQL và hệ thống tệp không tự động cùng một transaction: cần xử lý trường hợp chỉ một trong hai nơi lưu thành công.

## 7. Tiêu chí hoàn thành MVP

1. Người dùng phòng A nhìn thấy và tải được tài liệu của A.
2. Người dùng phòng B không nhìn thấy hoặc tải được tài liệu của A khi chưa được cấp quyền.
3. Sau khi admin cấp quyền cho một người dùng cụ thể của phòng B, chỉ người đó tìm thấy và tải được tài liệu A; đồng nghiệp cùng phòng B không tự được đọc. Thu hồi làm người được cấp mất quyền ở yêu cầu API kế tiếp.
4. Giám đốc đọc được mọi tài liệu chưa xóa; admin quản lý quyền nhưng không xem nội dung hoặc tải được tài liệu.
5. Người không có quyền upload không thể upload bằng giao diện hoặc gọi API trực tiếp.
6. Upload thành công tạo metadata trong MySQL và tệp trong `uploads/`; lỗi một phía không để lại bản ghi/tệp mồ côi mà không được xử lý.
7. README có hướng dẫn cài đặt và chạy thực tế sau khi mã nguồn được thêm vào repository.

## 8. Quyết định còn mở

- Dung lượng tối đa và danh sách loại tệp cho phép.
- Chính sách chi tiết cho sửa/xóa tài liệu và việc admin upload tài liệu dù không có quyền đọc.
- Chính sách xóa: thời gian giữ trước khi xóa hẳn tệp trong `uploads/`.
- Cách đăng nhập: tài khoản nội bộ trong MySQL như mô hình dữ liệu dự kiến, hay tích hợp hệ thống đăng nhập hiện có của công ty.
- Phạm vi demo: chỉ trên máy/LAN hay cần truy cập qua Internet. Nếu cần Internet, phải quyết định nơi chạy backend và lưu tệp.

## Tài liệu tham khảo chính thức

- [MySQL Community Edition](https://www.mysql.com/products/community/)
- [MySQL: tối ưu khi dùng BLOB](https://dev.mysql.com/doc/refman/8.4/en/optimize-blob.html)
