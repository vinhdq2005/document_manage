import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { useDepartments } from '../../auth/useDepartments';
import Modal from '../../components/Modal';
import { Empty, ErrorBox, Spinner } from '../../components/States';
import { useToast } from '../../components/Toast';
import { ROLE_LABELS } from '../../config';
import { formatDate } from '../../utils/format';

export default function Users() {
  const { user: me } = useAuth();
  const { list: departments, nameOf, loading: depLoading, error: depError } = useDepartments();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null | { user: null | User }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase();
    if (!k) return users;
    return users.filter((u) => u.full_name.toLowerCase().includes(k) || u.email.toLowerCase().includes(k));
  }, [users, search]);

  const onSaved = (saved, isNew) => {
    setUsers((prev) => (isNew ? [...prev, saved] : prev.map((u) => (u.id === saved.id ? saved : u))));
    setForm(null);
    toast.success(isNew ? 'Đã thêm người dùng.' : 'Đã lưu thay đổi.');
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Người dùng</h1>
          <p className="muted">Tài khoản quản trị viên quản lý quyền nhưng không đọc hay tải được nội dung tài liệu.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setForm({ user: null })} disabled={departments.length === 0}>
          Thêm người dùng
        </button>
      </header>

      <div className="toolbar">
        <input type="search" className="toolbar-search" placeholder="Tìm theo tên hoặc email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm người dùng" />
      </div>

      {depError && <ErrorBox message={depError} />}
      {loading || depLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <Empty title="Không có người dùng nào khớp" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Phòng ban</th>
                <th>Vai trò</th>
                <th>Quyền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={u.is_active ? '' : 'row-off'}>
                  <td>
                    <div className="doc-title">{u.full_name}{u.id === me.id && <span className="badge">Bạn</span>}</div>
                    <div className="doc-file">{u.email}</div>
                  </td>
                  <td>{nameOf(u.department_id)}</td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td>
                    {u.is_admin && <span className="badge badge-strong">Quản trị</span>}
                    {u.can_upload && <span className="badge">Được tải lên</span>}
                    {!u.is_admin && !u.can_upload && <span className="muted">Chỉ đọc</span>}
                  </td>
                  <td>{u.is_active ? 'Đang hoạt động' : <span className="muted">Đã khóa</span>}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td className="actions"><button type="button" className="btn btn-sm" onClick={() => setForm({ user: u })}>Sửa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <UserForm
          target={form.user}
          users={users}
          departments={departments}
          selfId={me.id}
          onClose={() => setForm(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function UserForm({ target, users, departments, selfId, onClose, onSaved }) {
  const isNew = !target;
  const isSelf = target?.id === selfId;
  const [f, setF] = useState({
    email: target?.email || '',
    full_name: target?.full_name || '',
    password: '',
    department_id: target?.department_id || departments[0]?.id || '',
    role: target?.role || 'employee',
    is_admin: target?.is_admin || false,
    can_upload: target?.can_upload || false,
    is_active: target ? target.is_active : true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const email = f.email.trim();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== target?.id)) {
      return setError('Email này đã có người dùng khác sử dụng.');
    }
    if (isNew && f.password.length < 6) return setError('Mật khẩu cần ít nhất 6 ký tự.');
    if (!isNew && f.password && f.password.length < 6) return setError('Mật khẩu mới cần ít nhất 6 ký tự.');

    const payload = {
      email,
      full_name: f.full_name.trim(),
      department_id: Number(f.department_id),
      role: f.role,
      is_admin: f.is_admin,
      can_upload: f.can_upload,
      is_active: f.is_active,
    };
    if (f.password) payload.password = f.password;

    setBusy(true);
    try {
      const saved = isNew ? await usersApi.create(payload) : await usersApi.update(target.id, payload);
      onSaved(saved, isNew);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Thêm người dùng' : 'Sửa người dùng'}
      onClose={busy ? () => {} : onClose}
      wide
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="submit" form="user-form" className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : isNew ? 'Thêm người dùng' : 'Lưu thay đổi'}</button>
        </>
      }
    >
      <form id="user-form" className="form" onSubmit={onSubmit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="grid-2">
          <label className="field">
            <span>Họ tên</span>
            <input value={f.full_name} onChange={set('full_name')} maxLength={150} required autoFocus />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={f.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>{isNew ? 'Mật khẩu' : 'Mật khẩu mới'}</span>
            <input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" placeholder={isNew ? 'Ít nhất 6 ký tự' : 'Để trống nếu không đổi'} required={isNew} />
          </label>
          <label className="field">
            <span>Phòng ban</span>
            <select value={f.department_id} onChange={set('department_id')} required>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Vai trò</span>
            <select value={f.role} onChange={set('role')}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="checks">
          <legend>Quyền và trạng thái</legend>
          <label className="check">
            <input type="checkbox" checked={f.can_upload} onChange={set('can_upload')} />
            <span>Được tải tài liệu lên<small>Tài liệu thuộc phòng ban của người này.</small></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.is_admin} onChange={set('is_admin')} disabled={isSelf} />
            <span>Quản trị viên<small>Quản lý người dùng, phòng ban, quyền đọc; không đọc hay tải được tài liệu và không tải lên được.</small></span>
          </label>
          <label className="check">
            <input type="checkbox" checked={f.is_active} onChange={set('is_active')} disabled={isSelf} />
            <span>Cho phép đăng nhập<small>Bỏ chọn để khóa tài khoản.</small></span>
          </label>
          {isSelf && <p className="hint">Bạn không thể tự bỏ quyền quản trị hoặc tự khóa tài khoản của mình.</p>}
        </fieldset>
      </form>
    </Modal>
  );
}
