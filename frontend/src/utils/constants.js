// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  STOCK_MANAGER: 'stock_manager',
};

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

// Payment statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
};

// Table statuses
export const TABLE_STATUSES = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
  OUT_OF_ORDER: 'out_of_order',
};

// Table locations
export const TABLE_LOCATIONS = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  BAR: 'bar',
  VIP: 'vip',
  PRIVATE: 'private',
};

// Inventory categories
export const INVENTORY_CATEGORIES = {
  FOOD: 'food',
  BEVERAGE: 'beverage',
  ALCOHOL: 'alcohol',
  SUPPLIES: 'supplies',
  CLEANING: 'cleaning',
  OTHER: 'other',
};

// Inventory units
export const INVENTORY_UNITS = {
  KG: 'kg',
  G: 'g',
  L: 'l',
  ML: 'ml',
  PIECES: 'pieces',
  BOTTLES: 'bottles',
  CANS: 'cans',
  BOXES: 'boxes',
  PACKETS: 'packets',
};

// Stock statuses
export const STOCK_STATUSES = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  OVERSTOCK: 'overstock',
};

// Order types
export const ORDER_TYPES = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
};

// Allergens
export const ALLERGENS = {
  GLUTEN: 'gluten',
  DAIRY: 'dairy',
  NUTS: 'nuts',
  EGGS: 'eggs',
  SOY: 'soy',
  SHELLFISH: 'shellfish',
  FISH: 'fish',
};

// Status colors for UI
export const STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ORDER_STATUSES.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUSES.PREPARING]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUSES.READY]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUSES.SERVED]: 'bg-green-100 text-green-800',
  [ORDER_STATUSES.PAID]: 'bg-emerald-100 text-emerald-800',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800',
  
  [TABLE_STATUSES.AVAILABLE]: 'bg-green-100 text-green-800',
  [TABLE_STATUSES.OCCUPIED]: 'bg-red-100 text-red-800',
  [TABLE_STATUSES.RESERVED]: 'bg-yellow-100 text-yellow-800',
  [TABLE_STATUSES.CLEANING]: 'bg-blue-100 text-blue-800',
  [TABLE_STATUSES.OUT_OF_ORDER]: 'bg-gray-100 text-gray-800',
  
  [STOCK_STATUSES.IN_STOCK]: 'bg-green-100 text-green-800',
  [STOCK_STATUSES.LOW_STOCK]: 'bg-yellow-100 text-yellow-800',
  [STOCK_STATUSES.OUT_OF_STOCK]: 'bg-red-100 text-red-800',
  [STOCK_STATUSES.OVERSTOCK]: 'bg-blue-100 text-blue-800',
};

// Navigation items based on user roles
export const NAVIGATION_ITEMS = {
  [USER_ROLES.ADMIN]: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Menu', href: '/menu', icon: 'Menu' },
    { name: 'Tables', href: '/tables', icon: 'Grid3x3' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Users', href: '/users', icon: 'Users' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ],
  [USER_ROLES.MANAGER]: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Menu', href: '/menu', icon: 'Menu' },
    { name: 'Tables', href: '/tables', icon: 'Grid3x3' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Users', href: '/users', icon: 'Users' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
  ],
  [USER_ROLES.CASHIER]: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Tables', href: '/tables', icon: 'Grid3x3' },
    { name: 'Payments', href: '/payments', icon: 'CreditCard' },
  ],
  [USER_ROLES.WAITER]: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Tables', href: '/tables', icon: 'Grid3x3' },
    { name: 'Menu', href: '/menu', icon: 'Menu' },
  ],
  [USER_ROLES.STOCK_MANAGER]: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Inventory', href: '/inventory', icon: 'Package' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
  ],
};

// Default pagination
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
};

