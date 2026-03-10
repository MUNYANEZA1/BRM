const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Add user to request object
    req.user = user;
    // token may not always include company (older tokens), so fall back to DB value
    req.user.company = decoded.company || user.company;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user is admin or manager
const isAdminOrManager = authorizeRoles('admin', 'manager', 'owner');

// Middleware to check if user is admin only
const isAdmin = authorizeRoles('admin', 'owner');

// Middleware to check if user can manage orders (waiter, cashier, manager, admin, owner)
const canManageOrders = authorizeRoles('waiter', 'cashier', 'manager', 'admin', 'owner');

// Middleware to check if user can manage inventory (stock_manager, manager, admin, owner)
const canManageInventory = authorizeRoles('stock_manager', 'manager', 'admin', 'owner');

// Middleware to check if user can handle payments (cashier, manager, admin, owner)
const canHandlePayments = authorizeRoles('cashier', 'manager', 'admin', 'owner');

module.exports = {
  authenticateToken,
  authorizeRoles,
  isAdminOrManager,
  isAdmin,
  canManageOrders,
  canManageInventory,
  canHandlePayments
};

