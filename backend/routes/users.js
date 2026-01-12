const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  toggleUserStatus
} = require('../controllers/userController');
const { authenticateToken, isAdminOrManager, isAdmin } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Routes accessible by admin and manager
router.get('/', isAdminOrManager, getAllUsers);
router.get('/role/:role', isAdminOrManager, getUsersByRole);
router.get('/:id', isAdminOrManager, getUserById);
router.post('/', isAdminOrManager, createUser);
router.put('/:id', isAdminOrManager, updateUser);
router.patch('/:id/toggle-status', isAdminOrManager, toggleUserStatus);

// Routes accessible by admin only
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;

