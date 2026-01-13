import axios from 'axios';

// Production-ready API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://brm-backend-hak4.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ================= AUTH API =================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) =>
    api.put('/auth/change-password', passwordData),
};

// ================= USERS API =================
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) =>
    api.patch(`/users/${id}/toggle-status`),
};

// ================= MENU API =================
export const menuAPI = {
  getCategories: () => api.get('/menu/categories'),
  getCategory: (id) => api.get(`/menu/categories/${id}`),
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (id, data) =>
    api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id) =>
    api.delete(`/menu/categories/${id}`),

  getMenuItems: (params) => api.get('/menu/items', { params }),
  getMenuItem: (id) => api.get(`/menu/items/${id}`),
  createMenuItem: (data) => api.post('/menu/items', data),
  updateMenuItem: (id, data) =>
    api.put(`/menu/items/${id}`, data),
  deleteMenuItem: (id) =>
    api.delete(`/menu/items/${id}`),
  toggleItemAvailability: (id) =>
    api.patch(`/menu/items/${id}/toggle-availability`),

  getCustomerMenu: (params) =>
    api.get('/menu/customer', { params }),
};

// ================= ORDERS API =================
export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  updateOrder: (id, data) =>
    api.put(`/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  updateOrderStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) =>
    api.patch(`/orders/${id}/cancel`),

  addOrderItem: (orderId, data) =>
    api.post(`/orders/${orderId}/items`, data),
  updateOrderItem: (orderId, itemId, data) =>
    api.put(`/orders/${orderId}/items/${itemId}`, data),
  removeOrderItem: (orderId, itemId) =>
    api.delete(`/orders/${orderId}/items/${itemId}`),

  processPayment: (orderId, data) =>
    api.post(`/orders/${orderId}/payment`, data),
  getOrderPayments: (orderId) =>
    api.get(`/orders/${orderId}/payments`),
};

// ================= TABLES API =================
export const tablesAPI = {
  getTables: (params) => api.get('/tables', { params }),
  getTable: (id) => api.get(`/tables/${id}`),
  createTable: (data) => api.post('/tables', data),
  updateTable: (id, data) =>
    api.put(`/tables/${id}`, data),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  updateTableStatus: (id, status) =>
    api.patch(`/tables/${id}/status`, { status }),
  getTableQRCode: (id) => api.get(`/tables/${id}/qr`),
  assignOrder: (id, orderId) =>
    api.patch(`/tables/${id}/assign-order`, { orderId }),
  clearTable: (id) => api.patch(`/tables/${id}/clear`),
};

// ================= INVENTORY API =================
export const inventoryAPI = {
  getInventoryItems: (params) =>
    api.get('/inventory', { params }),
  getInventoryItem: (id) =>
    api.get(`/inventory/${id}`),
  createInventoryItem: (data) =>
    api.post('/inventory', data),
  updateInventoryItem: (id, data) =>
    api.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) =>
    api.delete(`/inventory/${id}`),
  updateStock: (id, data) =>
    api.patch(`/inventory/${id}/stock`, data),
  getLowStockItems: () =>
    api.get('/inventory/low-stock'),
  getExpiringItems: () =>
    api.get('/inventory/expiring'),

  getStockMovements: (params) =>
    api.get('/inventory/movements', { params }),
  createStockMovement: (data) =>
    api.post('/inventory/movements', data),
};

// ================= REPORTS API =================
export const reportsAPI = {
  getSalesReport: (params) =>
    api.get('/reports/sales', { params }),
  getInventoryReport: (params) =>
    api.get('/reports/inventory', { params }),
  getStaffReport: (params) =>
    api.get('/reports/staff', { params }),
  getFinancialReport: (params) =>
    api.get('/reports/financial', { params }),
  getDashboardStats: (params) =>
    api.get('/reports/dashboard', { params }),
  exportReport: (type, params) =>
    api.get(`/reports/export/${type}`, {
      params,
      responseType: 'blob',
    }),
};

// ================= SETTINGS API =================
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  getSystemInfo: () => api.get('/settings/system'),
  backupData: () => api.post('/settings/backup'),
  restoreData: (file) => {
    const formData = new FormData();
    formData.append('backup', file);
    return api.post('/settings/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ================= NOTIFICATIONS API =================
export const notificationsAPI = {
  getNotifications: (params) =>
    api.get('/notifications', { params }),
  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
};

// ================= UPLOAD API =================
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ================= ANALYTICS API =================
export const analyticsAPI = {
  getOrderAnalytics: (params) =>
    api.get('/analytics/orders', { params }),
  getRevenueAnalytics: (params) =>
    api.get('/analytics/revenue', { params }),
  getCustomerAnalytics: (params) =>
    api.get('/analytics/customers', { params }),
  getInventoryAnalytics: (params) =>
    api.get('/analytics/inventory', { params }),
  getStaffAnalytics: (params) =>
    api.get('/analytics/staff', { params }),
};

export default api;
