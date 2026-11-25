import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { documentsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useDepartments } from '../auth/useDepartments';
import { useToast } from '../components/Toast';
import { Empty, ErrorBox, Spinner } from '../components/States';
import Pagination from '../components/Pagination';
import { PAGE_SIZES } from '../config';
import { downloadDocument } from '../utils/download';
import { fileKind, formatDate, formatSize } from '../utils/format';

export default function Documents() {
  const { user } = useAuth();
  const { nameOf } = useDepartments();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const departmentId = params.get('department_id') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sizeParam = parseInt(params.get('size') || '', 10);
  const pageSize = PAGE_SIZES.includes(sizeParam) ? sizeParam : PAGE_SIZES[0];

  // Backend chỉ cho giám đốc lọc theo phòng bất kỳ; người khác lọc phòng khác phòng mình sẽ ra rỗng.
  const canFilterDepartment = user.role === 'director';

  const [search, setSearch] = useState(q);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [facets, setFacets] = useState({ departments: [], categories: [] });
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => setSearch(q), [q]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    documentsApi
      .list({
        q: q || undefined,
        department_id: canFilterDepartment ? departmentId : undefined,
        category,
        page,
        page_size: pageSize,
      })
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, departmentId, category, page, pageSize, canFilterDepartment, reloadKey]);

  // Không có API liệt kê danh mục/phòng ban cho người dùng thường: lấy từ 100 tài liệu mới nhất mà người dùng đọc được.
  useEffect(() => {
    let alive = true;
    documentsApi
      .list({ page: 1, page_size: 100 })
      .then((res) => {
        if (!alive) return;
        const cats = new Set();
        const deps = new Set();
        res.items.forEach((d) => {
          if (d.category) cats.add(d.category);
          deps.add(d.owner_department_id);
        });
        setFacets({ categories: [...cats].sort((a, b) => a.localeCompare(b, 'vi')), departments: [...deps].sort((a, b) => a - b) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Sau khi xóa hết tài liệu ở trang cuối, lùi về trang cuối còn dữ liệu.
  useEffect(() => {
    if (data && data.items.length === 0 && data.total > 0 && page > 1) {
      update({ page: Math.ceil(data.total / pageSize) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const categoryOptions = useMemo(() => {
    const set = new Set(facets.categories);
    if (category) set.add(category);
    return [...set];
  }, [facets, category]);

  const departmentOptions = useMemo(() => {
    const set = new Set(facets.departments);
    if (departmentId) set.add(Number(departmentId));
    return [...set];
  }, [facets, departmentId]);

  const onSearch = (e) => {
    e.preventDefault();
    update({ q: search.trim() });
  };

  const onDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const hasFilter = q || departmentId || category;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Tài liệu</h1>
          <p className="muted">
            {user.role === 'director'
              ? 'Bạn đọc được tài liệu của mọi phòng ban.'
              : 'Tài liệu của phòng bạn và tài liệu được quản trị viên cấp riêng cho bạn.'}
          </p>
        </div>
        {user.can_upload && <Link to="/documents/new" className="btn btn-primary">Tải tài liệu lên</Link>}
      </header>

      <form className="toolbar" onSubmit={onSearch} role="search">
        <input
          type="search"
          className="toolbar-search"
          placeholder="Tìm theo tên hoặc mô tả"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Tìm theo tên hoặc mô tả"
        />
        <button type="submit" className="btn">Tìm</button>
        {canFilterDepartment && (
          <select value={departmentId} onChange={(e) => update({ department_id: e.target.value })} aria-label="Lọc theo phòng ban">
            <option value="">Mọi phòng ban</option>
            {departmentOptions.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
          </select>
        )}
        <select value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Lọc theo loại tài liệu">
          <option value="">Mọi loại tài liệu</option>
          {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={pageSize} onChange={(e) => update({ size: e.target.value === String(PAGE_SIZES[0]) ? '' : e.target.value })} aria-label="Số dòng mỗi trang">
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} dòng/trang</option>)}
        </select>
        {hasFilter && (
          <button type="button" className="btn btn-ghost" onClick={() => setParams(new URLSearchParams())}>Xóa bộ lọc</button>
        )}
      </form>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : data.items.length === 0 ? (
        hasFilter ? (
          <Empty title="Không có tài liệu khớp bộ lọc">Thử đổi từ khóa hoặc xóa bộ lọc.</Empty>
        ) : (
          <Empty title="Chưa có tài liệu nào">
            {user.can_upload ? 'Tải tài liệu đầu tiên lên để phòng bạn dùng chung.' : 'Khi phòng bạn có tài liệu, chúng sẽ hiện ở đây.'}
          </Empty>
        )
      ) : (
        <div className={loading ? 'is-loading' : ''}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="col-kind"><span className="sr-only">Loại tệp</span></th>
                  <th>Tài liệu</th>
                  <th>Danh mục</th>
                  <th>Phòng sở hữu</th>
                  <th className="num">Dung lượng</th>
                  <th>Ngày tạo</th>
                  <th><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d) => {
                  const kind = fileKind(d.original_filename);
                  const shared = user.role !== 'director' && d.owner_department_id !== user.department_id;
                  return (
                    <tr key={d.id}>
                      <td><span className={`tab tab-${kind.key}`}>{kind.label}</span></td>
                      <td>
                        <Link to={`/documents/${d.id}`} className="doc-title">{d.title}</Link>
                        {shared && <span className="badge">Được cấp riêng</span>}
                        {d.description && <div className="doc-desc">{d.description}</div>}
                        <div className="doc-file">{d.original_filename}</div>
                      </td>
                      <td>{d.category || <span className="muted">Chưa phân loại</span>}</td>
                      <td>{nameOf(d.owner_department_id)}</td>
                      <td className="num">{formatSize(d.size_bytes)}</td>
                      <td>{formatDate(d.created_at)}</td>
                      <td className="actions">
                        <Link to={`/documents/${d.id}`} className="btn btn-sm">Chi tiết</Link>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => onDownload(d)} disabled={downloadingId === d.id}>
                          {downloadingId === d.id ? 'Đang tải…' : 'Tải xuống'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={(p) => update({ page: p })} />
        </div>
      )}
    </div>
  );
}
