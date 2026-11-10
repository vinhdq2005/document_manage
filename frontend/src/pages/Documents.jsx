import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatSize } from "../utils";
import { downloadDocument } from "../downloadFile";

const PAGE_SIZE = 10;

export default function Documents() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ q: "", category: "", department_id: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Chỉ gửi tham số có giá trị
      const params = { page, page_size: PAGE_SIZE };
      if (applied.q) params.q = applied.q;
      if (applied.category) params.category = applied.category;
      if (applied.department_id) params.department_id = applied.department_id;
      const res = await api.get("/documents", { params });
      setData(res.data);
    } catch (err) {
      setError(await getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  }

  async function handleDownload(doc) {
    try {
      await downloadDocument(doc);
    } catch (err) {
      setError(await getErrorMessage(err));
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <h2>Danh sách tài liệu</h2>
      <form className="card filters" onSubmit={handleSearch}>
        <input placeholder="Tìm theo tiêu đề / mô tả" value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        <input placeholder="Loại tài liệu" value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })} />
        {user.role === "director" && (
          <input type="number" min="1" placeholder="Mã phòng ban" value={filters.department_id}
            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })} />
        )}
        <button className="primary">Tìm kiếm</button>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading ? <p className="center">Đang tải...</p> : (
        <table>
          <thead>
            <tr><th>Tiêu đề</th><th>Loại</th><th>Phòng</th><th>Tệp</th><th>Ngày tạo</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.length === 0 && <tr><td colSpan="6" className="center">Không có tài liệu nào.</td></tr>}
            {data.items.map((d) => (
              <tr key={d.id}>
                <td><Link to={`/documents/${d.id}`}>{d.title}</Link></td>
                <td>{d.category || "—"}</td>
                <td>#{d.owner_department_id}</td>
                <td>{d.original_filename} <small>({formatSize(d.size_bytes)})</small></td>
                <td>{formatDate(d.created_at)}</td>
                <td><button onClick={() => handleDownload(d)}>Tải xuống</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</button>
        <span>Trang {page} / {totalPages} ({data.total} tài liệu)</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau ›</button>
      </div>
    </div>
  );
}
