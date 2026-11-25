import { ROLE_LABELS } from '../config';

export function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

// Backend lưu giờ UTC nhưng không kèm múi giờ; thêm "Z" để trình duyệt đổi sang giờ địa phương.
function parseDate(value) {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function formatDate(value) {
  const d = parseDate(value);
  return d ? d.toLocaleDateString('vi-VN') : '';
}

export function formatDateTime(value) {
  const d = parseDate(value);
  return d ? d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';
}

export function fileExt(filename = '') {
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
}

// Nhóm loại tệp -> màu nhãn trên danh sách.
export function fileKind(filename) {
  const ext = fileExt(filename);
  if (ext === 'pdf') return { key: 'pdf', label: 'PDF' };
  if (['doc', 'docx'].includes(ext)) return { key: 'word', label: 'DOC' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { key: 'sheet', label: ext === 'csv' ? 'CSV' : 'XLS' };
  if (['ppt', 'pptx'].includes(ext)) return { key: 'slide', label: 'PPT' };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return { key: 'image', label: 'IMG' };
  return { key: 'other', label: (ext || 'FILE').slice(0, 4).toUpperCase() };
}

export function roleLabel(user) {
  if (!user) return '';
  if (user.is_admin) return 'Quản trị viên';
  return ROLE_LABELS[user.role] || user.role;
}
