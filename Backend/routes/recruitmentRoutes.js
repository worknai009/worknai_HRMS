// Backend/routes/recruitmentRoutes.js
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadTaskFiles } = require("../middleware/uploadMiddleware");
const controller = require("../controllers/recruitmentController");

/* =========================
   PUBLIC ROUTES
========================= */
router.get("/public/jobs", controller.listJobs);
router.get("/public/job/:id", controller.getJob);

router.post("/public/check-status", controller.checkApplicationStatus);
router.post("/public/respond-interview", controller.respondToInterview); // ✅ New Endpoint

// ✅ Apply with Resume Upload (files OR resume)
router.post(
  "/public/apply",
  uploadTaskFiles.fields([
    { name: "files", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  controller.createPublicApplication
);

/* =========================
   PROTECTED HR ROUTES
========================= */
router.use(protect);

// Jobs
router.post("/job", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.createJob);
router.put("/job/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateJob);
router.delete("/job/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.deleteJob);
router.get("/jobs", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.listJobs);

// Candidates (derived)
router.get("/candidates", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.listCandidates);
router.get("/candidate/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.getCandidate);

// Applications
router.get("/applications", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.listApplications);

// ✅ single application for modal/view (fix 404)
router.get("/application/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.getApplication);
router.get("/applications/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.getApplication);

// ✅ stage update (multiple supported endpoints)
router.put("/application/:id/stage", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateApplicationStage);
router.put("/application/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateApplicationStage);
router.put("/applications/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateApplicationStage);

router.put("/application/update-stage", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateApplicationStageByBody);
router.put("/applications/update-stage", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateApplicationStageByBody);

// Delete
router.delete("/application/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.deleteApplication);
router.delete("/applications/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.deleteApplication);

// ✅ Offline Hiring (No Employee auto-create)
router.post("/hire/:appId", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.hireApplicant);

// Interviews
router.post("/interview", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.scheduleInterview);
router.get("/interviews", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.listInterviews);
router.put("/interview/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.updateInterview);
router.delete("/interview/:id", authorize("Admin", "CompanyAdmin", "SuperAdmin"), controller.deleteInterview);

module.exports = router;
