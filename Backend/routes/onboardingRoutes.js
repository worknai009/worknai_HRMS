const express = require('express');
const router = express.Router();

const { protect, hrOnly } = require('../middleware/authMiddleware');
const onboardingController = require('../controllers/onboardingController');

router.use(protect);

/* ================= HR: Templates ================= */
router.get('/templates', hrOnly, onboardingController.listTemplates);
router.post('/templates', hrOnly, onboardingController.createTemplate);
router.get('/templates/:id', hrOnly, onboardingController.getTemplate);
router.put('/templates/:id', hrOnly, onboardingController.updateTemplate);
router.delete('/templates/:id', hrOnly, onboardingController.deleteTemplate);

/* ================= HR: Assignments ================= */
router.get('/assignments', hrOnly, onboardingController.listAssignments);
router.post('/assignments', hrOnly, onboardingController.assignTemplateToUser);
router.get('/assignments/:id', hrOnly, onboardingController.getAssignment);
router.patch('/assignments/:id/item', hrOnly, onboardingController.updateAssignmentItem);

/* ================= Employee: My Onboarding ================= */
router.get('/my', onboardingController.getMyOnboarding);
router.patch('/my/item', onboardingController.updateMyOnboardingItem);

module.exports = router;
