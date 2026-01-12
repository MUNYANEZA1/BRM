const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Menu item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  image: {
    type: String,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
    min: [1, 'Preparation time must be at least 1 minute']
  },
  ingredients: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Ingredient quantity cannot be negative']
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'l', 'ml', 'pieces', 'cups', 'tbsp', 'tsp']
    }
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish', 'fish']
  }],
  tags: [{
    type: String,
    trim: true
  }],
  sortOrder: {
    type: Number,
    default: 0
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
menuItemSchema.index({ name: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1, isActive: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ tags: 1 });

// Virtual for profit margin
menuItemSchema.virtual('profitMargin').get(function() {
  if (this.cost > 0) {
    return ((this.price - this.cost) / this.price * 100).toFixed(2);
  }
  return 0;
});

// Static method to find available menu items
menuItemSchema.statics.findAvailable = function() {
  return this.find({ isAvailable: true, isActive: true })
    .populate('category', 'name')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to find menu items by category
menuItemSchema.statics.findByCategory = function(categoryId) {
  return this.find({ 
    category: categoryId, 
    isAvailable: true, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
};

// Method to check if item can be prepared (enough ingredients)
menuItemSchema.methods.canBePrepared = async function() {
  const InventoryItem = mongoose.model('InventoryItem');
  
  for (const ingredient of this.ingredients) {
    const inventoryItem = await InventoryItem.findById(ingredient.item);
    if (!inventoryItem || inventoryItem.currentStock < ingredient.quantity) {
      return false;
    }
  }
  return true;
};

// Ensure virtual fields are serialized
menuItemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);

