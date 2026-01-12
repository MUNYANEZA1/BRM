const Settings = require('../models/Settings');

// Get settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await Settings.create({
        restaurantName: 'My Restaurant',
        currency: 'RWF',
        timezone: 'Africa/Kigali',
        taxRate: 18,
        serviceCharge: 10,
        createdBy: req.user._id
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const {
      restaurantName,
      phone,
      address,
      email,
      currency,
      timezone,
      taxRate,
      serviceCharge,
      receiptPrinterName,
      receiptPaperSize,
      kitchenPrinterName,
      autoPrintKitchen,
      printCustomerCopy,
      printKitchenCopy,
      notifyNewOrders,
      notifyOrderUpdates,
      notifyLowStock,
      notifyExpiringItems,
      notifySystemUpdates,
      notifySecurityAlerts,
      businessHours
    } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if they don't exist
      settings = await Settings.create({
        restaurantName: restaurantName || 'My Restaurant',
        phone,
        address,
        email,
        currency: currency || 'RWF',
        timezone: timezone || 'Africa/Kigali',
        taxRate: taxRate || 18,
        serviceCharge: serviceCharge || 10,
        receiptPrinterName,
        receiptPaperSize,
        kitchenPrinterName,
        autoPrintKitchen,
        printCustomerCopy,
        printKitchenCopy,
        notifyNewOrders,
        notifyOrderUpdates,
        notifyLowStock,
        notifyExpiringItems,
        notifySystemUpdates,
        notifySecurityAlerts,
        businessHours,
        createdBy: req.user._id,
        lastUpdatedBy: req.user._id
      });
    } else {
      // Update existing settings
      if (restaurantName !== undefined) settings.restaurantName = restaurantName;
      if (phone !== undefined) settings.phone = phone;
      if (address !== undefined) settings.address = address;
      if (email !== undefined) settings.email = email;
      if (currency !== undefined) settings.currency = currency;
      if (timezone !== undefined) settings.timezone = timezone;
      if (taxRate !== undefined) settings.taxRate = taxRate;
      if (serviceCharge !== undefined) settings.serviceCharge = serviceCharge;
      if (receiptPrinterName !== undefined) settings.receiptPrinterName = receiptPrinterName;
      if (receiptPaperSize !== undefined) settings.receiptPaperSize = receiptPaperSize;
      if (kitchenPrinterName !== undefined) settings.kitchenPrinterName = kitchenPrinterName;
      if (autoPrintKitchen !== undefined) settings.autoPrintKitchen = autoPrintKitchen;
      if (printCustomerCopy !== undefined) settings.printCustomerCopy = printCustomerCopy;
      if (printKitchenCopy !== undefined) settings.printKitchenCopy = printKitchenCopy;
      if (notifyNewOrders !== undefined) settings.notifyNewOrders = notifyNewOrders;
      if (notifyOrderUpdates !== undefined) settings.notifyOrderUpdates = notifyOrderUpdates;
      if (notifyLowStock !== undefined) settings.notifyLowStock = notifyLowStock;
      if (notifyExpiringItems !== undefined) settings.notifyExpiringItems = notifyExpiringItems;
      if (notifySystemUpdates !== undefined) settings.notifySystemUpdates = notifySystemUpdates;
      if (notifySecurityAlerts !== undefined) settings.notifySecurityAlerts = notifySecurityAlerts;
      if (businessHours !== undefined) settings.businessHours = businessHours;
      
      settings.lastUpdatedBy = req.user._id;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
};

// Get system info
const getSystemInfo = async (req, res) => {
  try {
    const systemInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date(),
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('Get system info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system info'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSystemInfo
};
