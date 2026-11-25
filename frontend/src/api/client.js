const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'dms_token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* bỏ qua */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* bỏ qua */ }
  },
};

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// FastAPI trả `detail` là chuỗi (HTTPException) hoặc mảng (lỗi 422).
function extractMessage(data, status) {
  const detail = data && data.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        const field = Array.isArray(e.loc) ? e.loc.filter((p) => p !== 'body').join('.') : '';
        return field ? `${field}: ${e.msg}` : e.msg;
      })
      .join('; ');
  }
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu.';
  if (status >= 500) return 'Máy chủ gặp lỗi. Hãy thử lại sau.';
  return 'Yêu cầu không thành công.';
}

function buildUrl(path, params) {
  let url = BASE_URL + path;
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, v);
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

export async function request(path, { method = 'GET', params, json, auth = true, blob = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(buildUrl(path, params), { method, headers, body });
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Hãy kiểm tra backend đã chạy và địa chỉ API trong .env.', 0);
  }

  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* không phải JSON */ }
    if (res.status === 401 && auth && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(extractMessage(data, res.status), res.status);
  }
  return blob ? res.blob() : res.json();
}

// Upload dùng XMLHttpRequest để có tiến độ. Trả về { promise, abort }.
export function uploadForm(path, formData, onProgress) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open('POST', buildUrl(path));
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* không phải JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      if (xhr.status === 401 && unauthorizedHandler) unauthorizedHandler();
      return reject(new ApiError(extractMessage(data, xhr.status), xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('Không kết nối được tới máy chủ trong lúc tải lên.', 0));
    xhr.onabort = () => reject(new ApiError('Đã hủy tải lên.', -1));
    xhr.send(formData);
  });
  return { promise, abort: () => xhr.abort() };
}
