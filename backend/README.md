# Backend — Python/FastAPI

Người phụ trách backend làm việc trong thư mục này. Xem [đặc tả chung](../docs/PROJECT_SPEC.md) và [quy trình ba máy](../docs/WORKFLOW.md).

## Công việc

1. Tạo ứng dụng FastAPI trong `backend/app/`; tách phần API, nghiệp vụ, truy cập MySQL và lưu tệp để dễ kiểm tra quyền.
2. Xây API theo hợp đồng trong đặc tả; dùng OpenAPI của FastAPI để frontend và cơ sở dữ liệu đối chiếu.
3. Kiểm tra quyền ở mọi endpoint liên quan tài liệu, nhất là danh sách, chi tiết và download.
4. Chỉ lưu tệp bên trong thư mục upload được cấu hình. Tự sinh tên lưu trữ; giữ tên gốc trong MySQL để trả khi download. Chặn đường dẫn vượt ra ngoài thư mục upload.
5. Xử lý lỗi khi ghi tệp thành công nhưng ghi MySQL thất bại, hoặc ngược lại. Không phục vụ `uploads/` như thư mục tĩnh công khai.

## Bàn giao và phối hợp

- Thống nhất schema và migration với người cơ sở dữ liệu; thống nhất request/response với frontend.
- Cấu hình kết nối MySQL, bí mật đăng nhập và đường dẫn upload bằng biến môi trường; không commit giá trị thật.
- Cập nhật file này bằng phiên bản Python, lệnh tạo môi trường, cài đặt, chạy và kiểm tra API khi mã nguồn đã được tạo.

Hiện chưa có mã nguồn backend nên chưa có lệnh chạy.
