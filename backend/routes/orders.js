const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  processPayment,
  getActiveOrders,
  getTodaysOrders,
  updateOrderItemStatus
} = require('../controllers/orderController');
const { 
  authenticateToken, 
  canManageOrders, 
  canHandlePayments,
  isAdminOrManager 
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Order management routes
router.get('/', canManageOrders, getAllOrders);
router.get('/active', canManageOrders, getActiveOrders);
router.get('/today', canManageOrders, getTodaysOrders);
router.get('/:id', canManageOrders, getOrderById);
router.post('/', canManageOrders, createOrder);
router.patch('/:id/status', canManageOrders, updateOrderStatus);
router.patch('/:orderId/items/:itemId/status', canManageOrders, updateOrderItemStatus);

// Payment routes (cashier, manager, admin only)
router.post('/:id/payment', canHandlePayments, processPayment);

module.exports = router;

