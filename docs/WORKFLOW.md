# Hướng dẫn làm việc trên ba máy

## Nguyên tắc chung

- Cả ba thành viên clone cùng một repository và làm trên nhánh riêng. Đặt tên nhánh dễ nhận biết, ví dụ `frontend/...`, `backend/...`, `database/...`.
- Lệnh clone, tạo nhánh, fetch, pull, push, PR và xử lý conflict được hướng dẫn trong [GIT_GUIDE.md](GIT_GUIDE.md).
- Mỗi máy có MySQL Community Edition và database phát triển riêng. Không chia sẻ tài khoản `root`, mật khẩu hay file `.env` qua Git.
- Schema được đồng bộ bằng migration trong `database/migrations/`; dữ liệu thử nghiệm được đồng bộ bằng seed trong `database/seeds/`. Không dùng bản sao database cá nhân làm nguồn thiết kế chính.
- Tệp trong `uploads/` là dữ liệu chạy thử cục bộ, không commit. Nếu cần mẫu chung, tạo dữ liệu mẫu và hướng dẫn cách upload lại.
- Thống nhất hợp đồng API qua OpenAPI của FastAPI trước khi frontend kết nối thật. Thay đổi endpoint, tên trường hoặc mã lỗi phải báo cho hai người còn lại.

## Trình tự làm việc

1. Cùng đọc [PROJECT_SPEC.md](PROJECT_SPEC.md) và chốt các quyết định nghiệp vụ còn mở.
2. Người cơ sở dữ liệu viết migration đầu tiên và seed cho ít nhất hai phòng ban. Người backend kiểm tra schema có hỗ trợ truy vấn quyền cần thiết.
3. Người backend công bố request/response mẫu cho đăng nhập, danh sách, upload, download và cấp quyền. Người frontend dùng dữ liệu giả theo đúng schema đó.
4. Mỗi người hoàn thành một phần nhỏ trên nhánh của mình, cập nhật README trong thư mục phụ trách, rồi tạo pull request để nhóm xem trước khi gộp.
5. Sau mỗi lần gộp migration, cả ba cập nhật repository và chạy migration mới trên database cục bộ. Không sửa migration đã được nhóm dùng; tạo migration kế tiếp.
6. Chọn một máy tích hợp/demo. Trên máy đó chạy MySQL, FastAPI, React và lưu toàn bộ tệp demo trong `uploads/`; các máy còn lại mở giao diện qua LAN nếu cần.

## Hướng dẫn môi trường cục bộ

- Cài Git, Python, Node.js và MySQL Community Edition trên máy cần chạy toàn bộ ứng dụng. Người chỉ làm một phần có thể dùng dữ liệu giả, nhưng vẫn nên thử tích hợp trước buổi demo.
- Tạo database riêng, ví dụ `document_manage_dev`, và tài khoản MySQL cho ứng dụng. Mỗi máy tự giữ mật khẩu của mình.
- Cấu hình backend qua biến môi trường cho kết nối MySQL, bí mật phiên đăng nhập và đường dẫn upload. Cấu hình frontend bằng địa chỉ API FastAPI. Tên biến và lệnh chạy cụ thể sẽ được thêm vào README của từng phần khi có mã nguồn.
- Đặt thư mục upload trên cùng máy chạy backend. Nếu đổi máy demo, chuyển cả bản sao MySQL và thư mục upload tương ứng.

## Quy ước hoàn thành một thay đổi

- Tính năng có giao diện, API và schema phù hợp nhau; quyền được kiểm tra bằng API, không chỉ ẩn nút trên giao diện.
- Migration mới chạy được trên database mới và trên database của nhóm đã áp dụng migration trước đó.
- Thay đổi có hướng dẫn chạy/thử trong README của thư mục tương ứng. Không đưa dữ liệu cá nhân, mật khẩu hoặc tệp tài liệu thật vào commit.
- Với luồng phân quyền, thử ít nhất: phòng sở hữu được đọc, phòng khác bị từ chối, được đọc sau khi cấp quyền và bị từ chối sau khi thu hồi.

## Giới hạn của phương án miễn phí

Mỗi máy phát triển có dữ liệu riêng; Git không tự đồng bộ MySQL hoặc `uploads/`. Máy tích hợp/demo phải bật khi người khác cần truy cập. Nếu bài yêu cầu một URL công khai chạy liên tục, nhóm sẽ cần quyết định phương án hosting riêng trước khi triển khai.
