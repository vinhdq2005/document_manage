# Cơ sở dữ liệu — MySQL

Người phụ trách cơ sở dữ liệu làm việc trong thư mục này. Xem [mô hình dự kiến](../docs/PROJECT_SPEC.md) và [quy trình ba máy](../docs/WORKFLOW.md).

## Thư mục

- `migrations/`: các thay đổi schema có thứ tự; mỗi lần thay đổi sau khi đã chia sẻ cần migration mới.
- `seeds/`: dữ liệu mẫu không chứa thông tin thật, gồm ít nhất hai phòng ban, người dùng mẫu và trường hợp cấp/thu hồi quyền.

## Công việc

1. Thiết kế `departments`, `users`, `documents`, `document_department_grants` với khóa ngoại và ràng buộc cần thiết.
2. Tạo chỉ mục hỗ trợ lọc tài liệu theo quyền, phòng ban và thời gian; thống nhất truy vấn với backend.
3. Viết migration để mọi máy tạo được cùng schema. Ghi rõ thứ tự áp dụng và cách xử lý khi schema thay đổi.
4. Viết seed để frontend/backend cùng kiểm thử các trường hợp quyền. Không commit bản dump của database cá nhân hoặc mật khẩu.
5. Viết hướng dẫn sao lưu/khôi phục MySQL và nhắc sao lưu thư mục `uploads/` tương ứng trên máy demo.

## Bàn giao

Khi migration và seed đầu tiên được tạo, cập nhật file này bằng phiên bản MySQL mục tiêu, lệnh tạo database, lệnh áp dụng migration/seed và cách kiểm tra kết quả. Hiện chưa có script SQL nên chưa có lệnh để chạy.
