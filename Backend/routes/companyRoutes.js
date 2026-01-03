const express = require('express');
const router = express.Router();
const { protect, companyOwnerOnly } = require('../middleware/authMiddleware');
const controller = require('../controllers/companyController');
const upload = require('../middleware/uploadMiddleware'); // Image upload ke liye

router.use(protect, companyOwnerOnly);

router.get('/profile', controller.getCompanyProfile);
// Image upload support added
router.put('/update', upload.single('logo'), controller.updateCompanyProfile);

router.post('/register-hr', controller.registerHR);
router.post('/request-limit', controller.requestHrLimit); // New Route
router.get('/employees', controller.getAllEmployees); // New Route

module.exports = router;