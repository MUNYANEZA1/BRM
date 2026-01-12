import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// Menu API
export const menuAPI = {
  // Categories
  getCategories: () => api.get('/menu/categories'),
  getCategory: (id) => api.get(`/menu/categories/${id}`),
  createCategory: (categoryData) => api.post('/menu/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/menu/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
  
  // Menu Items
  getMenuItems: (params) => api.get('/menu/items', { params }),
  getMenuItem: (id) => api.get(`/menu/items/${id}`),
  createMenuItem: (itemData) => api.post('/menu/items', itemData),
  updateMenuItem: (id, itemData) => api.put(`/menu/items/${id}`, itemData),
  deleteMenuItem: (id) => api.delete(`/menu/items/${id}`),
  toggleItemAvailability: (id) => api.patch(`/menu/items/${id}/toggle-availability`),
  
  // Customer Menu
  getCustomerMenu: (params) => api.get('/menu/customer', { params }),
};

// Orders API
export const ordersAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  
  // Order Items
  addOrderItem: (orderId, itemData) => api.post(`/orders/${orderId}/items`, itemData),
  updateOrderItem: (orderId, itemId, itemData) => api.put(`/orders/${orderId}/items/${itemId}`, itemData),
  removeOrderItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),
  
  // Payments
  processPayment: (orderId, paymentData) => api.post(`/orders/${orderId}/payment`, paymentData),
  getOrderPayments: (orderId) => api.get(`/orders/${orderId}/payments`),
};

// Tables API
export const tablesAPI = {
  getTables: (params) => api.get('/tables', { params }),
  getTable: (id) => api.get(`/tables/${id}`),
  createTable: (tableData) => api.post('/tables', tableData),
  updateTable: (id, tableData) => api.put(`/tables/${id}`, tableData),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  updateTableStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  getTableQRCode: (id) => api.get(`/tables/${id}/qr`),
  assignOrder: (id, orderId) => api.patch(`/tables/${id}/assign-order`, { orderId }),
  clearTable: (id) => api.patch(`/tables/${id}/clear`),
};

// Inventory API
export const inventoryAPI = {
  getInventoryItems: (params) => api.get('/inventory', { params }),
  getInventoryItem: (id) => api.get(`/inventory/${id}`),
  createInventoryItem: (itemData) => api.post('/inventory', itemData),
  updateInventoryItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  deleteInventoryItem: (id) => api.delete(`/inventory/${id}`),
  updateStock: (id, stockData) => api.patch(`/inventory/${id}/stock`, stockData),
  getLowStockItems: () => api.get('/inventory/low-stock'),
  getExpiringItems: () => api.get('/inventory/expiring'),
  
  // Stock Movements
  getStockMovements: (params) => api.get('/inventory/movements', { params }),
  createStockMovement: (movementData) => api.post('/inventory/movements', movementData),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getInventoryReport: (params) => api.get('/reports/inventory', { params }),
  getStaffReport: (params) => api.get('/reports/staff', { params }),
  getFinancialReport: (params) => api.get('/reports/financial', { params }),
  getDashboardStats: (params) => api.get('/reports/dashboard', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { 
    params, 
    responseType: 'blob' 
  }),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settingsData) => api.put('/settings', settingsData),
  getSystemInfo: () => api.get('/settings/system'),
  backupData: () => api.post('/settings/backup'),
  restoreData: (backupFile) => {
    const formData = new FormData();
    formData.append('backup', backupFile);
    return api.post('/settings/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getOrderAnalytics: (params) => api.get('/analytics/orders', { params }),
  getRevenueAnalytics: (params) => api.get('/analytics/revenue', { params }),
  getCustomerAnalytics: (params) => api.get('/analytics/customers', { params }),
  getInventoryAnalytics: (params) => api.get('/analytics/inventory', { params }),
  getStaffAnalytics: (params) => api.get('/analytics/staff', { params }),
};

export default api;

