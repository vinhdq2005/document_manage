# Kế hoạch phân công cho ba người

Mục tiêu: ba người có thể triển khai song song sau khi thống nhất schema MySQL và hợp đồng API. [Tài liệu dự án](PROJECT_SPEC.md) là nguồn chung cho phạm vi và quyền truy cập.

## Người 1 — Frontend (React)

**Phụ trách:** giao diện đăng nhập; danh sách, tìm kiếm và lọc tài liệu; trang chi tiết; upload/download; màn hình quản trị người dùng, phòng ban và quyền đọc liên phòng ban.

**Bàn giao:** ứng dụng React, client gọi API, xử lý trạng thái tải tệp/lỗi/không có quyền, hướng dẫn chạy frontend. Giao diện ẩn thao tác không được phép dựa trên dữ liệu `/auth/me`, nhưng backend vẫn là nơi kiểm tra quyền cuối cùng.

**Có thể bắt đầu ngay:** dựng cấu trúc giao diện và dữ liệu giả theo hợp đồng API sơ bộ. Chuyển sang API thật sau khi schema request/response được chốt.

## Người 2 — Backend (Python/FastAPI)

**Phụ trách:** xác thực; API người dùng/phòng ban/tài liệu; kiểm tra quyền theo phòng ban; tích hợp MySQL và thư mục lưu tệp trên máy chạy backend; upload/download; xử lý lỗi và log thao tác.

**Bàn giao:** mã FastAPI, OpenAPI/schema request-response, cấu hình môi trường mẫu không chứa bí mật, hướng dẫn chạy backend, kiểm thử các trường hợp được và bị từ chối quyền.

**Điểm cần phối hợp:** cùng người cơ sở dữ liệu chốt migration/schema; cùng frontend chốt contract API trước khi thay đổi response.

## Người 3 — Cơ sở dữ liệu (MySQL)

**Phụ trách:** thiết kế bảng, khóa ngoại/chỉ mục, migration, dữ liệu mẫu, truy vấn lọc tài liệu theo quyền, phương án backup/restore MySQL.

**Bàn giao:** sơ đồ quan hệ, migration có thể chạy lại theo quy trình dự án, seed dữ liệu cho ít nhất hai phòng ban và các ca kiểm thử cấp/thu hồi quyền, mô tả ràng buộc dữ liệu.

**Điểm cần phối hợp:** thống nhất với backend cách kiểm tra quyền và xử lý xóa mềm; xác định các chỉ mục sau khi có truy vấn thực tế.

## Thứ tự phối hợp

1. **Cùng chốt nghiệp vụ:** quyền upload/sửa/xóa/cấp quyền, số phòng ban mỗi người, giới hạn tệp và cách đăng nhập.
2. **Backend + cơ sở dữ liệu:** chốt mô hình dữ liệu, migration đầu tiên và truy vấn quyền.
3. **Backend + frontend:** chốt endpoint, request/response, mã lỗi và ví dụ dữ liệu. Backend công bố OpenAPI; frontend dùng mock cùng schema.
4. **Làm song song:** frontend xây UI; backend xây API và xử lý lưu tệp; cơ sở dữ liệu hoàn thiện migration, seed và hướng dẫn backup.
5. **Tích hợp:** chạy các luồng upload, tìm kiếm, cấp/thu hồi quyền, download với ít nhất hai phòng ban; sửa lệch API/schema trước khi mở rộng tính năng.

## Quy ước bàn giao

- Mọi thay đổi liên quan quyền phải có ví dụ người dùng/phòng ban nào được phép và bị từ chối.
- Thay đổi schema cần migration; thay đổi API cần cập nhật OpenAPI và thông báo cho frontend.
- Không đưa mật khẩu MySQL, token hoặc tệp upload thật vào repository.
- Cập nhật README bằng lệnh cài đặt/chạy thật khi từng phần có mã nguồn.
