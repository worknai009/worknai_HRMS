const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/authMiddleware');
const hrController = require('../controllers/hrController');

/* ================= EMPLOYEE MANAGEMENT ================= */
// Get all employees (Active & Pending)
router.get('/employees', protect, hrOnly, hrController.getAllEmployees);

// Update specific employee details
router.put('/employee/:userId', protect, hrOnly, hrController.updateEmployeeDetails);

// Approve employee (Set Salary & Joining Date)
router.post('/employee/approve', protect, hrOnly, hrController.approveEmployee);

// Delete employee (Generate PDF Report & Hard Delete)
router.delete('/employee/:userId', protect, hrOnly, hrController.deleteEmployee);


/* ================= ATTENDANCE & HISTORY ================= */
// Manual Attendance (HR Override)
router.post('/attendance/manual', protect, hrOnly, hrController.addManualAttendance);

// Get Employee History (Kundali)
router.get('/history/:userId', protect, hrOnly, hrController.getEmployeeHistory);


/* ================= HOLIDAYS ================= */
// Mark a new holiday
router.post('/holiday', protect, hrOnly, hrController.markHoliday);


/* ================= PAYROLL & SALARY SLIP ================= */
// Calculate Payroll Stats
router.get('/payroll/:userId', protect, hrOnly, hrController.getPayrollStats);

// Generate & Download Salary Slip PDF
router.get('/payroll/salary-slip/:userId', protect, hrOnly, hrController.generateSalarySlip);


/* ================= WORK FROM HOME (WFH) ================= */
// Manage WFH Requests (Approve/Reject logic if separate from leaves)
router.post('/wfh/manage', protect, hrOnly, hrController.manageWfhRequest);

module.exports = router;