const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Table number is required'],
    unique: false, // Will use compound index
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Table capacity is required'],
    min: [1, 'Table capacity must be at least 1']
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'bar', 'vip', 'private'],
    default: 'indoor'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning', 'out_of_order'],
    default: 'available'
  },
  qrCode: {
    type: String,
    unique: false, // Will use compound index
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// Note: number and qrCode have compound unique indexes per company
tableSchema.index({ number: 1, company: 1 }, { unique: true });
tableSchema.index({ qrCode: 1, company: 1 }, { unique: true, sparse: true });
tableSchema.index({ status: 1 });
tableSchema.index({ location: 1 });
tableSchema.index({ isActive: 1 });

// Static method to find available tables
tableSchema.statics.findAvailable = function() {
  return this.find({ 
    status: 'available', 
    isActive: true 
  }).sort({ number: 1 });
};

// Static method to find tables by location
tableSchema.statics.findByLocation = function(location) {
  return this.find({ 
    location, 
    isActive: true 
  }).sort({ number: 1 });
};

// Method to update table status
tableSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Pre-save middleware to generate QR code
tableSchema.pre('save', function(next) {
  if (!this.qrCode && this.isNew) {
    // Generate QR code data (URL that customers will scan)
    this.qrCode = `table-${this.number}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Table', tableSchema);

