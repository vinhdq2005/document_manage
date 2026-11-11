import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// adminOnly: chỉ admin | readerOnly: chỉ người KHÔNG phải admin (admin không được xem tài liệu)
export default function ProtectedRoute({ children, adminOnly, readerOnly, needUpload }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.is_admin) return <Navigate to="/documents" replace />;
  if (readerOnly && user.is_admin) return <Navigate to="/admin/users" replace />;
  if (needUpload && !user.can_upload) return <Navigate to="/documents" replace />;
  return children;
}
