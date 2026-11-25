# Frontend — React

Giao diện cho hệ thống quản lý tài liệu nội bộ. Chỉ gọi API FastAPI trong `backend/`; mọi quyết định quyền do backend kiểm tra, giao diện chỉ ẩn bớt thao tác dựa trên `/auth/me`.

## Chạy

Cần Node.js 18 trở lên.

```powershell
cd frontend
copy .env.example .env      # sửa VITE_API_URL nếu backend không chạy ở localhost:8000
npm install
npm run dev                 # mở http://localhost:5173
```

Build bản phát hành: `npm run build` (kết quả ở `frontend/dist`).

Khi demo qua LAN, đặt `VITE_API_URL=http://<IP máy chạy backend>:8000/api/v1`, chạy backend với `--host 0.0.0.0` và mở frontend bằng `http://<IP máy chạy frontend>:5173`.

## Chuẩn bị backend để đăng nhập được

Hai điểm trong `backend/requirement.txt` dễ làm backend không chạy hoặc không đăng nhập được:

1. Thiếu `email-validator`, thư viện mà `EmailStr` của Pydantic cần. Cài thêm: `pip install email-validator`.
2. `passlib 1.7.4` lỗi với `bcrypt` bản mới. Nếu đăng nhập báo lỗi 500 liên quan bcrypt: `pip install bcrypt==4.0.1`.

Tài khoản trong `database/seeds` bị khóa, mật khẩu vô hiệu và dùng email `@example.invalid`. Chạy script sau (từ thư mục gốc dự án) để đặt mật khẩu và kích hoạt:

```powershell
python scripts/activate_demo_users.py MatKhauDemo123
```

Kết quả là các tài khoản `admin@congty.vn`, `uploader.a@congty.vn`, `head.a@congty.vn`, `reader.b@congty.vn`, `reader2.b@congty.vn`, `director@congty.vn`, cùng mật khẩu bạn đã chọn.

## Màn hình theo vai trò

| Vai trò | Thấy gì |
| --- | --- |
| Nhân viên, trưởng phòng | Danh sách, chi tiết, tải xuống tài liệu của phòng mình và tài liệu được cấp riêng. Có nút Tải lên nếu `can_upload`. Người đã upload tài liệu được sửa và xóa tài liệu đó. |
| Giám đốc | Như trên, nhưng đọc mọi tài liệu và lọc được theo phòng ban. |
| Quản trị viên | Quyền đọc tài liệu (cấp/thu hồi theo từng người), Người dùng, Phòng ban. Không có màn hình xem hay tải nội dung tài liệu. |

## Cấu trúc

```text
src/
  api/        client.js (fetch, token, lỗi, upload có tiến độ), index.js (các endpoint)
  auth/       AuthContext (đăng nhập, /auth/me), useDepartments (tên phòng ban)
  components/ Layout, Guard (chặn route theo vai trò), Modal, Toast, Pagination, States
  pages/      Login, Documents, DocumentDetail, Upload, NotFound
  pages/admin Grants, Users, Departments
  config.js   Giới hạn upload (20 MB, danh sách đuôi tệp) và nhãn vai trò
```

Token lưu trong `localStorage`. Backend không có đăng xuất hay refresh token, nên đăng xuất chỉ xóa token phía trình duyệt; token sống 24 giờ. Khi một request trả 401 giao diện tự đăng xuất.

## Các giới hạn do backend hiện tại

Frontend bám đúng backend nên có những chỗ phải xử lý tạm:

- `GET /departments` chỉ admin gọi được. Người dùng thường chỉ biết tên phòng của mình (từ `/auth/me`); phòng khác hiện là "Phòng #id".
- Tài liệu chỉ có `uploaded_by` (ID), nên chi tiết hiện "Bạn" hoặc "Người dùng #id".
- Bộ lọc phòng ban chỉ bật cho giám đốc. Với nhân viên, backend trả rỗng khi lọc phòng khác phòng mình, kể cả tài liệu được cấp riêng.
- Backend không có API liệt kê danh mục và phòng ban cho người dùng thường, nên các ô lọc lấy từ 100 tài liệu mới nhất mà người đó đọc được.
- Backend chưa giới hạn dung lượng hay loại tệp. Giới hạn trong `src/config.js` chỉ chặn ở giao diện.
- Đăng nhập sai trả mã 400 (không phải 401); giao diện hiện thông báo của backend.
- Tải xuống dùng `fetch` kèm token rồi lưu blob, vì thẻ `<a href>` không gửi được header Authorization.
