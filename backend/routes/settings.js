const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getSystemInfo
} = require('../controllers/settingsController');
const { authenticateToken, isAdminOrManager } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Settings routes
router.get('/', getSettings);
router.put('/', isAdminOrManager, updateSettings);

// System info
router.get('/system', getSystemInfo);

module.exports = router;
