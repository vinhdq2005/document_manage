export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleString("vi-VN");
}

export const ROLE_LABELS = {
  employee: "Nhân viên",
  department_head: "Trưởng phòng",
  director: "Giám đốc",
};
