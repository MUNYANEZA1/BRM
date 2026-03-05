const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory (suitable for serverless)

const fileFilter = (req, file, cb) => {
  // For images
  if (req.path.includes('image')) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
  // For documents
  else {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image
router.post('/image', authenticateToken, upload.single('image'), uploadController.uploadImage);

// Upload document
router.post('/document', authenticateToken, upload.single('document'), uploadController.uploadDocument);

module.exports = router;
