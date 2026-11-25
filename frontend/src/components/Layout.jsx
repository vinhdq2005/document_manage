import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../utils/format';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user.is_admin
    ? [
        { to: '/admin/grants', text: 'Quyền đọc tài liệu' },
        { to: '/admin/users', text: 'Người dùng' },
        { to: '/admin/departments', text: 'Phòng ban' },
      ]
    : [
        { to: '/documents', text: 'Tài liệu', end: true },
        ...(user.can_upload ? [{ to: '/documents/new', text: 'Tải lên' }] : []),
      ];

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Kho tài liệu</span>
        </div>
        <nav className="side-nav" aria-label="Menu chính">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              {l.text}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <div className="side-user-name">{user.full_name}</div>
          <div className="side-user-meta">{roleLabel(user)}{user.department_name ? ` – ${user.department_name}` : ''}</div>
          <button type="button" className="side-logout" onClick={onLogout}>Đăng xuất</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
