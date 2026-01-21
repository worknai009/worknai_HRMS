const express = require('express');
const router = express.Router();

const { uploadImage } = require('../middleware/uploadMiddleware');

const {
  loginUser,
  superAdminLogin,
  submitInquiry,
  registerEmployee,
  getActiveCompanies
} = require('../controllers/authController');

// Logins
router.post('/login', loginUser);
router.post('/super-admin-login', superAdminLogin);

// Registration
router.post('/register', uploadImage.single('image'), registerEmployee);

// Inquiry (company choose: radius + timezone + officeTiming)
router.post('/inquiry', submitInquiry);

// Helper
router.get('/companies', getActiveCompanies);

module.exports = router;
