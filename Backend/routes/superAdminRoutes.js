const express = require('express');
const router = express.Router();

const { protect, superAdminOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/superAdminController');
const Inquiry = require('../models/Inquiry');

router.use(protect, superAdminOnly);

// Dashboard
router.get('/dashboard-data', controller.getDashboardData);

// Inquiry provisioning
router.post('/approve-inquiry', controller.approveInquiry);
router.put('/inquiry/:id', controller.updateInquiry);

// Delete inquiry
router.delete('/inquiry/:id', async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Inquiry Deleted Successfully" });
  } catch (e) {
    res.status(500).json({ message: "Delete Failed" });
  }
});

// Company limit / delete / update
router.put('/company-limit/:companyId', controller.manageHrLimit);
router.delete('/company/:companyId', controller.deleteCompany);
router.put('/company/:companyId', controller.updateCompanyDetails);

module.exports = router;
