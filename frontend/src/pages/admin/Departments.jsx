import { useEffect, useMemo, useState } from 'react';
import { departmentsApi, usersApi } from '../../api';
import { useDepartments } from '../../auth/useDepartments';
import Modal from '../../components/Modal';
import { Empty, ErrorBox, Spinner } from '../../components/States';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../utils/format';

export default function Departments() {
  const { list, loading, error, reload } = useDepartments();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null); // null | { dept: null | Department }

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.department_id] = (map[u.department_id] || 0) + 1; });
    return map;
  }, [users]);

  const onSaved = async (isNew) => {
    setForm(null);
    toast.success(isNew ? 'Đã thêm phòng ban.' : 'Đã đổi tên phòng ban.');
    await reload();
  };

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <h1>Phòng ban</h1>
          <p className="muted">Mỗi người dùng thuộc đúng một phòng ban và đọc được tài liệu của phòng đó.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setForm({ dept: null })}>Thêm phòng ban</button>
      </header>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <Empty title="Chưa có phòng ban nào">Thêm phòng ban đầu tiên rồi mới tạo được người dùng.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tên phòng ban</th>
                <th className="num">Số người dùng</th>
                <th>Ngày tạo</th>
                <th><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td className="doc-title">{d.name}</td>
                  <td className="num">{counts[d.id] ?? 0}</td>
                  <td>{formatDate(d.created_at)}</td>
                  <td className="actions"><button type="button" className="btn btn-sm" onClick={() => setForm({ dept: d })}>Đổi tên</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && <DepartmentForm dept={form.dept} existing={list} onClose={() => setForm(null)} onSaved={onSaved} />}
    </div>
  );
}

function DepartmentForm({ dept, existing, onClose, onSaved }) {
  const isNew = !dept;
  const [name, setName] = useState(dept?.name || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return setError('Tên phòng ban không được để trống.');
    if (existing.some((d) => d.name.toLowerCase() === clean.toLowerCase() && d.id !== dept?.id)) {
      return setError('Tên phòng ban này đã tồn tại.');
    }
    setBusy(true);
    setError('');
    try {
      if (isNew) await departmentsApi.create(clean);
      else await departmentsApi.update(dept.id, clean);
      await onSaved(isNew);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Thêm phòng ban' : 'Đổi tên phòng ban'}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="submit" form="dept-form" className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : isNew ? 'Thêm phòng ban' : 'Lưu tên mới'}</button>
        </>
      }
    >
      <form id="dept-form" className="form" onSubmit={onSubmit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label className="field">
          <span>Tên phòng ban</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} required autoFocus />
        </label>
      </form>
    </Modal>
  );
}
