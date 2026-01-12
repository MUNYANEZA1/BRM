const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCustomerMenu,
  toggleAvailability
} = require('../controllers/menuController');
const { authenticateToken, isAdminOrManager } = require('../middleware/auth');

// Public routes (for customer menu)
router.get('/customer', getCustomerMenu);

// Protected routes
router.use(authenticateToken);

// Category routes (admin/manager only)
router.get('/categories', getAllCategories);
router.post('/categories', isAdminOrManager, createCategory);
router.put('/categories/:id', isAdminOrManager, updateCategory);
router.delete('/categories/:id', isAdminOrManager, deleteCategory);

// Menu item routes
router.get('/items', getAllMenuItems);
router.get('/items/:id', getMenuItemById);
router.post('/items', isAdminOrManager, createMenuItem);
router.put('/items/:id', isAdminOrManager, updateMenuItem);
router.delete('/items/:id', isAdminOrManager, deleteMenuItem);
router.patch('/items/:id/toggle-availability', isAdminOrManager, toggleAvailability);

module.exports = router;

