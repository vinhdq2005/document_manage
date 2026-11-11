import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { ROLE_LABELS } from "../../utils";

const EMPTY = { email: "", password: "", full_name: "", department_id: "", role: "employee", is_admin: false, can_upload: false, is_active: true };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [u, d] = await Promise.all([api.get("/users"), api.get("/departments")]);
      setUsers(u.data);
      setDepartments(d.data);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }
  useEffect(() => { load(); }, []);

  const deptName = (id) => departments.find((d) => d.id === id)?.name || `#${id}`;

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", { ...form, department_id: Number(form.department_id) });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  // Đổi nhanh một trường (khóa/mở, bật/tắt can_upload, đổi role)
  async function patchUser(id, changes) {
    setError("");
    try {
      await api.patch(`/users/${id}`, changes);
      load();
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Quản lý người dùng</h2>
      {error && <div className="alert error">{error}</div>}

      <form className="card grid" onSubmit={handleCreate}>
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Mật khẩu (≥ 6 ký tự)" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Họ tên" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required>
          <option value="">-- Phòng ban --</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={form.can_upload} onChange={(e) => setForm({ ...form, can_upload: e.target.checked })} /> Được upload</label>
        <label className="check"><input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} /> Quản trị viên</label>
        <button className="primary">Tạo người dùng</button>
      </form>

      <table>
        <thead><tr><th>ID</th><th>Họ tên / Email</th><th>Phòng</th><th>Vai trò</th><th>Upload</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.full_name}{u.is_admin && <span className="badge">admin</span>}<br /><small>{u.email}</small></td>
              <td>{deptName(u.department_id)}</td>
              <td>
                <select value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </td>
              <td><input type="checkbox" checked={u.can_upload} onChange={(e) => patchUser(u.id, { can_upload: e.target.checked })} /></td>
              <td>
                <button className={u.is_active ? "danger" : "primary"} onClick={() => patchUser(u.id, { is_active: !u.is_active })}>
                  {u.is_active ? "Khóa" : "Kích hoạt"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
