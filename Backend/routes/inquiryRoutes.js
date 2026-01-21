const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public inquiry endpoint
router.post('/', authController.submitInquiry);

module.exports = router;
