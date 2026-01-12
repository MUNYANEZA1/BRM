const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food', 'beverage', 'alcohol', 'supplies', 'cleaning', 'other']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'l', 'ml', 'pieces', 'bottles', 'cans', 'boxes', 'packets']
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  minimumStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 10
  },
  maximumStock: {
    type: Number,
    min: [0, 'Maximum stock cannot be negative']
  },
  unitCost: {
    type: Number,
    required: [true, 'Unit cost is required'],
    min: [0, 'Unit cost cannot be negative']
  },
  supplier: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    contact: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  expiryDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date
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
inventoryItemSchema.index({ name: 1 });
inventoryItemSchema.index({ sku: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ currentStock: 1 });
inventoryItemSchema.index({ isActive: 1 });

// Virtual for stock status
inventoryItemSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) {
    return 'out_of_stock';
  } else if (this.currentStock <= this.minimumStock) {
    return 'low_stock';
  } else if (this.maximumStock && this.currentStock >= this.maximumStock) {
    return 'overstock';
  }
  return 'in_stock';
});

// Virtual for stock value
inventoryItemSchema.virtual('stockValue').get(function() {
  return (this.currentStock * this.unitCost).toFixed(2);
});

// Virtual for days until expiry
inventoryItemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to find low stock items
inventoryItemSchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minimumStock'] }
  }).sort({ currentStock: 1 });
};

// Static method to find expired or expiring items
inventoryItemSchema.statics.findExpiring = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    isActive: true,
    expiryDate: { $lte: futureDate }
  }).sort({ expiryDate: 1 });
};

// Static method to find out of stock items
inventoryItemSchema.statics.findOutOfStock = function() {
  return this.find({
    isActive: true,
    currentStock: { $lte: 0 }
  }).sort({ name: 1 });
};

// Method to update stock
inventoryItemSchema.methods.updateStock = function(quantity, operation = 'add') {
  if (operation === 'add') {
    this.currentStock += quantity;
    this.lastRestocked = new Date();
  } else if (operation === 'subtract') {
    this.currentStock = Math.max(0, this.currentStock - quantity);
  } else if (operation === 'set') {
    this.currentStock = Math.max(0, quantity);
  }
  return this.save();
};

// Pre-save middleware to generate SKU if not provided
inventoryItemSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    // Generate SKU based on name and timestamp
    const namePrefix = this.name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.sku = `${namePrefix}${timestamp}`;
  }
  next();
});

// Ensure virtual fields are serialized
inventoryItemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);

