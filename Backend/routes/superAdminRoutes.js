const express = require('express');
const router = express.Router();
const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/superAdminController');
const Inquiry = require('../models/Inquiry'); // Inline delete ke liye

// Sabhi routes par security apply karo
router.use(protect, superAdminOnly);

/* ================= DASHBOARD & INQUIRY ROUTES ================= */

// 1. Get Dashboard Data (Ab inquiries aur companies dono sath mein ayengi)
// ✅ UPDATED: Controller ka naya function use kar rahe hain
router.get('/dashboard-data', controller.getDashboardData);

// 2. Approve & Create Company (Provisioning)
router.post('/approve-inquiry', controller.approveInquiry);

// 3. Update Inquiry (Before Approval - Modal Edit ke liye)
router.put('/inquiry/:id', controller.updateInquiry); 

// 4. Reject/Delete Inquiry
router.delete('/inquiry/:id', async (req, res) => {
    try {
        await Inquiry.findByIdAndDelete(req.params.id);
        res.json({ message: "Inquiry Deleted Successfully" });
    } catch (e) {
        res.status(500).json({ message: "Delete Failed" });
    }
});

/* ================= COMPANY & LIMIT MANAGEMENT ================= */

// 5. HR Limit Management (Approve/Reject HR request)
// ✅ NEW: Ye frontend ke 'HR Limit Requests' tab ke liye zaroori hai
router.put('/company-limit/:companyId', controller.manageHrLimit);

// 6. Delete Active Company (Full cleanup with PDF)
router.delete('/company/:companyId', controller.deleteCompany); 

// 7. Update Active Company Details (Address, Lat, Lng and Credentials)
router.put('/company/:companyId', controller.updateCompanyDetails); 

module.exports = router;