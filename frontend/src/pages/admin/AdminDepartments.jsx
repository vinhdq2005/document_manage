import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { formatDate } from "../../utils";

export default function AdminDepartments() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null); // {id, name}
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.get("/departments");
      setItems(res.data);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/departments", { name });
      setName("");
      load();
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  async function handleRename() {
    setError("");
    try {
      await api.patch(`/departments/${editing.id}`, { name: editing.name });
      setEditing(null);
      load();
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Quản lý phòng ban</h2>
      {error && <div className="alert error">{error}</div>}
      <form className="card filters" onSubmit={handleCreate}>
        <input placeholder="Tên phòng ban mới" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="primary">Thêm phòng ban</button>
      </form>
      <table>
        <thead><tr><th>ID</th><th>Tên</th><th>Ngày tạo</th><th></th></tr></thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>
                {editing?.id === d.id
                  ? <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  : d.name}
              </td>
              <td>{formatDate(d.created_at)}</td>
              <td>
                {editing?.id === d.id ? (
                  <>
                    <button className="primary" onClick={handleRename}>Lưu</button>{" "}
                    <button onClick={() => setEditing(null)}>Hủy</button>
                  </>
                ) : (
                  <button onClick={() => setEditing({ id: d.id, name: d.name })}>Đổi tên</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
