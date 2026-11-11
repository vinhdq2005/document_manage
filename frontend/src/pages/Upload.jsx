import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError("Vui lòng chọn tệp.");
    setError("");
    setBusy(true);
    try {
      // Backend nhận multipart/form-data: title, description, category, file
      const fd = new FormData();
      fd.append("title", form.title);
      if (form.description) fd.append("description", form.description);
      if (form.category) fd.append("category", form.category);
      fd.append("file", file);
      // KHÔNG tự đặt Content-Type, để trình duyệt thêm boundary
      const res = await api.post("/documents", fd);
      navigate(`/documents/${res.data.id}`);
    } catch (err) {
      setError(await getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Tải tài liệu lên</h2>
      <p><small>Tài liệu sẽ thuộc phòng ban của bạn.</small></p>
      {error && <div className="alert error">{error}</div>}
      <label>Tiêu đề *</label>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={255} />
      <label>Mô tả</label>
      <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <label>Loại tài liệu</label>
      <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={100} placeholder="Ví dụ: Hợp đồng, Báo cáo" />
      <label>Tệp *</label>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
      <button className="primary" disabled={busy}>{busy ? "Đang tải lên..." : "Tải lên"}</button>
    </form>
  );
}
