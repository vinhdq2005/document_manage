# Frontend — React

Người phụ trách frontend làm việc trong thư mục này. Xem [đặc tả chung](../docs/PROJECT_SPEC.md) và [quy trình ba máy](../docs/WORKFLOW.md) trước khi tạo ứng dụng.

## Công việc

1. Tạo ứng dụng React trong thư mục `frontend/`; đặt mã nguồn trong `src/`.
2. Làm các màn hình: đăng nhập, danh sách/tìm kiếm, chi tiết, upload/download, quản trị người dùng/phòng ban và cấp quyền đọc.
3. Tạo một lớp gọi API tập trung; địa chỉ API phải cấu hình theo môi trường, không viết cố định vào từng component.
4. Dùng dữ liệu giả theo cùng schema API khi backend chưa sẵn sàng; bỏ dữ liệu giả khi tích hợp.
5. Hiển thị lỗi và trạng thái tải tệp rõ ràng. Ẩn thao tác không phù hợp theo `/auth/me`, nhưng không xem đây là biện pháp bảo mật.

## Bàn giao và phối hợp

- Thống nhất request/response, mã lỗi và cách gửi phiên đăng nhập với backend.
- Không đọc trực tiếp `uploads/` hoặc kết nối MySQL từ trình duyệt.
- Cập nhật file này bằng yêu cầu phiên bản Node.js, lệnh cài đặt, lệnh chạy và cấu hình API khi ứng dụng React đã được tạo.

Hiện chưa có mã nguồn frontend nên chưa có lệnh chạy.
