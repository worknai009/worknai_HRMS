const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// ✅ Fix: Ab authMiddleware sahi se import hoga kyunki humne file fix kar di hai
const { protect, hrOnly } = require('../middleware/authMiddleware');

// 1. Apply Leave (Employee)
router.post('/apply', protect, leaveController.applyLeave);

// 2. Get All Leaves (HR Only)
router.get('/all', protect, hrOnly, leaveController.getAllLeaves);

// 3. Get My Leaves (Employee)
router.get('/employee/:userId', protect, leaveController.getMyLeaves);

// 4. Update Status (HR Only)
router.put('/update-status', protect, hrOnly, leaveController.updateLeaveStatus);

module.exports = router;