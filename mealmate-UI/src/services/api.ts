import axios from 'axios';

// TODO: Cấu hình Axios interceptor:
// - Base URL trỏ đến backend API
// - Tự động gắn JWT token vào header Authorization cho mọi request
// - Xử lý lỗi 401 (token hết hạn) → redirect về trang login
// - Xử lý lỗi chung (500, 403, v.v.)

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự động gắn token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: xử lý lỗi xác thực
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // TODO: Token hết hạn hoặc không hợp lệ → xóa token & redirect về login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
