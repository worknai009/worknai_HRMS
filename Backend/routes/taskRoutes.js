// Backend/routes/taskRoutes.js
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadTaskFiles } = require('../middleware/uploadMiddleware');

const {
  assignTask,
  getMyTasks,
  getAllTasks,
  completeTask,
  updateTaskStatus, // ✅ Imported
  reviewTask,
  downloadTaskAttachment
} = require('../controllers/taskController');

// HR assign task (PDF/ZIP + Link)
router.post(
  '/assign',
  protect,
  authorize('Admin', 'CompanyAdmin', 'SuperAdmin'),
  uploadTaskFiles.array('files', 5),
  assignTask
);

// HR get all company tasks
router.get(
  '/all',
  protect,
  authorize('Admin', 'CompanyAdmin', 'SuperAdmin'),
  getAllTasks
);

// Employee my tasks
router.get('/my-tasks', protect, getMyTasks);

// ✅ FIX: Route for "Start Task" button
router.put('/update-status/:taskId', protect, updateTaskStatus);

// Employee submit task work
router.put(
  '/complete/:taskId',
  protect,
  uploadTaskFiles.array('files', 5),
  completeTask
);

// HR review task
router.put(
  '/review/:taskId',
  protect,
  authorize('Admin', 'CompanyAdmin', 'SuperAdmin'),
  reviewTask
);

// Secure download
router.get(
  '/download/:taskId',
  protect,
  downloadTaskAttachment
);

module.exports = router;