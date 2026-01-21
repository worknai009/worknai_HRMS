const express = require('express');
const router = express.Router();

const { protect, hrOnly } = require('../middleware/authMiddleware');
const hrController = require('../controllers/hrController');

// Employees
router.get('/employees', protect, hrOnly, hrController.getAllEmployees);
router.put('/employee/:userId', protect, hrOnly, hrController.updateEmployeeDetails);
router.post('/employee/approve', protect, hrOnly, hrController.approveEmployee);
router.delete('/employee/:userId', protect, hrOnly, hrController.deleteEmployee);

// Attendance
router.post('/attendance/manual', protect, hrOnly, hrController.addManualAttendance);
router.get('/history/:userId', protect, hrOnly, hrController.getEmployeeHistory);

// Holidays
router.post('/holiday', protect, hrOnly, hrController.markHoliday);

// Payroll
router.get('/payroll/:userId', protect, hrOnly, hrController.getPayrollStats);
router.get('/payroll/salary-slip/:userId', protect, hrOnly, hrController.generateSalarySlip);

// WFH
router.post('/wfh/manage', protect, hrOnly, hrController.manageWfhRequest);

module.exports = router;
