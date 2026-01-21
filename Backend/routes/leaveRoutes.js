const express = require('express');
const router = express.Router();

const leaveController = require('../controllers/leaveController');
const { protect, hrOnly } = require('../middleware/authMiddleware');

// Employee
router.post('/apply', protect, leaveController.applyLeave);

// Employee - safer modern route
router.get('/my', protect, leaveController.getMyLeaves);

// Backward compatible (frontend agar use karta ho)
router.get('/employee/:userId', protect, leaveController.getMyLeaves);

// HR
router.get('/all', protect, hrOnly, leaveController.getAllLeaves);
router.put('/update-status', protect, hrOnly, leaveController.updateLeaveStatus);

module.exports = router;
