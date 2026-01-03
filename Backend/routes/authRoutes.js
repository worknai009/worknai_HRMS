const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  loginUser,
  superAdminLogin,
  submitInquiry,
  registerEmployee,
  getActiveCompanies
} = require('../controllers/authController');

// 1. Logins
router.post('/login', loginUser);
router.post('/super-admin-login', superAdminLogin);

// 2. Registration & Onboarding
// Note: 'image' is the field name for profile photo upload
router.post('/register', upload.single('image'), registerEmployee);
router.post('/inquiry', submitInquiry);

// 3. Helpers
router.get('/companies', getActiveCompanies); // For dropdown on Register Page

module.exports = router;