import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentsApi, usersApi } from '../../api';
import { useDepartments } from '../../auth/useDepartments';
import { ConfirmDialog } from '../../components/Modal';
import { Empty, ErrorBox, Spinner } from '../../components/States';
import { useToast } from '../../components/Toast';
import { formatDateTime } from '../../utils/format';

export default function Grants() {
  const { nameOf, loading: depLoading, error: depError } = useDepartments();
  const [docs, setDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, u] = await Promise.all([documentsApi.adminList(), usersApi.list()]);
      setDocs(d);
      setUsers(u);
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
    return k ? docs.filter((d) => d.title.toLowerCase().includes(k)) : docs;
  }, [docs, search]);

  const selected = docs.find((d) => d.id === selectedId) || null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Quyền đọc tài liệu</h1>
          <p className="muted">Cấp quyền đọc cho từng người ngoài phòng sở hữu. Thu hồi có hiệu lực ngay ở lần truy cập tiếp theo.</p>
        </div>
      </header>

      {loading || depLoading ? (
        <Spinner />
      ) : error || depError ? (
        <ErrorBox message={error || depError} onRetry={load} />
      ) : docs.length === 0 ? (
        <Empty title="Chưa có tài liệu nào để cấp quyền">Khi nhân viên tải tài liệu lên, tài liệu sẽ hiện ở đây.</Empty>
      ) : (
        <div className="split">
          <section className="split-list" aria-label="Danh sách tài liệu">
            <input type="search" className="toolbar-search" placeholder="Tìm theo tiêu đề" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm tài liệu" />
            <ul className="pick-list">
              {filtered.map((d) => (
                <li key={d.id}>
                  <button type="button" className={`pick ${d.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(d.id)} aria-pressed={d.id === selectedId}>
                    <span className="pick-title">{d.title}</span>
                    <span className="pick-meta">{nameOf(d.owner_department_id)}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="muted pick-empty">Không có tài liệu nào khớp.</li>}
            </ul>
          </section>

          <section className="split-detail" aria-live="polite">
            {selected ? (
              <GrantPanel key={selected.id} doc={selected} users={users} nameOf={nameOf} />
            ) : (
              <Empty title="Chọn một tài liệu ở bên trái">Bạn sẽ xem và chỉnh được danh sách người đọc ngoài phòng.</Empty>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function GrantPanel({ doc, users, nameOf }) {
  const toast = useToast();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickUser, setPickUser] = useState('');
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGrants(await documentsApi.grants(doc.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doc.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Backend từ chối cấp cho admin, giám đốc và người cùng phòng sở hữu; ẩn sẵn các lựa chọn đó.
  const eligible = useMemo(() => {
    const granted = new Set(grants.map((g) => g.user_id));
    return users.filter(
      (u) => u.is_active && !u.is_admin && u.role !== 'director' && u.department_id !== doc.owner_department_id && !granted.has(u.id),
    );
  }, [users, grants, doc.owner_department_id]);

  const onGrant = async (e) => {
    e.preventDefault();
    if (!pickUser) return;
    setBusy(true);
    try {
      const created = await documentsApi.grant(doc.id, Number(pickUser));
      setGrants((prev) => [created, ...prev]);
      setPickUser('');
      toast.success(`Đã cấp quyền đọc cho ${created.user_name || 'người dùng'}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async () => {
    setBusy(true);
    try {
      await documentsApi.revoke(doc.id, revoking.user_id);
      setGrants((prev) => prev.filter((g) => g.user_id !== revoking.user_id));
      toast.success('Đã thu hồi quyền đọc.');
      setRevoking(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">{doc.title}</h2>
      <p className="muted">Thuộc {nameOf(doc.owner_department_id)}. Mọi người trong phòng này đã đọc được.</p>

      <form className="grant-add" onSubmit={onGrant}>
        <label className="field grow">
          <span>Cấp quyền đọc cho</span>
          <select value={pickUser} onChange={(e) => setPickUser(e.target.value)} disabled={busy || eligible.length === 0}>
            <option value="">{eligible.length === 0 ? 'Không còn ai để cấp quyền' : 'Chọn người dùng'}</option>
            {eligible.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name} ({u.email}) – {nameOf(u.department_id)}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={!pickUser || busy}>Cấp quyền</button>
      </form>
      <p className="hint">Chỉ cấp được cho người ngoài phòng sở hữu. Giám đốc luôn đọc được mọi tài liệu; quản trị viên không đọc tài liệu.</p>

      <h3 className="sub-title">Người đang được cấp quyền</h3>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : grants.length === 0 ? (
        <p className="muted">Chưa cấp quyền cho ai.</p>
      ) : (
        <ul className="grant-list">
          {grants.map((g) => (
            <li key={g.user_id}>
              <div>
                <div className="doc-title">{g.user_name || `Người dùng #${g.user_id}`}</div>
                <div className="doc-file">{g.user_email}</div>
                <div className="doc-file">Cấp lúc {formatDateTime(g.created_at)}</div>
              </div>
              <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setRevoking(g)}>Thu hồi</button>
            </li>
          ))}
        </ul>
      )}

      {revoking && (
        <ConfirmDialog
          title="Thu hồi quyền đọc?"
          message={`${revoking.user_name || 'Người dùng này'} sẽ không còn tìm thấy hay tải được "${doc.title}".`}
          confirmText="Thu hồi quyền"
          danger
          busy={busy}
          onConfirm={onRevoke}
          onClose={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
