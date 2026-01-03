const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure 'uploads' directory exists (Recursive true protects against path errors)
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Storage Engine Setup
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (req, file, cb) {
    // Clean filename logic: fieldname-timestamp.extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// 2. File Type Check Logic
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: ❌ Only Images (jpeg, jpg, png, webp) are allowed!'));
  }
}

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB Limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;