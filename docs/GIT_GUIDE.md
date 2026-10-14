# Hướng dẫn Git cho nhóm ba người

Tài liệu này dùng cho repository `https://github.com/vinhdq2005/document_manage.git`, nhánh chung `main` và ba phần việc React, FastAPI, MySQL. Mỗi người làm trên một nhánh tính năng riêng, đưa thay đổi vào `main` qua pull request (PR). Xem thêm [quy trình phối hợp](WORKFLOW.md).

## 1. Các khái niệm và lệnh thường dùng

| Lệnh | Tác dụng | Khi dùng |
| --- | --- | --- |
| `git status` | Xem nhánh hiện tại và file đã/sắp thay đổi | Trước khi chuyển nhánh, commit, pull |
| `git fetch origin` | Lấy thông tin commit/nhánh mới từ GitHub; chưa sửa file đang làm | Trước khi so sánh hoặc cập nhật nhánh |
| `git pull --ff-only origin main` | Fetch rồi cập nhật nhánh `main` cục bộ nếu có thể tiến thẳng | Khi đang ở `main`, trước khi tạo nhánh mới |
| `git switch -c <ten-nhanh>` | Tạo và chuyển sang nhánh mới | Bắt đầu một đầu việc |
| `git add <duong-dan>` | Chọn file để đưa vào commit | Sau khi kiểm tra thay đổi |
| `git commit -m "..."` | Lưu một mốc thay đổi trên máy | Sau khi hoàn thành một phần nhỏ |
| `git push -u origin <ten-nhanh>` | Đẩy nhánh lên GitHub và đặt nhánh theo dõi | Lần đầu push nhánh |
| `git push` | Đẩy các commit tiếp theo lên GitHub | Sau lần push đầu |

`origin` là tên remote GitHub của repository này. `main` là nhánh chung. `fetch` chỉ cập nhật dữ liệu từ remote; `pull` còn tích hợp thay đổi vào nhánh hiện tại. Vì vậy, khi đang làm trên nhánh tính năng, nhóm dùng `fetch` rồi `merge origin/main` để thấy rõ mình đang đưa gì vào nhánh. [Git fetch](https://git-scm.com/docs/git-fetch), [Git pull](https://git-scm.com/docs/git-pull).

## 2. Thiết lập lần đầu trên mỗi máy

Chủ repository mời hai thành viên còn lại làm collaborator trên GitHub. Sau khi phiên bản tài liệu/khung thư mục đầu tiên đã được đẩy lên `main`, mỗi người chạy:

```powershell
git clone https://github.com/vinhdq2005/document_manage.git
cd document_manage
git status
git remote -v
```

Nếu Git chưa có tên và email cho commit, cấu hình trên máy cá nhân:

```powershell
git config --global user.name "Tên của bạn"
git config --global user.email "email-cua-ban@example.com"
```

Không chạy `git init` trong thư mục đã clone. Nếu đổi URL repository, lấy URL mới từ GitHub thay vì dùng địa chỉ ví dụ trên.

## 3. Tạo nhánh cho một đầu việc

Đầu tiên bảo đảm `main` cục bộ đã cập nhật và không có thay đổi chưa commit:

```powershell
git status
git switch main
git pull --ff-only origin main
git switch -c frontend/document-list
```

Ví dụ tên nhánh: `frontend/document-list`, `backend/document-api`, `database/initial-schema`. Một đầu việc dùng một nhánh ngắn hạn; không dùng một nhánh `frontend` hoặc `backend` cố định cho cả học kỳ. Nếu `git switch` hoặc `pull` báo có thay đổi cục bộ, dừng lại, kiểm tra `git status` và commit phần đang làm trước khi tiếp tục.

## 4. Làm việc, commit và push

Ví dụ người frontend hoàn thành một phần:

```powershell
git status
git diff
git add frontend/
git diff --cached
git commit -m "feat(frontend): add document list"
git push -u origin frontend/document-list
```

Lần sau trên cùng nhánh, sau khi commit chỉ cần `git push`. Dùng `git add` theo thư mục hoặc file đã kiểm tra; tránh `git add .` khi chưa xem `git status`. Không commit `.env`, mật khẩu, database cục bộ, `node_modules/` hoặc tệp thật trong `uploads/`.

Nếu Git báo `nothing to commit`, kiểm tra file đã lưu chưa và có bị `.gitignore` bỏ qua hay không. Nếu push bị từ chối vì remote có commit mới trên **chính nhánh của mình**, chạy `git fetch origin`, xem `git status`/`git log`, rồi tích hợp thay đổi đó trước khi push lại; không dùng `--force` trên nhánh đang chia sẻ.

## 5. Cập nhật thay đổi từ `main` vào nhánh đang làm

Sau khi người khác gộp PR vào `main`, từ nhánh tính năng của mình:

```powershell
git status
git fetch origin
git merge origin/main
```

Nếu merge thành công, chạy lại phần mình phụ trách, rồi `git push`. `git fetch origin` một mình chưa cập nhật file trong nhánh hiện tại. Nhóm dùng merge để giữ quy trình dễ theo dõi; không cần rebase hoặc force push trong bài tập này.

Nếu nhánh đang có thay đổi chưa commit, hoàn thành và commit chúng trước khi merge. Sau khi có migration mới trên `main`, chạy migration đó trên MySQL cục bộ theo hướng dẫn trong `database/README.md`; Git không tự sửa database trên máy bạn.

## 6. Tạo và gộp pull request

1. Push nhánh lên GitHub.
2. Trên GitHub, chọn **Compare & pull request** (hoặc tạo PR với base `main`, compare là nhánh của mình).
3. Ghi rõ đã làm gì, file chính đã đổi, cách kiểm tra và tác động tới API/migration.
4. Nhờ ít nhất một thành viên khác xem. Sửa trên cùng nhánh, commit và push tiếp; PR tự cập nhật.
5. Sau khi kiểm tra xong và giải quyết xung đột, gộp PR vào `main` trên GitHub. Không push trực tiếp vào `main` trong luồng làm việc thông thường. [GitHub: tạo pull request](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request).

Sau khi PR đã gộp, cập nhật `main` trên máy:

```powershell
git switch main
git pull --ff-only origin main
```

Đầu việc tiếp theo bắt đầu bằng một nhánh mới từ `main` vừa cập nhật.

## 7. Khi có conflict

`git merge origin/main` có thể báo conflict nếu hai người sửa cùng một vùng file. Làm theo thứ tự:

1. Chạy `git status` để biết file xung đột.
2. Mở từng file, chọn nội dung đúng và xóa các dấu `<<<<<<<`, `=======`, `>>>>>>>`.
3. Nếu conflict liên quan API, quyền hoặc migration, trao đổi với người phụ trách trước khi chọn một phía.
4. Kiểm tra lại file, rồi chạy:

```powershell
git add duong-dan/file-da-sua
git commit
git push
```

`git commit` hoàn tất merge khi mọi conflict đã được xử lý. Nếu chưa rõ cách giải quyết và muốn quay về trước lần merge đang dở, dùng `git merge --abort`, sau đó trao đổi với nhóm. Không dùng `git reset --hard` để xử lý conflict vì có thể làm mất việc chưa commit.

## 8. Mẫu một ngày làm việc

```text
Xem git status
  -> Nếu bắt đầu việc mới: cập nhật main, tạo nhánh mới
  -> Nếu đang làm dở: tiếp tục trên nhánh hiện tại
Viết mã, kiểm tra, commit từng phần nhỏ
  -> git fetch origin và git merge origin/main khi main có thay đổi liên quan
  -> git push
  -> Tạo/cập nhật PR, nhờ người khác xem
  -> Sau khi gộp: cập nhật main trên máy
```

Git đồng bộ mã nguồn và tài liệu. MySQL của mỗi người và `uploads/` là dữ liệu cục bộ; dùng migration, seed và hướng dẫn backup để đưa môi trường về cùng trạng thái.
