import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { formatDate } from "../../utils";

export default function AdminGrants() {
  const [docs, setDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [docId, setDocId] = useState("");
  const [grants, setGrants] = useState([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/documents"), api.get("/users"), api.get("/departments")])
      .then(([d, u, dep]) => { setDocs(d.data); setUsers(u.data); setDepartments(dep.data); })
      .catch(async (err) => setError(await getErrorMessage(err)));
  }, []);

  const deptName = (id) => departments.find((d) => d.id === id)?.name || `#${id}`;
  const doc = docs.find((d) => String(d.id) === String(docId));

  async function loadGrants(id) {
    try {
      const res = await api.get(`/documents/${id}/grants`);
      setGrants(res.data);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  function handleSelectDoc(id) {
    setDocId(id);
    setUserId("");
    setError("");
    setGrants([]);
    if (id) loadGrants(id);
  }

  // Backend từ chối: admin, giám đốc, người cùng phòng sở hữu, người đã được cấp -> lọc sẵn ở đây
  const candidates = doc
    ? users.filter((u) =>
        !u.is_admin && u.role !== "director" && u.is_active &&
        u.department_id !== doc.owner_department_id &&
        !grants.some((g) => g.user_id === u.id))
    : [];

  async function handleGrant(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/documents/${docId}/grants`, { user_id: Number(userId) });
      setUserId("");
      loadGrants(docId);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  async function handleRevoke(uid) {
    setError("");
    try {
      await api.delete(`/documents/${docId}/grants/${uid}`);
      loadGrants(docId);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Cấp / thu hồi quyền đọc tài liệu</h2>
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <label>Chọn tài liệu</label>
        <select value={docId} onChange={(e) => handleSelectDoc(e.target.value)}>
          <option value="">-- Chọn tài liệu --</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>#{d.id} – {d.title} ({deptName(d.owner_department_id)})</option>
          ))}
        </select>
      </div>

      {doc && (
        <>
          <form className="card filters" onSubmit={handleGrant}>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
              <option value="">-- Chọn người dùng ngoài phòng để cấp quyền --</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} – {u.email} ({deptName(u.department_id)})</option>
              ))}
            </select>
            <button className="primary">Cấp quyền đọc</button>
          </form>

          <table>
            <thead><tr><th>Người được cấp</th><th>Email</th><th>Ngày cấp</th><th></th></tr></thead>
            <tbody>
              {grants.length === 0 && <tr><td colSpan="4" className="center">Chưa cấp quyền cho ai.</td></tr>}
              {grants.map((g) => (
                <tr key={g.user_id}>
                  <td>{g.user_name}</td>
                  <td>{g.user_email}</td>
                  <td>{formatDate(g.created_at)}</td>
                  <td><button className="danger" onClick={() => handleRevoke(g.user_id)}>Thu hồi</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
