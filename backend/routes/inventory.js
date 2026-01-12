const express = require('express');
const router = express.Router();
const {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getLowStockItems,
  getExpiringItems,
  getOutOfStockItems,
  getInventorySummary,
  bulkStockUpdate
} = require('../controllers/inventoryController');
const { 
  authenticateToken, 
  canManageInventory,
  isAdminOrManager 
} = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Inventory management routes (stock_manager, manager, admin)
router.get('/', canManageInventory, getAllInventoryItems);
router.get('/summary', canManageInventory, getInventorySummary);
router.get('/low-stock', canManageInventory, getLowStockItems);
router.get('/expiring', canManageInventory, getExpiringItems);
router.get('/out-of-stock', canManageInventory, getOutOfStockItems);
router.get('/:id', canManageInventory, getInventoryItemById);
router.post('/', canManageInventory, createInventoryItem);
router.put('/:id', canManageInventory, updateInventoryItem);
router.delete('/:id', isAdminOrManager, deleteInventoryItem);

// Stock management routes
router.patch('/:id/stock', canManageInventory, updateStock);
router.post('/bulk-stock-update', canManageInventory, bulkStockUpdate);

module.exports = router;

