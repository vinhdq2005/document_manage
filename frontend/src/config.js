// Giới hạn upload phía giao diện (backend hiện chưa kiểm tra các giới hạn này).
export const MAX_UPLOAD_MB = 20;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg',
];

// Giới hạn độ dài theo cột trong MySQL.
export const TITLE_MAX = 255;
export const CATEGORY_MAX = 100;

export const ROLE_LABELS = {
  employee: 'Nhân viên',
  department_head: 'Trưởng phòng',
  director: 'Giám đốc',
};

export const PAGE_SIZES = [10, 20, 50];
