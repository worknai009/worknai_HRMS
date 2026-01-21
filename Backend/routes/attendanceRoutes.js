const express = require('express');
const router = express.Router();

const { protect, hrOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/attendanceController');

// EMPLOYEE
router.post('/punch-in', protect, controller.punchIn);
router.post('/punch-out', protect, controller.punchOut);
router.post('/break-start', protect, controller.startBreak);
router.post('/break-end', protect, controller.endBreak);

router.get('/history', protect, controller.getMyHistory);
router.get('/stats', protect, controller.getAttendanceStats);

// HR / ADMIN
router.get('/all', protect, hrOnly, controller.getAllAttendance);
router.get('/history/:userId', protect, hrOnly, controller.getUserHistory);
router.post('/manual', protect, hrOnly, controller.markManualAttendance);

module.exports = router;
