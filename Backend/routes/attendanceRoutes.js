const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/attendanceController');

router.post('/punch-in', protect, controller.punchIn);
router.post('/punch-out', protect, controller.punchOut);
router.post('/break-start', protect, controller.startBreak);
router.post('/break-end', protect, controller.endBreak);
router.get('/history', protect, controller.getMyHistory);

// ✅ NEW ROUTE for Dashboard Counts
router.get('/stats', protect, controller.getAttendanceStats);

module.exports = router;