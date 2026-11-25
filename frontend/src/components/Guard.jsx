import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Spinner } from './States';

// admin: chỉ admin | member: chỉ người không phải admin | upload: cần can_upload
export default function Guard({ admin = false, member = false, upload = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Đang kiểm tra phiên đăng nhập…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  if (admin && !user.is_admin) return <Forbidden text="Chỉ quản trị viên mới vào được trang này." />;
  if (member && user.is_admin) {
    return <Forbidden text="Quản trị viên quản lý quyền truy cập nhưng không xem hay tải nội dung tài liệu." />;
  }
  if (upload && !user.can_upload) return <Forbidden text="Tài khoản của bạn chưa được cấp quyền tải tài liệu lên." />;
  return children;
}

export function Forbidden({ text }) {
  return (
    <div className="state">
      <p className="state-title">Không có quyền truy cập</p>
      <p className="muted">{text}</p>
    </div>
  );
}
