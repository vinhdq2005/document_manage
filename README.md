# Quản lý tài liệu nội bộ công ty

Ứng dụng web để lưu trữ, tìm kiếm và chia sẻ tài liệu giữa các phòng ban trong công ty. Người dùng được đọc tài liệu của phòng ban mình; phòng ban khác chỉ được đọc khi được cấp quyền.

> Dự án đang ở giai đoạn thiết kế. Repository hiện chưa có mã nguồn chạy được. Tài liệu này là điểm bắt đầu để ba người phụ trách frontend, backend và cơ sở dữ liệu triển khai cùng một phạm vi.

## Công nghệ đã chọn

| Thành phần | Công nghệ | Trách nhiệm |
| --- | --- | --- |
| Frontend | React | Giao diện đăng nhập, danh sách, tìm kiếm, upload/download và quản lý quyền |
| Backend | Python, FastAPI | API, xác thực, kiểm tra quyền và xử lý tệp |
| Cơ sở dữ liệu | MySQL Community Edition | Người dùng, phòng ban, thông tin tài liệu và quyền truy cập |
| Lưu trữ tệp | Ổ đĩa của máy chạy backend | Nội dung tệp tài liệu trong thư mục `uploads/` |

React chỉ gọi FastAPI. FastAPI quyết định người dùng có quyền xem, tải lên hay tải xuống, sau đó đọc/ghi tệp trong `uploads/`. MySQL chỉ lưu thông tin và đường dẫn tương đối của tệp; frontend không truy cập trực tiếp thư mục này.

## Chức năng bản đầu tiên (MVP)

- Đăng nhập, đăng xuất và quản lý người dùng.
- Xem danh sách, tìm kiếm theo tên/mô tả và lọc theo phòng ban, loại tài liệu.
- Tải tài liệu lên và tải tài liệu được phép xem xuống.
- Quản trị viên quản lý phòng ban, người dùng và cấp/thu hồi quyền đọc cho phòng ban khác.
- Ghi lại người tải lên, thời gian tạo và thông tin tệp.

Quy tắc quyền chi tiết, mô hình dữ liệu dự kiến, hợp đồng API và tiêu chí hoàn thành nằm trong [Tài liệu dự án](docs/PROJECT_SPEC.md). Phần việc của ba người nằm trong [Kế hoạch phân công](docs/TEAM_PLAN.md); cách làm trên ba máy nằm trong [Hướng dẫn phối hợp](docs/WORKFLOW.md) và [Hướng dẫn Git](docs/GIT_GUIDE.md).

## Cấu trúc thư mục

```text
frontend/       React; xem frontend/README.md
backend/        FastAPI; xem backend/README.md
database/       Migration và dữ liệu mẫu MySQL; xem database/README.md
uploads/        Tệp upload trên máy chạy backend; xem uploads/README.md
docs/           Đặc tả, phân công và quy trình làm việc
```

Các thư mục đã được tạo để nhóm bắt đầu làm việc. Repository vẫn chưa có mã nguồn chạy được, vì vậy chưa có lệnh cài đặt/chạy ứng dụng để công bố.

## Làm việc trên ba máy

Mỗi thành viên clone cùng một repository, cài MySQL Community Edition trên máy mình và chạy migration cùng dữ liệu mẫu. Mỗi máy có database và tệp upload riêng trong lúc phát triển; Git chỉ đồng bộ mã nguồn, migration và tài liệu. Khi tích hợp/demo, chọn một máy chạy React, FastAPI, MySQL và giữ thư mục `uploads/` của bản demo. Xem [WORKFLOW.md](docs/WORKFLOW.md) và [GIT_GUIDE.md](docs/GIT_GUIDE.md) để biết thứ tự và lệnh làm việc.

## Cấu hình dự kiến

- Backend: thông tin kết nối MySQL, bí mật dùng cho phiên đăng nhập và đường dẫn thư mục upload.
- Frontend: địa chỉ API FastAPI.
- Mật khẩu, token và tệp upload thật không commit vào Git.

## Quyết định cần xác nhận trước khi lập trình

- Giới hạn dung lượng và loại tệp được phép tải lên.
- Ai được tải tài liệu lên, sửa/xóa tài liệu và cấp quyền đọc liên phòng ban.
- Người dùng có thuộc nhiều phòng ban hay chỉ một phòng ban trong giai đoạn đầu.

Các lựa chọn tạm thời để nhóm có thể thiết kế được ghi rõ trong tài liệu dự án; chúng chưa phải yêu cầu nghiệp vụ cuối cùng.
