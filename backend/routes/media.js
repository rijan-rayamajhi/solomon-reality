const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageKit = require('imagekit');
const { authenticate, requireAdmin } = require('../middleware/auth');
require('dotenv').config();

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Configure Multer for memory storage (no temp files)
const storage = multer.memoryStorage();

// File size limits: 10GB for videos (to support 10-minute 4K videos), 100MB for images (4K photos)
const getFileSizeLimit = (mimetype) => {
  if (mimetype && mimetype.startsWith('video/')) {
    return 10 * 1024 * 1024 * 1024; // 10GB for videos
  }
  return 100 * 1024 * 1024; // 100MB for images
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB (covers both 4K videos and photos)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});


/**
 * Upload single file to ImageKit
 */
router.post('/upload', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const folder = isVideo ? 'solomon-realty/videos' : 'solomon-realty/images';

    // Check file size limits (ImageKit supports up to 100MB for videos, 10MB for images)
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxSize = isVideo ? maxVideoSize : maxImageSize;

    if (req.file.size > maxSize) {
      const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
      return res.status(413).json({ 
        error: `File too large. File size: ${sizeMB}MB. Maximum allowed: ${maxMB}MB for ${isVideo ? 'videos' : 'images'}. Please compress your file or use a smaller file.` 
      });
    }

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer,            // Directly upload from buffer
      fileName: req.file.originalname,  // Preserve original name
      folder: folder,                   // Folder organization
      useUniqueFileName: true,
    });

    // Build response matching exact specification
    res.status(200).json({
      success: true,
      secure_url: result.url,
      public_id: result.fileId,
      format: result.fileType,
      resource_type: isVideo ? 'video' : 'image',
      file_size: req.file.size,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error('ImageKit upload failed:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
      error: err.message || 'Failed to upload file'
    });
  }
});

/**
 * Upload multiple files to ImageKit
 */
router.post('/upload/multiple', authenticate, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Validate file sizes before upload
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = [];

    req.files.forEach((file, index) => {
      const isVideo = file.mimetype.startsWith('video/');
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      if (file.size > maxSize) {
        invalidFiles.push({
          index,
          name: file.originalname,
          size: file.size,
          maxSize,
          type: isVideo ? 'video' : 'image'
        });
      }
    });

    if (invalidFiles.length > 0) {
      const firstInvalid = invalidFiles[0];
      const sizeMB = (firstInvalid.size / (1024 * 1024)).toFixed(2);
      const maxMB = (firstInvalid.maxSize / (1024 * 1024)).toFixed(0);
      return res.status(413).json({
        error: `File too large: ${firstInvalid.name} (${sizeMB}MB). Maximum allowed: ${maxMB}MB for ${firstInvalid.type}. Please compress your file or use a smaller file.`,
        invalidFiles: invalidFiles.map(f => ({
          name: f.name,
          size: f.size,
          maxSize: f.maxSize
        }))
      });
    }

    // Upload all files in parallel
    const uploads = await Promise.all(
      req.files.map(async (file) => {
        const isVideo = file.mimetype.startsWith('video/');
        const folder = isVideo ? 'solomon-realty/videos' : 'solomon-realty/images';

        const result = await imagekit.upload({
          file: file.buffer,
          fileName: file.originalname,
          folder: folder,
          useUniqueFileName: true,
        });
        
        return {
          secure_url: result.url,
          public_id: result.fileId,
          format: result.fileType,
          resource_type: isVideo ? 'video' : 'image',
          file_size: file.size,
          width: result.width,
          height: result.height,
        };
      })
    );

    res.status(200).json({
      success: true,
      uploads: uploads
    });
  } catch (err) {
    console.error('Multiple upload error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Multiple upload failed',
      error: err.message || 'Failed to upload files'
    });
  }
});

/**
 * Get optimized URL for an existing ImageKit file
 * Useful for generating thumbnails or optimized versions
 */
router.post('/optimize', authenticate, requireAdmin, async (req, res) => {
  try {
    const { url, width, height, quality = 'auto', format = 'auto', crop } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Build ImageKit transformation URL
    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    if (crop) transformations.push(`c-${crop}`);
    if (quality) transformations.push(`q-${quality}`);
    if (format) transformations.push(`f-${format}`);
    
    const separator = url.includes('?') ? '&' : '?';
    const optimizedUrl = transformations.length > 0 
      ? `${url}${separator}tr=${transformations.join(',')}` 
      : url;

    res.json({
      original_url: url,
      optimized_url: optimizedUrl,
      transformations: { width, height, quality, format, crop }
    });
  } catch (error) {
    console.error('Optimize URL error:', error);
    res.status(500).json({ error: 'Failed to generate optimized URL' });
  }
});

/**
 * Delete file from ImageKit
 */
router.delete('/:fileId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    await imagekit.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully',
      fileId: fileId
    });
  } catch (error) {
    console.error('Delete file error:', error);
    
    // ImageKit returns 404 if file not found, which is fine
    if (error.message && error.message.includes('not found')) {
      return res.json({
        success: true,
        message: 'File not found (may have been already deleted)',
        fileId: req.params.fileId
      });
    }

    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
