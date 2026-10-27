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

## Lịch triển khai đề xuất (10 ngày làm việc)

| Mốc | Backend | Frontend | MySQL | Kết quả chung |
| --- | --- | --- | --- | --- |
| Ngày 1–2: chốt thiết kế | Chốt quy tắc quyền, API và mẫu lỗi với hai người còn lại | Chốt màn hình, luồng thao tác và dữ liệu mock theo API | Chốt sơ đồ bảng, khóa ngoại, kiểu dữ liệu và truy vấn quyền | Thống nhất các quyết định còn mở trong `PROJECT_SPEC.md`, schema và ví dụ request/response trước khi triển khai độc lập |
| Ngày 3–5: xây nền | Làm đăng nhập, `/auth/me`, API danh sách/chi tiết và kiểm tra quyền | Làm đăng nhập, danh sách/tìm kiếm/lọc, chi tiết bằng mock | Bàn giao migration đầu tiên, seed hai phòng ban và hướng dẫn chạy | Backend chạy được trên schema thật; frontend dùng cùng cấu trúc dữ liệu với API |
| Ngày 6–8: hoàn thiện luồng | Làm upload/download, quản trị người dùng/phòng ban, cấp/thu hồi quyền; kiểm thử trường hợp bị từ chối | Nối API thật; làm upload/download và giao diện quản trị quyền; xử lý lỗi | Tối ưu chỉ mục theo truy vấn thực tế, kiểm thử migration và viết hướng dẫn backup/restore | Các luồng chính chạy xuyên suốt React → FastAPI → MySQL và `uploads/` |
| Ngày 9–10: tích hợp và bàn giao | Sửa lỗi API, xác nhận quyền ở mọi endpoint, hoàn thiện README | Sửa lỗi giao diện, xác nhận trạng thái tải và lỗi, hoàn thiện README | Kiểm tra seed, backup/restore cùng `uploads/`, hoàn thiện README | Demo và kiểm tra tiêu chí hoàn thành trong `PROJECT_SPEC.md` |

Lịch trên là ước lượng để chia việc; nếu chỉ làm bán thời gian, giữ nguyên thứ tự mốc và điều chỉnh số ngày sau khi cả nhóm ước lượng. Mỗi ngày dành một lần đồng bộ ngắn để báo tiến độ, vướng mắc và thay đổi API/schema.

## Việc đầu tiên và tiêu chí nhận bàn giao

- **Backend:** mở PR cho bộ khung FastAPI và hợp đồng API; bàn giao OpenAPI có ví dụ đăng nhập, phân trang/tìm kiếm, upload dạng multipart, download và mã lỗi `401/403/404`. Hoàn thành khi API kiểm tra quyền trên danh sách, chi tiết và download, kể cả khi gọi trực tiếp không qua giao diện.
- **Frontend:** mở PR cho cấu trúc React, màn hình đăng nhập, danh sách/tìm kiếm, chi tiết và lớp gọi API dùng cấu hình môi trường. Hoàn thành khi người dùng có thể upload/download qua backend và thấy rõ tiến độ, lỗi và trạng thái không có quyền.
- **MySQL:** mở PR cho migration, seed và tài liệu schema. Hoàn thành khi một database mới có thể áp dụng migration/seed theo README, có ít nhất hai phòng ban và dữ liệu để thử cấp rồi thu hồi quyền.
- **Cả nhóm:** chạy demo bằng tài khoản phòng A, phòng B và quản trị viên; xác nhận B không xem/tải được tài liệu A trước khi cấp quyền, xem/tải được sau khi cấp và bị từ chối ngay sau khi thu hồi. Kiểm tra thêm người không có quyền upload bị từ chối qua API.

## Quy ước bàn giao

- Mọi thay đổi liên quan quyền phải có ví dụ người dùng/phòng ban nào được phép và bị từ chối.
- Thay đổi schema cần migration; thay đổi API cần cập nhật OpenAPI và thông báo cho frontend.
- Không đưa mật khẩu MySQL, token hoặc tệp upload thật vào repository.
- Cập nhật README bằng lệnh cài đặt/chạy thật khi từng phần có mã nguồn.
