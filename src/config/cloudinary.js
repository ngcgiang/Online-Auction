const cloudinary = require('cloudinary').v2;

/**
 * Initialize Cloudinary configuration
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a single file to Cloudinary
 * @param {Object} file - Express file object from multer
 * @param {string} folder - Cloudinary folder path (optional)
 * @returns {Promise<Object>} - { secure_url, public_id }
 */
const uploadToCloudinary = async (file, folder = 'online-auction/products') => {
  if (!file) {
    throw new Error('No file provided');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        // Optional: Add quality/transformation
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            url: result.url
          });
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

/**
 * Upload multiple files to Cloudinary in parallel
 * @param {Array} files - Array of Express file objects from multer
 * @param {string} folder - Cloudinary folder path (optional)
 * @returns {Promise<Array>} - Array of { secure_url, public_id }
 */
const uploadMultipleToCloudinary = async (files, folder = 'online-auction/products') => {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new Error('Public ID is required');
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} - Array of deletion results
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    throw new Error('No public IDs provided');
  }

  try {
    const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId));
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Error deleting multiple files from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary
};
