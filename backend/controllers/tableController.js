const Table = require('../models/Table');
const QRCode = require('qrcode');

// Get all tables
const getAllTables = async (req, res) => {
  try {
    const { location, status, isActive } = req.query;
    
    // Build filter object
    const filter = {};
    // Only add isActive filter if explicitly provided
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    } else {
      // Default: show only active tables
      filter.isActive = true;
    }
    if (location) filter.location = location;
    if (status) filter.status = status;

    const tables = await Table.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ number: 1 });

    res.json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    console.error('Get all tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tables'
    });
  }
};

// Get table by ID
const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findById(id)
      .populate('createdBy', 'username firstName lastName');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      data: { table }
    });
  } catch (error) {
    console.error('Get table by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching table'
    });
  }
};

// Create table
const createTable = async (req, res) => {
  try {
    const { number, capacity, location, notes } = req.body;

    const table = new Table({
      number,
      capacity,
      location,
      notes,
      createdBy: req.user._id
    });

    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Create table error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
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
      message: 'Server error during table creation'
    });
  }
};

// Update table
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, capacity, location, notes, isActive, status } = req.body;

    const table = await Table.findByIdAndUpdate(
      id,
      { number, capacity, location, notes, isActive, status },
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Update table error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
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
      message: 'Server error during table update'
    });
  }
};

// Delete table
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndDelete(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during table deletion'
    });
  }
};

// Update table status
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    await table.updateStatus(status);

    res.json({
      success: true,
      message: 'Table status updated successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during table status update'
    });
  }
};

// Get available tables
const getAvailableTables = async (req, res) => {
  try {
    const { location } = req.query;
    
    let tables;
    if (location) {
      tables = await Table.findByLocation(location).where({ status: 'available' });
    } else {
      tables = await Table.findAvailable();
    }

    res.json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available tables'
    });
  }
};

// Get table QR code
const getTableQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Generate QR code URL for customer ordering
    // Use a simpler URL format that's easier to scan
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const qrCodeUrl = `${baseUrl}/?table=${encodeURIComponent(table.qrCode)}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      success: true,
      data: { 
        table: {
          id: table._id,
          number: table.number,
          qrCode: table.qrCode,
          qrCodeUrl
        },
        qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Get table QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating QR code'
    });
  }
};

// Get tables summary
const getTablesSummary = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments({ isActive: true });
    
    // Get status breakdown
    const statusBreakdown = await Table.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get location breakdown
    const locationBreakdown = await Table.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $eq: ['$status', 'available'] }, 1, 0]
            }
          },
          occupied: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalTables,
        statusBreakdown,
        locationBreakdown
      }
    });
  } catch (error) {
    console.error('Get tables summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tables summary'
    });
  }
};

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  getAvailableTables,
  getTableQRCode,
  getTablesSummary
};

