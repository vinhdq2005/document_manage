import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useDepartments } from '../auth/useDepartments';
import Modal, { ConfirmDialog } from '../components/Modal';
import { ErrorBox, Spinner } from '../components/States';
import { Forbidden } from '../components/Guard';
import { useToast } from '../components/Toast';
import { CATEGORY_MAX, TITLE_MAX } from '../config';
import { downloadDocument } from '../utils/download';
import { fileKind, formatDateTime, formatSize } from '../utils/format';

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { nameOf } = useDepartments();
  const toast = useToast();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    documentsApi
      .get(id)
      .then((res) => alive && setDoc(res))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <Spinner />;
  if (error) {
    if (error.status === 403) return <Forbidden text={error.message} />;
    return (
      <div className="page">
        <ErrorBox message={error.status === 404 ? 'Tài liệu không tồn tại hoặc đã bị xóa.' : error.message} />
        <p><Link to="/documents">Quay lại danh sách tài liệu</Link></p>
      </div>
    );
  }

  const kind = fileKind(doc.original_filename);
  // Giao diện chỉ gợi ý; backend vẫn kiểm tra lại (người upload hoặc admin).
  const canManage = doc.uploaded_by === user.id;

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadDocument(doc);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await documentsApi.remove(doc.id);
      toast.success('Đã xóa tài liệu.');
      navigate('/documents', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
      setDeleting(false);
    }
  };

  return (
    <div className="page page-narrow">
      <p className="crumb"><Link to="/documents">Tài liệu</Link></p>
      <header className="detail-head">
        <span className={`tab tab-lg tab-${kind.key}`}>{kind.label}</span>
        <div>
          <h1>{doc.title}</h1>
          <p className="muted">{doc.original_filename}</p>
        </div>
      </header>

      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={onDownload} disabled={downloading}>
          {downloading ? 'Đang tải…' : 'Tải xuống'}
        </button>
        {canManage && (
          <>
            <button type="button" className="btn" onClick={() => setEditing(true)}>Sửa thông tin</button>
            <button type="button" className="btn btn-danger-ghost" onClick={() => setDeleting(true)}>Xóa tài liệu</button>
          </>
        )}
      </div>

      <section className="card">
        <h2 className="card-title">Mô tả</h2>
        <p className={doc.description ? 'pre' : 'muted'}>{doc.description || 'Tài liệu này chưa có mô tả.'}</p>
      </section>

      <section className="card">
        <h2 className="card-title">Thông tin tệp</h2>
        <dl className="facts">
          <div><dt>Danh mục</dt><dd>{doc.category || 'Chưa phân loại'}</dd></div>
          <div><dt>Phòng sở hữu</dt><dd>{nameOf(doc.owner_department_id)}</dd></div>
          <div><dt>Người tải lên</dt><dd>{doc.uploaded_by === user.id ? 'Bạn' : `Người dùng #${doc.uploaded_by}`}</dd></div>
          <div><dt>Dung lượng</dt><dd>{formatSize(doc.size_bytes)}</dd></div>
          <div><dt>Định dạng</dt><dd>{doc.content_type}</dd></div>
          <div><dt>Ngày tạo</dt><dd>{formatDateTime(doc.created_at)}</dd></div>
          <div><dt>Cập nhật lần cuối</dt><dd>{formatDateTime(doc.updated_at)}</dd></div>
        </dl>
      </section>

      {editing && (
        <EditModal
          doc={doc}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setDoc(updated);
            setEditing(false);
            toast.success('Đã lưu thông tin tài liệu.');
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Xóa tài liệu?"
          message={`Tài liệu "${doc.title}" sẽ biến mất khỏi danh sách của mọi người.`}
          confirmText="Xóa tài liệu"
          danger
          busy={busy}
          onConfirm={onDelete}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

function EditModal({ doc, onClose, onSaved }) {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || '');
  const [category, setCategory] = useState(doc.category || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Tiêu đề không được để trống.');
    setBusy(true);
    setError('');
    try {
      onSaved(await documentsApi.update(doc.id, { title: title.trim(), description, category }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Sửa thông tin tài liệu"
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="submit" form="edit-doc-form" className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
        </>
      }
    >
      <form id="edit-doc-form" onSubmit={onSubmit} className="form">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label className="field">
          <span>Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} required autoFocus />
        </label>
        <label className="field">
          <span>Danh mục</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={CATEGORY_MAX} />
        </label>
        <label className="field">
          <span>Mô tả</span>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <p className="hint">Chỉ sửa được thông tin mô tả. Muốn thay tệp, hãy tải lên một tài liệu mới.</p>
      </form>
    </Modal>
  );
}
