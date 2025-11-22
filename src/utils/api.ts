import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (data: { email: string; password: string; fullName: string }) =>
    apiClient.post('/auth/signup', data),
  login: (data: { email: string; password: string }) => apiClient.post('/auth/login', data),
  requestOTP: (email: string) => apiClient.post('/auth/request-otp', { email }),
  verifyOTP: (data: { email: string; otp: string; newPassword: string }) =>
    apiClient.post('/auth/verify-otp', data),
  getProfile: () => apiClient.get('/auth/profile'),
};

export const productsAPI = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: number, data: any) => apiClient.put(`/products/${id}`, data),
};

export const receiptsAPI = {
  getAll: (params?: any) => apiClient.get('/receipts', { params }),
  getById: (id: number) => apiClient.get(`/receipts/${id}`),
  create: (data: any) => apiClient.post('/receipts', data),
  validate: (id: number) => apiClient.post(`/receipts/${id}/validate`),
  updateItem: (id: number, itemId: number, data: any) =>
    apiClient.put(`/receipts/${id}/items/${itemId}`, data),
};

export const deliveriesAPI = {
  getAll: (params?: any) => apiClient.get('/deliveries', { params }),
  getById: (id: number) => apiClient.get(`/deliveries/${id}`),
  create: (data: any) => apiClient.post('/deliveries', data),
  validate: (id: number) => apiClient.post(`/deliveries/${id}/validate`),
  updateItem: (id: number, itemId: number, data: any) =>
    apiClient.put(`/deliveries/${id}/items/${itemId}`, data),
};

export const transfersAPI = {
  getAll: (params?: any) => apiClient.get('/transfers', { params }),
  create: (data: any) => apiClient.post('/transfers', data),
  validate: (id: number) => apiClient.post(`/transfers/${id}/validate`),
};

export const adjustmentsAPI = {
  getAll: (params?: any) => apiClient.get('/adjustments', { params }),
  create: (data: any) => apiClient.post('/adjustments', data),
  validate: (id: number) => apiClient.post(`/adjustments/${id}/validate`),
};

export const dashboardAPI = {
  getKPIs: () => apiClient.get('/dashboard/kpis'),
  getRecentOperations: () => apiClient.get('/dashboard/recent-operations'),
  getStockByWarehouse: () => apiClient.get('/dashboard/stock-by-warehouse'),
};

export const warehouseAPI = {
  getAll: () => apiClient.get('/warehouse'),
  create: (data: any) => apiClient.post('/warehouse', data),
};

export default apiClient;
