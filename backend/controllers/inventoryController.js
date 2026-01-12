const InventoryItem = require('../models/InventoryItem');

// Get all inventory items
const getAllInventoryItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      search, 
      stockStatus,
      isActive 
    } = req.query;
    
    // Build filter object
    const filter = {};
    // Only filter by isActive if explicitly specified
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case 'low_stock':
          filter.$expr = { $lte: ['$currentStock', '$minimumStock'] };
          break;
        case 'out_of_stock':
          filter.currentStock = { $lte: 0 };
          break;
        case 'in_stock':
          filter.$expr = { $gt: ['$currentStock', '$minimumStock'] };
          break;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Inventory filter:', filter);
    
    const inventoryItems = await InventoryItem.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryItem.countDocuments(filter);
    
    console.log('Found inventory items:', inventoryItems.length);

    res.json({
      success: true,
      data: {
        inventoryItems,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory items'
    });
  }
};

// Get inventory item by ID
const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventoryItem = await InventoryItem.findById(id)
      .populate('createdBy', 'username firstName lastName');

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: { inventoryItem }
    });
  } catch (error) {
    console.error('Get inventory item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory item'
    });
  }
};

// Create inventory item
const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      category,
      unit,
      currentStock,
      minimumStock,
      maximumStock,
      unitCost,
      supplier,
      expiryDate,
      location
    } = req.body;

    const inventoryItem = new InventoryItem({
      name,
      description,
      sku,
      category,
      unit,
      currentStock,
      minimumStock,
      maximumStock,
      unitCost,
      supplier,
      expiryDate,
      location,
      lastRestocked: currentStock > 0 ? new Date() : undefined,
      createdBy: req.user._id
    });

    await inventoryItem.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: { inventoryItem }
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during inventory item creation'
    });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const inventoryItem = await InventoryItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { inventoryItem }
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during inventory item update'
    });
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const inventoryItem = await InventoryItem.findByIdAndDelete(id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during inventory item deletion'
    });
  }
};

// Update stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    if (!['add', 'subtract', 'set'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use add, subtract, or set'
      });
    }

    const inventoryItem = await InventoryItem.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const oldStock = inventoryItem.currentStock;
    await inventoryItem.updateStock(quantity, operation);

    // Log stock movement (you might want to create a StockMovement model for this)
    console.log(`Stock updated for ${inventoryItem.name}: ${oldStock} -> ${inventoryItem.currentStock} (${operation} ${quantity}) - Reason: ${reason || 'Not specified'}`);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { 
        inventoryItem,
        oldStock,
        newStock: inventoryItem.currentStock,
        change: inventoryItem.currentStock - oldStock
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during stock update'
    });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await InventoryItem.findLowStock();

    res.json({
      success: true,
      data: { 
        lowStockItems,
        count: lowStockItems.length
      }
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock items'
    });
  }
};

// Get expiring items
const getExpiringItems = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const expiringItems = await InventoryItem.findExpiring(parseInt(days));

    res.json({
      success: true,
      data: { 
        expiringItems,
        count: expiringItems.length,
        daysFilter: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expiring items'
    });
  }
};

// Get out of stock items
const getOutOfStockItems = async (req, res) => {
  try {
    const outOfStockItems = await InventoryItem.findOutOfStock();

    res.json({
      success: true,
      data: { 
        outOfStockItems,
        count: outOfStockItems.length
      }
    });
  } catch (error) {
    console.error('Get out of stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching out of stock items'
    });
  }
};

// Get inventory summary
const getInventorySummary = async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments({ isActive: true });
    const lowStockItems = await InventoryItem.findLowStock();
    const outOfStockItems = await InventoryItem.findOutOfStock();
    const expiringItems = await InventoryItem.findExpiring(7);

    // Calculate total inventory value
    const allItems = await InventoryItem.find({ isActive: true });
    const totalValue = allItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);

    // Get category breakdown
    const categoryBreakdown = await InventoryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          expiringCount: expiringItems.length,
          totalValue: totalValue.toFixed(2)
        },
        categoryBreakdown,
        alerts: {
          lowStock: lowStockItems.slice(0, 5), // Top 5 low stock items
          outOfStock: outOfStockItems.slice(0, 5), // Top 5 out of stock items
          expiring: expiringItems.slice(0, 5) // Top 5 expiring items
        }
      }
    });
  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory summary'
    });
  }
};

// Bulk stock update
const bulkStockUpdate = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, quantity, operation, reason }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { id, quantity, operation, reason } = update;
        
        const inventoryItem = await InventoryItem.findById(id);
        if (!inventoryItem) {
          errors.push({ id, error: 'Item not found' });
          continue;
        }

        const oldStock = inventoryItem.currentStock;
        await inventoryItem.updateStock(quantity, operation);

        results.push({
          id,
          name: inventoryItem.name,
          oldStock,
          newStock: inventoryItem.currentStock,
          operation,
          quantity,
          reason
        });
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Bulk stock update completed',
      data: {
        successful: results,
        failed: errors,
        totalProcessed: updates.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('Bulk stock update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk stock update'
    });
  }
};

module.exports = {
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
};

