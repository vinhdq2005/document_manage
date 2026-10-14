# Tệp upload cục bộ

Thư mục này chứa nội dung tệp khi FastAPI chạy trên máy hiện tại. Tệp thật bị loại khỏi Git; chỉ README và `.gitignore` trong thư mục được commit.

- Backend phải kiểm tra quyền trong MySQL trước khi trả tệp. Không cấu hình web server công khai trực tiếp thư mục này.
- Tên tệp lưu trữ do backend tạo; tên tệp gốc nằm trong bảng `documents`.
- Khi chuyển môi trường demo, sao lưu/khôi phục cả MySQL và thư mục này cùng một thời điểm. Chỉ chuyển database mà không chuyển tệp sẽ làm hỏng download.
- Không đặt tài liệu nội bộ thật hoặc dữ liệu nhạy cảm vào repository.
