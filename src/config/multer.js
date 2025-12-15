const multer = require('multer');
const path = require('path');

/**
 * Configure Multer for file uploads
 * Store files in memory buffer (for Cloudinary upload)
 */
const storage = multer.memoryStorage();

/**
 * File filter function to validate file types
 * @param {Object} req - Express request
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Allowed image MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/jpg'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

/**
 * Multer upload configuration for single file
 */
const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

/**
 * Multer upload configuration for multiple files
 * Field name: 'images' (can accept 3-10 files)
 */
const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size per file
  }
});

/**
 * Middleware to handle single file upload
 * Usage: router.post('/upload', uploadSingle.single('image'), handler)
 */
const handleSingleUpload = uploadSingle.single('image');

/**
 * Middleware to handle multiple files upload (3-10 images)
 * Usage: router.post('/upload', uploadMultiple.array('images', 10), handler)
 * 
 * Expected from client:
 * - Field name: 'images'
 * - Min files: 3
 * - Max files: 10
 */
const handleMultipleUpload = uploadMultiple.array('images', 10);

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleSingleUpload,
  handleMultipleUpload
};
