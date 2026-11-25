export default function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="pagination" aria-label="Phân trang">
      <span className="muted">Hiển thị {from}–{to} trên {total} tài liệu</span>
      <div className="pagination-btns">
        <button type="button" className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trước</button>
        <span className="pagination-now">Trang {page}/{pages}</span>
        <button type="button" className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>Sau</button>
      </div>
    </nav>
  );
}
