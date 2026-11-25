import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsApi } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { ALLOWED_EXTENSIONS, CATEGORY_MAX, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, TITLE_MAX } from '../config';
import { fileExt, formatSize } from '../utils/format';

function validateFile(file) {
  if (!ALLOWED_EXTENSIONS.includes(fileExt(file.name))) {
    return `Định dạng .${fileExt(file.name) || '?'} chưa được hỗ trợ. Chấp nhận: ${ALLOWED_EXTENSIONS.join(', ')}.`;
  }
  if (file.size === 0) return 'Tệp rỗng, hãy chọn tệp khác.';
  if (file.size > MAX_UPLOAD_BYTES) return `Tệp nặng ${formatSize(file.size)}, vượt giới hạn ${MAX_UPLOAD_MB} MB.`;
  return '';
}

export default function Upload() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = (f) => {
    if (!f) return;
    const problem = validateFile(f);
    setFileError(problem);
    setFile(problem ? null : f);
    if (!problem && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, TITLE_MAX));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) return setFileError('Hãy chọn một tệp để tải lên.');
    if (!title.trim()) return setError('Tiêu đề không được để trống.');

    setBusy(true);
    setProgress(0);
    const task = documentsApi.upload({ title: title.trim(), description: description.trim(), category: category.trim() }, file, setProgress);
    abortRef.current = task.abort;
    try {
      const created = await task.promise;
      toast.success('Đã tải tài liệu lên.');
      navigate(`/documents/${created.id}`, { replace: true });
    } catch (err) {
      if (err.status !== -1) setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <p className="crumb"><Link to="/documents">Tài liệu</Link></p>
      <header className="page-head">
        <div>
          <h1>Tải tài liệu lên</h1>
          <p className="muted">Tài liệu sẽ thuộc về {user.department_name || 'phòng của bạn'} và mọi người trong phòng đều đọc được.</p>
        </div>
      </header>

      <form className="card form" onSubmit={onSubmit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="field">
          <span>Tệp tài liệu</span>
          <label
            className={`dropzone ${dragOver ? 'over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) pickFile(e.dataTransfer.files?.[0]); }}
          >
            <input
              type="file"
              accept={ALLOWED_EXTENSIONS.map((x) => `.${x}`).join(',')}
              onChange={(e) => pickFile(e.target.files?.[0])}
              disabled={busy}
            />
            {file ? (
              <span><strong>{file.name}</strong><br /><span className="muted">{formatSize(file.size)} – bấm để chọn tệp khác</span></span>
            ) : (
              <span><strong>Kéo tệp vào đây hoặc bấm để chọn</strong><br /><span className="muted">Tối đa {MAX_UPLOAD_MB} MB; {ALLOWED_EXTENSIONS.join(', ')}</span></span>
            )}
          </label>
          {fileError && <span className="field-error" role="alert">{fileError}</span>}
        </div>

        <label className="field">
          <span>Tiêu đề</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} required disabled={busy} />
        </label>
        <label className="field">
          <span>Danh mục (không bắt buộc)</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={CATEGORY_MAX} placeholder="Ví dụ: Hợp đồng, Quy trình, Biên bản" disabled={busy} />
        </label>
        <label className="field">
          <span>Mô tả (không bắt buộc)</span>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
        </label>

        {busy && (
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress < 100 ? `Đang tải lên ${progress}%` : 'Đang lưu tài liệu…'}</span>
          </div>
        )}

        <div className="form-actions">
          {busy ? (
            <button type="button" className="btn" onClick={() => abortRef.current?.()}>Hủy tải lên</button>
          ) : (
            <Link to="/documents" className="btn">Quay lại</Link>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>Tải lên</button>
        </div>
      </form>
    </div>
  );
}
