import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatSize } from "../utils";
import { downloadDocument } from "../downloadFile";

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [form, setForm] = useState(null); // != null khi đang sửa
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/documents/${id}`)
      .then((res) => setDoc(res.data))
      .catch(async (err) => setError(await getErrorMessage(err)));
  }, [id]);

  // Backend chỉ cho sửa/xóa nếu là người đã upload (hoặc admin, nhưng admin không vào trang này)
  const isUploader = doc && doc.uploaded_by === user.id;

  async function handleSave(e) {
    e.preventDefault();
    try {
      const res = await api.patch(`/documents/${id}`, form);
      setDoc(res.data);
      setForm(null);
      setMessage("Đã lưu thay đổi.");
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm("Xóa tài liệu này?")) return;
    try {
      await api.delete(`/documents/${id}`);
      navigate("/documents");
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  async function handleDownload() {
    try {
      await downloadDocument(doc);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  return (
    <div>
      <p><Link to="/documents">‹ Quay lại danh sách</Link></p>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert ok">{message}</div>}
      {!doc && !error && <p className="center">Đang tải...</p>}
      {doc && !form && (
        <div className="card">
          <h2>{doc.title}</h2>
          <p>{doc.description || <em>Không có mô tả</em>}</p>
          <dl>
            <dt>Loại</dt><dd>{doc.category || "—"}</dd>
            <dt>Phòng sở hữu</dt><dd>#{doc.owner_department_id}</dd>
            <dt>Tệp</dt><dd>{doc.original_filename} ({formatSize(doc.size_bytes)})</dd>
            <dt>Ngày tạo</dt><dd>{formatDate(doc.created_at)}</dd>
            <dt>Cập nhật</dt><dd>{formatDate(doc.updated_at)}</dd>
          </dl>
          <div className="row">
            <button className="primary" onClick={handleDownload}>Tải xuống</button>
            {isUploader && (
              <>
                <button onClick={() => setForm({ title: doc.title, description: doc.description || "", category: doc.category || "" })}>Sửa</button>
                <button className="danger" onClick={handleDelete}>Xóa</button>
              </>
            )}
          </div>
        </div>
      )}
      {doc && form && (
        <form className="card" onSubmit={handleSave}>
          <h2>Sửa thông tin tài liệu</h2>
          <label>Tiêu đề</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label>Mô tả</label>
          <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label>Loại tài liệu</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="row">
            <button className="primary">Lưu</button>
            <button type="button" onClick={() => setForm(null)}>Hủy</button>
          </div>
        </form>
      )}
    </div>
  );
}
