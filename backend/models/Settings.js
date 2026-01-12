const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // General Settings
  restaurantName: {
    type: String,
    default: 'My Restaurant'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Regional Settings
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF'
  },
  timezone: {
    type: String,
    default: 'Africa/Kigali'
  },
  
  // Financial Settings
  taxRate: {
    type: Number,
    default: 18,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  serviceCharge: {
    type: Number,
    default: 10,
    min: [0, 'Service charge cannot be negative'],
    max: [100, 'Service charge cannot exceed 100%']
  },
  
  // Printing Settings
  receiptPrinterName: {
    type: String,
    trim: true
  },
  receiptPaperSize: {
    type: String,
    enum: ['80mm', '58mm'],
    default: '80mm'
  },
  kitchenPrinterName: {
    type: String,
    trim: true
  },
  autoPrintKitchen: {
    type: Boolean,
    default: true
  },
  printCustomerCopy: {
    type: Boolean,
    default: true
  },
  printKitchenCopy: {
    type: Boolean,
    default: true
  },
  
  // Notification Settings
  notifyNewOrders: {
    type: Boolean,
    default: true
  },
  notifyOrderUpdates: {
    type: Boolean,
    default: true
  },
  notifyLowStock: {
    type: Boolean,
    default: true
  },
  notifyExpiringItems: {
    type: Boolean,
    default: true
  },
  notifySystemUpdates: {
    type: Boolean,
    default: false
  },
  notifySecurityAlerts: {
    type: Boolean,
    default: true
  },
  
  // Business Hours
  businessHours: {
    type: {
      monday: {
        open: String,
        close: String,
        closed: Boolean
      },
      tuesday: {
        open: String,
        close: String,
        closed: Boolean
      },
      wednesday: {
        open: String,
        close: String,
        closed: Boolean
      },
      thursday: {
        open: String,
        close: String,
        closed: Boolean
      },
      friday: {
        open: String,
        close: String,
        closed: Boolean
      },
      saturday: {
        open: String,
        close: String,
        closed: Boolean
      },
      sunday: {
        open: String,
        close: String,
        closed: Boolean
      }
    },
    default: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '22:00', closed: false }
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
