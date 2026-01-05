const express = require("express");
const router = express.Router();
const { protect, companyOwnerOnly } = require("../middleware/authMiddleware");
const controller = require("../controllers/companyController");
const upload = require("../middleware/uploadMiddleware"); // Image upload ke liye

router.use(protect, companyOwnerOnly);

router.get("/profile", controller.getCompanyProfile);
// Image upload support added
// ✅ NEW ROUTE FOR HR LIST
router.get("/hrs", controller.getCompanyHRs);
router.put("/update", upload.single("logo"), controller.updateCompanyProfile);

router.post("/register-hr", controller.registerHR);
router.post("/request-limit", controller.requestHrLimit); // New Route
router.get("/employees", controller.getAllEmployees); // New Route

// ✅✅ ADD THIS LINE (This was missing or not saved)
router.put("/update-user/:userId", controller.updateCompanyUser);
module.exports = router;
