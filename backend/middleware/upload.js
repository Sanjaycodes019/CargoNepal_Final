const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the absolute path to the uploads folder at the project root
const UPLOAD_PATH = path.join(process.cwd(), 'uploads');

// Ensure directory exists synchronously at startup/runtime
if (!fs.existsSync(UPLOAD_PATH)) {
    fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

/**
 * Storage configuration
 * Uses process.cwd() for Render compatibility
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    // Generates a clean filename: timestamp-random-originalextension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter: only images
 */
function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
});

module.exports = upload;
