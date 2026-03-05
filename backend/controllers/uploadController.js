const uploadImage = async (req, res) => {
  try {
    // Check if an image file was provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Convert file buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // For now, we return the base64 image
    // In production, you would store it in cloud storage (Cloudinary, AWS S3, etc.)
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: base64Image,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Convert file buffer to base64
    const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        fileUrl: base64File,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  uploadDocument
};
