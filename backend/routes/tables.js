const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  getAvailableTables,
  getTableQRCode,
  getTablesSummary
} = require('../controllers/tableController');
const { 
  authenticateToken, 
  isAdminOrManager,
  canManageOrders 
} = require('../middleware/auth');

// Protected routes
router.use(authenticateToken);

// Table management routes
router.get('/', canManageOrders, getAllTables);
router.get('/available', canManageOrders, getAvailableTables);
router.get('/summary', isAdminOrManager, getTablesSummary);
router.get('/:id/qr', canManageOrders, getTableQRCode);
router.get('/:id', canManageOrders, getTableById);
router.post('/', isAdminOrManager, createTable);
router.put('/:id', isAdminOrManager, updateTable);
router.delete('/:id', isAdminOrManager, deleteTable);
router.patch('/:id/status', canManageOrders, updateTableStatus);

module.exports = router;

