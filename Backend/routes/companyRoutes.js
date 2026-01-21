const express = require('express');
const router = express.Router();
const User = require('../models/User'); // ✅ Import User for safety fallback

// ✅ Import hrOnly so HR Admins can access employee data
const { protect, companyOwnerOnly, hrOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/companyController');
const hrController = require('../controllers/hrController'); // ✅ Imported for reuse
const leaveController = require('../controllers/leaveController'); // ✅ Imported for leaves
const { uploadImage } = require('../middleware/uploadMiddleware');

// Apply Authentication to all routes
router.use(protect);

/* =========================================================================
   1. SENSITIVE ROUTES (Owner Only)
   Settings, HR Management, Limits
   ========================================================================= */
// Only the Owner should see/manage HRs and Company Settings
router.get('/hrs', companyOwnerOnly, controller.getCompanyHRs);
router.post('/register-hr', companyOwnerOnly, controller.registerHR);
router.post('/request-limit', companyOwnerOnly, controller.requestHrLimit);
router.put('/update', companyOwnerOnly, uploadImage.single('logo'), controller.updateCompanyProfile);

/* =========================================================================
   2. EMPLOYEE MANAGEMENT ROUTES (HR & Owner)
   Admins need access to these to manage employees
   ========================================================================= */

// HR needs to see company profile (for policies/timezones)
router.get('/profile', hrOnly, controller.getCompanyProfile);
router.get('/dashboard', hrOnly, controller.getCompanyProfile); // ✅ Added Alias (Fixes 404)

// List all employees
router.get('/employees', hrOnly, controller.getAllEmployees);

// ✅ SAFETY FALLBACK FUNCTION
// Defined separately to avoid SyntaxError
const fallbackGetEmployee = async (req, res) => {
  try {
    const userId = req.params.userId || req.params.id;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Security check: Ensure user belongs to the same company
    if (req.user.companyId && user.companyId && String(req.user.companyId) !== String(user.companyId)) {
      return res.status(403).json({ message: 'Unauthorized: Employee belongs to another company' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get Employee Error:', error);
    return res.status(500).json({ message: 'Server error fetching employee' });
  }
};

// ✅ ASSIGN CONTROLLER OR FALLBACK
// This logic checks if the controller has the function; if not, it uses the fallback above.
const getSingleEmployee = controller.getCompanyUser || controller.getEmployeeById || fallbackGetEmployee;

// Routes for viewing a specific employee (supports both URL patterns used by frontend)
router.get('/employee/:userId', hrOnly, getSingleEmployee);
router.get('/employees/:userId', hrOnly, getSingleEmployee);

// Update HR/Employee user
// We use hrOnly so HR can update employee details
router.put('/update-user/:userId', hrOnly, controller.updateCompanyUser);
router.put('/employee/:userId', hrOnly, controller.updateCompanyUser);
router.put('/employees/:userId', hrOnly, controller.updateCompanyUser);

// ✅ Approve Employee
router.post('/employee/approve', hrOnly, controller.approveEmployee);

/* =========================================================================
   3. PAYROLL & LEAVES (Fixing 404 Errors)
   ========================================================================= */

// ✅ Payroll Routes (Reusing logic from hrController)
router.get('/payroll/:userId', hrOnly, hrController.getPayrollStats);
router.get('/payroll/salary-slip/:userId', hrOnly, hrController.generateSalarySlip);

// ✅ Leave Routes (For Employee View)
router.get('/leaves/employee/:userId', hrOnly, leaveController.getEmployeeLeaves);

module.exports = router;