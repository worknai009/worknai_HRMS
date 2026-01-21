const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const employeeController = require('../controllers/employeeController');

// ✅ NEW: latest profile for employee dashboard
router.get('/me', protect, employeeController.getMyProfile);

router.post('/wfh-request', protect, employeeController.submitWfhRequest);

module.exports = router;
