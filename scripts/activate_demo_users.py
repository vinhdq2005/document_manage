"""Đặt mật khẩu thật và kích hoạt các tài khoản demo trong database/seeds.

Seed mặc định tạo tài khoản bị khóa, mật khẩu vô hiệu và email @example.invalid
(email-validator của backend thường từ chối tên miền .invalid nên không đăng nhập được).
Script này đổi email sang tên miền hợp lệ, đặt mật khẩu bằng chính hàm băm của backend
và bật is_active. Không sửa mã nguồn backend.

Cách chạy (từ thư mục gốc dự án, đã cài backend/requirement.txt, đã chạy migration + seed):

    python scripts/activate_demo_users.py MatKhauDemo123
    python scripts/activate_demo_users.py MatKhauDemo123 --domain congty.vn

Chỉ dùng cho database phát triển.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.db.database import SessionLocal  # noqa: E402
from app.models.models import Department, User  # noqa: E402
from app.services.auth import get_password_hash  # noqa: E402

OLD_DOMAIN = "example.invalid"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("password", help="Mật khẩu đặt cho mọi tài khoản demo (tối thiểu 6 ký tự)")
    parser.add_argument("--domain", default="congty.vn", help="Tên miền email mới (mặc định: congty.vn)")
    args = parser.parse_args()
    if len(args.password) < 6:
        sys.exit("Mật khẩu cần ít nhất 6 ký tự.")

    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter((User.email.like(f"%@{OLD_DOMAIN}")) | (User.email.like(f"%@{args.domain}")))
            .order_by(User.id)
            .all()
        )
        if not users:
            sys.exit("Không thấy tài khoản demo. Hãy chạy database/seeds/*.sql trước.")

        password_hash = get_password_hash(args.password)
        departments = {d.id: d.name for d in db.query(Department).all()}
        for u in users:
            u.email = f"{u.email.split('@')[0]}@{args.domain}"
            u.password_hash = password_hash
            u.is_active = True
        db.commit()

        print(f"Đã kích hoạt {len(users)} tài khoản, mật khẩu: {args.password}\n")
        for u in users:
            flags = ", ".join(x for x, on in (("admin", u.is_admin), ("can_upload", u.can_upload)) if on) or "chỉ đọc"
            print(f"  {u.email:<28} {u.role:<16} {departments.get(u.department_id, '?'):<10} [{flags}]")
    finally:
        db.close()


if __name__ == "__main__":
    main()
