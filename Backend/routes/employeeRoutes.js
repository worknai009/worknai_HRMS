const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const employeeController = require('../controllers/employeeController');
const { uploadImage, multerErrorHandler } = require('../middleware/uploadMiddleware');

// ✅ NEW: latest profile for employee dashboard
router.get('/me', protect, employeeController.getMyProfile);

router.post('/wfh-request', protect, employeeController.submitWfhRequest);

// ✅ NEW: Update profile image
router.patch('/profile-image', protect, uploadImage.single('profileImage'), employeeController.updateProfileImage, multerErrorHandler);

module.exports = router;
