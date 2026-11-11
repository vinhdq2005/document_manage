import axios from "axios";

const TOKEN_KEY = "dms_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

// Gắn JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 (token hết hạn/sai) -> xóa token và về trang đăng nhập
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes("/auth/login");
    if (err.response?.status === 401 && !isLogin) {
      tokenStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Lấy thông báo lỗi tiếng Việt từ backend (trường "detail")
export async function getErrorMessage(err) {
  const data = err.response?.data;
  // Khi gọi với responseType "blob", lỗi cũng là blob -> đọc ra chữ
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (typeof parsed.detail === "string") return parsed.detail;
    } catch {
      /* bỏ qua */
    }
    return "Có lỗi xảy ra.";
  }
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "Dữ liệu nhập chưa hợp lệ, vui lòng kiểm tra lại."; // lỗi 422
  if (!err.response) return "Không kết nối được máy chủ. Backend đã chạy chưa?";
  return "Có lỗi xảy ra.";
}

export default api;
