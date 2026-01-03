// routes/inquiryRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public route – No auth required
// POST /api/public-inquiry
router.post('/', authController.submitInquiry);

module.exports = router;
