import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../utils";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <header className="topbar">
        <strong>Quản lý tài liệu</strong>
        <nav>
          {!user.is_admin && <NavLink to="/documents">Tài liệu</NavLink>}
          {!user.is_admin && user.can_upload && <NavLink to="/upload">Tải lên</NavLink>}
          {user.is_admin && (
            <>
              <NavLink to="/admin/users">Người dùng</NavLink>
              <NavLink to="/admin/departments">Phòng ban</NavLink>
              <NavLink to="/admin/grants">Cấp quyền đọc</NavLink>
            </>
          )}
        </nav>
        <div className="spacer" />
        <span className="who">
          {user.full_name} ({user.is_admin ? "Quản trị viên" : ROLE_LABELS[user.role]}
          {user.department_name ? ` – ${user.department_name}` : ""})
        </span>
        <button onClick={handleLogout}>Đăng xuất</button>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
