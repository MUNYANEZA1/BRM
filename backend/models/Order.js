const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  },
  preparedAt: Date,
  servedAt: Date
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  customer: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery'],
    default: 'dine_in'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
    sparse: true
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  estimatedPrepTime: {
    type: Number, // in minutes
    default: 30
  },
  actualPrepTime: {
    type: Number // in minutes
  },
  confirmedAt: Date,
  readyAt: Date,
  servedAt: Date,
  paidAt: Date,
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ table: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ waiter: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber && this.isNew) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    this.orderNumber = `ORD${dateStr}${timeStr}`;
  }
  next();
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.total = this.subtotal + this.tax - this.discount;
  }
  next();
});

// Virtual for order duration
orderSchema.virtual('orderDuration').get(function() {
  if (this.servedAt && this.createdAt) {
    return Math.round((this.servedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Static method to find active orders
orderSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
  }).populate('table waiter')
    .sort({ createdAt: 1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('table waiter cashier')
    .sort({ createdAt: -1 });
};

// Static method to find today's orders
orderSchema.statics.findTodaysOrders = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    createdAt: { $gte: today, $lt: tomorrow }
  }).populate('table waiter cashier')
    .sort({ createdAt: -1 });
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  
  const now = new Date();
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'ready':
      this.readyAt = now;
      if (this.confirmedAt) {
        this.actualPrepTime = Math.round((now - this.confirmedAt) / (1000 * 60));
      }
      break;
    case 'served':
      this.servedAt = now;
      break;
    case 'paid':
      this.paidAt = now;
      this.paymentStatus = 'paid';
      if (userId) this.cashier = userId;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }
  
  return this.save();
};

// Method to add payment
orderSchema.methods.addPayment = function(method, amount, userId) {
  this.paymentMethod = method;
  
  if (amount >= this.total) {
    this.paymentStatus = 'paid';
    this.paidAt = new Date();
  } else {
    this.paymentStatus = 'partial';
  }
  
  if (userId) this.cashier = userId;
  return this.save();
};

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);

