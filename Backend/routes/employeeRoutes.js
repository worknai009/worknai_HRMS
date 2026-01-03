const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// ✅ FIXED: You must destructure 'protect' from the middleware object
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/employee/wfh-request
// ✅ FIXED: Changed authMiddleware to protect
router.post('/wfh-request', protect, employeeController.submitWfhRequest);

module.exports = router;