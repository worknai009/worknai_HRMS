// Backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { ensureDir } = require('../utils/fileSecurity');

// Separate folders (SaaS safe: public static serve mat karo; download via secure route)
const imageDir = path.resolve(process.cwd(), 'uploads/images');
const taskDir  = path.resolve(process.cwd(), 'uploads/tasks');

ensureDir(imageDir);
ensureDir(taskDir);

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

const safeFilename = (originalname) => {
  const ext = path.extname(originalname || '').toLowerCase();
  return `${uuid()}${ext}`;
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => cb(null, safeFilename(file.originalname))
});

const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, taskDir),
  filename: (req, file, cb) => cb(null, safeFilename(file.originalname))
});

const allowImage = (file) => {
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  return allowedExt.includes(ext) && allowedMime.includes(file.mimetype);
};

const allowTaskFile = (file) => {
  // Only PDF + ZIP (virus risk reduce)
  const allowedExt = ['.pdf', '.zip'];
  const allowedMime = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip'
  ];
  const ext = path.extname(file.originalname || '').toLowerCase();
  return allowedExt.includes(ext) && allowedMime.includes(file.mimetype);
};

// ✅ Images: 5MB
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    try {
      if (!allowImage(file)) return cb(new Error('Only images (jpg, png, webp) allowed'));
      cb(null, true);
    } catch (e) {
      cb(new Error('Invalid image upload'));
    }
  }
});

// ✅ Task files: 20MB each, max 5 files
const uploadTaskFiles = multer({
  storage: taskStorage,
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    try {
      if (!allowTaskFile(file)) return cb(new Error('Only PDF/ZIP allowed'));
      cb(null, true);
    } catch (e) {
      cb(new Error('Invalid task file upload'));
    }
  }
});

// ✅ Nice error handler (use after routes)
const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  // Multer limits
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Please upload smaller file.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ message: 'Too many files. Max allowed is 5.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'Unexpected file field.' });
  }

  // Our custom errors
  return res.status(400).json({ message: err.message || 'Upload failed' });
};

module.exports = {
  uploadImage,
  uploadTaskFiles,
  multerErrorHandler
};
