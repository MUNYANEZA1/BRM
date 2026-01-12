const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus, 
      table, 
      waiter,
      startDate,
      endDate 
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (table) filter.table = table;
    if (waiter) filter.waiter = waiter;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(filter)
      .populate('table', 'number location')
      .populate('waiter', 'username firstName lastName')
      .populate('cashier', 'username firstName lastName')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('table', 'number location capacity')
      .populate('waiter', 'username firstName lastName')
      .populate('cashier', 'username firstName lastName')
      .populate('items.menuItem', 'name description price image')
      .populate('createdBy', 'username firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      tableId,
      items,
      customer,
      orderType = 'dine_in',
      notes,
      discount = 0
    } = req.body;

    // Validate table
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (table.status === 'out_of_order') {
      return res.status(400).json({
        success: false,
        message: 'Table is out of order'
      });
    }

    // Validate and process order items
    const processedItems = [];
    let subtotal = 0;
    let estimatedPrepTime = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item not found: ${item.menuItemId}`
        });
      }

      if (!menuItem.isAvailable || !menuItem.isActive) {
        return res.status(400).json({
          success: false,
          message: `Menu item is not available: ${menuItem.name}`
        });
      }

      // Check if item can be prepared (enough ingredients)
      const canPrepare = await menuItem.canBePrepared();
      if (!canPrepare) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ingredients for: ${menuItem.name}`
        });
      }

      const totalPrice = menuItem.price * item.quantity;
      subtotal += totalPrice;
      estimatedPrepTime = Math.max(estimatedPrepTime, menuItem.preparationTime);

      processedItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // Calculate tax (assuming 18% VAT)
    const tax = subtotal * 0.18;
    const total = subtotal + tax - discount;

    // Create order
    const order = new Order({
      table: tableId,
      customer,
      items: processedItems,
      subtotal,
      tax,
      discount,
      total,
      orderType,
      notes,
      estimatedPrepTime,
      waiter: req.user._id,
      createdBy: req.user._id
    });

    await order.save();

    // Update table status
    if (orderType === 'dine_in') {
      table.status = 'occupied';
      await table.save();
    }

    // Populate order for response
    await order.populate([
      { path: 'table', select: 'number location' },
      { path: 'waiter', select: 'username firstName lastName' },
      { path: 'items.menuItem', select: 'name price' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Create order error:', error);
    
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
      message: 'Server error during order creation'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle cancellation
    if (status === 'cancelled') {
      if (!cancellationReason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required'
        });
      }
      order.cancellationReason = cancellationReason;
    }

    // Update order status
    await order.updateStatus(status, req.user._id);

    // If order is served or cancelled, make table available
    if ((status === 'served' || status === 'cancelled') && order.orderType === 'dine_in') {
      const table = await Table.findById(order.table);
      if (table) {
        table.status = 'available';
        await table.save();
      }
    }

    // If order is confirmed, deduct ingredients from inventory
    if (status === 'confirmed') {
      await deductIngredients(order);
    }

    await order.populate([
      { path: 'table', select: 'number location' },
      { path: 'waiter', select: 'username firstName lastName' },
      { path: 'cashier', select: 'username firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during order status update'
    });
  }
};

// Process payment
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, amountPaid } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    if (amountPaid < order.total) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient payment amount'
      });
    }

    // Process payment
    await order.addPayment(paymentMethod, amountPaid, req.user._id);

    // Update order status to paid if fully paid
    if (order.paymentStatus === 'paid') {
      await order.updateStatus('paid', req.user._id);
    }

    await order.populate([
      { path: 'table', select: 'number location' },
      { path: 'cashier', select: 'username firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { 
        order,
        change: amountPaid - order.total
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment processing'
    });
  }
};

// Get active orders (for kitchen/bar display)
const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.findActive();

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active orders'
    });
  }
};

// Get today's orders
const getTodaysOrders = async (req, res) => {
  try {
    const orders = await Order.findTodaysOrders();

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get today\'s orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching today\'s orders'
    });
  }
};

// Update order item status
const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    item.status = status;
    
    const now = new Date();
    if (status === 'ready') {
      item.preparedAt = now;
    } else if (status === 'served') {
      item.servedAt = now;
    }

    // Check if all items are ready/served to update order status
    const allItemsReady = order.items.every(item => item.status === 'ready');
    const allItemsServed = order.items.every(item => item.status === 'served');

    if (allItemsReady && order.status === 'preparing') {
      order.status = 'ready';
      order.readyAt = now;
    } else if (allItemsServed && order.status === 'ready') {
      order.status = 'served';
      order.servedAt = now;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order item status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during order item status update'
    });
  }
};

// Helper function to deduct ingredients from inventory
const deductIngredients = async (order) => {
  try {
    for (const orderItem of order.items) {
      const menuItem = await MenuItem.findById(orderItem.menuItem).populate('ingredients.item');
      
      if (menuItem && menuItem.ingredients) {
        for (const ingredient of menuItem.ingredients) {
          const totalQuantityNeeded = ingredient.quantity * orderItem.quantity;
          const inventoryItem = await InventoryItem.findById(ingredient.item._id);
          
          if (inventoryItem) {
            await inventoryItem.updateStock(totalQuantityNeeded, 'subtract');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error deducting ingredients:', error);
    // Don't throw error to prevent order creation failure
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  processPayment,
  getActiveOrders,
  getTodaysOrders,
  updateOrderItemStatus
};

