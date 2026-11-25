import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={location.state?.from || '/'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-aside" aria-hidden="true">
        <div className="login-stack">
          <span className="tab tab-pdf">PDF</span>
          <span className="tab tab-word">DOC</span>
          <span className="tab tab-sheet">XLS</span>
          <span className="tab tab-slide">PPT</span>
        </div>
        <p className="login-tagline">Tài liệu của phòng bạn, ở đúng chỗ cần tìm.</p>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <h1>Đăng nhập</h1>
          <p className="muted">Dùng tài khoản nội bộ do quản trị viên cấp.</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
          </label>
          <label className="field">
            <span>Mật khẩu</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </div>
  );
}
