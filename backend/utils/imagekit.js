const ImageKit = require('imagekit');
require('dotenv').config();

// Initialize ImageKit client (singleton pattern)
let imagekitInstance = null;

/**
 * Get ImageKit client instance
 * @returns {ImageKit} ImageKit client
 */
function getImageKitClient() {
  if (!imagekitInstance) {
    imagekitInstance = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekitInstance;
}

/**
 * Generate optimized ImageKit URL with transformations
 * @param {string} url - Original ImageKit URL
 * @param {object} options - Transformation options
 * @param {number} options.width - Width in pixels
 * @param {number} options.height - Height in pixels
 * @param {string} options.quality - Quality: 'auto', '80', '90', etc.
 * @param {string} options.format - Format: 'auto', 'webp', 'jpg', 'png', etc.
 * @param {string} options.crop - Crop mode: 'maintain_ratio', 'force', etc.
 * @param {string} options.focus - Focus: 'auto', 'center', 'top', etc.
 * @returns {string} Optimized URL
 */
function getOptimizedUrl(url, options = {}) {
  if (!url || typeof url !== 'string') return url;
  
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = false,
    focus = 'auto',
    blur = null,
    brightness = null,
    contrast = null,
    saturation = null,
  } = options;

  // Build transformation parameters
  const transformations = [];
  
  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  if (crop) transformations.push(`c-${crop}`);
  if (focus && focus !== 'auto') transformations.push(`fo-${focus}`);
  if (quality) transformations.push(`q-${quality}`);
  if (format) transformations.push(`f-${format}`);
  if (blur) transformations.push(`bl-${blur}`);
  if (brightness) transformations.push(`br-${brightness}`);
  if (contrast) transformations.push(`co-${contrast}`);
  if (saturation) transformations.push(`sa-${saturation}`);

  if (transformations.length === 0) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}tr=${transformations.join(',')}`;
}

/**
 * Extract fileId or filePath from ImageKit URL
 * @param {string} url - ImageKit URL
 * @returns {string|null} File path or null
 */
function extractFilePathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname; // Returns the file path
  } catch (error) {
    console.error('Error extracting file path from URL:', url, error);
    return null;
  }
}

/**
 * Get thumbnail URL for an image
 * @param {string} url - Original ImageKit URL
 * @param {number} size - Thumbnail size (width/height)
 * @returns {string} Thumbnail URL
 */
function getThumbnailUrl(url, size = 300) {
  return getOptimizedUrl(url, {
    width: size,
    height: size,
    quality: '80',
    format: 'auto',
    crop: 'maintain_ratio',
    focus: 'auto'
  });
}

/**
 * Get responsive image URLs for different screen sizes
 * @param {string} url - Original ImageKit URL
 * @returns {object} Responsive URLs
 */
function getResponsiveUrls(url) {
  return {
    thumbnail: getOptimizedUrl(url, { width: 150, height: 150, quality: '70', format: 'auto' }),
    small: getOptimizedUrl(url, { width: 400, height: 400, quality: '80', format: 'auto' }),
    medium: getOptimizedUrl(url, { width: 800, height: 800, quality: '85', format: 'auto' }),
    large: getOptimizedUrl(url, { width: 1200, height: 1200, quality: '90', format: 'auto' }),
    original: url
  };
}

/**
 * Delete file from ImageKit
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<object>} Deletion result
 */
async function deleteFile(fileId) {
  try {
    const imagekit = getImageKitClient();
    await imagekit.deleteFile(fileId);
    return { success: true, fileId };
  } catch (error) {
    // If file not found, consider it already deleted
    if (error.message && error.message.includes('not found')) {
      return { success: true, fileId, message: 'File not found (already deleted)' };
    }
    throw error;
  }
}

/**
 * Delete multiple files from ImageKit
 * @param {string[]} fileIds - Array of ImageKit file IDs
 * @returns {Promise<object>} Deletion results
 */
async function deleteFiles(fileIds) {
  const results = [];
  
  for (const fileId of fileIds) {
    try {
      const result = await deleteFile(fileId);
      results.push({ fileId, ...result });
    } catch (error) {
      results.push({ 
        fileId, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return {
    total: fileIds.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Upload file to ImageKit
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder path
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Upload result
 */
async function uploadFile(fileBuffer, fileName, folder, options = {}) {
  const imagekit = getImageKitClient();
  
  const uploadOptions = {
    file: fileBuffer,
    fileName: fileName,
    folder: folder,
    useUniqueFileName: true,
    overwriteFile: false,
    ...options
  };

  return await imagekit.upload(uploadOptions);
}

module.exports = {
  getImageKitClient,
  getOptimizedUrl,
  extractFilePathFromUrl,
  getThumbnailUrl,
  getResponsiveUrls,
  deleteFile,
  deleteFiles,
  uploadFile
};

