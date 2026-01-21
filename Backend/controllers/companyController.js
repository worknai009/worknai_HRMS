// Backend/controllers/companyController.js
const Company = require('../models/Company');
const User = require('../models/User');

/* ---------------- Helpers ---------------- */
const isHrRole = (role) => ['Admin', 'CompanyAdmin', 'SuperAdmin'].includes(role);

const safeJsonParse = (val, fallback = null) => {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  if (typeof val !== 'string') return fallback;
  const t = val.trim();
  if (!t) return fallback;
  try { return JSON.parse(t); } catch { return fallback; }
};

const clampStr = (s, max = 300) => {
  if (s == null) return '';
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};

const guardTenant = (req, companyId) => {
  if (req.user?.role === 'SuperAdmin') return true;
  if (!req.user?.companyId) return false;
  return String(req.user.companyId) === String(companyId);
};

/* ================= 1) GET COMPANY DASHBOARD / PROFILE ================= */
const getCompanyProfile = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = req.user.role === 'SuperAdmin'
      ? (req.query.companyId || req.body.companyId || null)
      : req.user.companyId;

    if (!companyId) return res.status(404).json({ message: "Company not linked." });

    const company = await Company.findById(companyId).lean();
    if (!company) return res.status(404).json({ message: "Company not found" });

    if (!guardTenant(req, companyId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Parallel queries for speed
    const [employees, hrs, totalEmployees, totalHRs] = await Promise.all([
      User.find({ companyId, role: 'Employee', status: 'Active', isDeleted: { $ne: true } })
        .select('-password -faceDescriptor -faceDescriptorVec')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.find({ companyId, role: 'Admin', status: 'Active', isDeleted: { $ne: true } })
        .select('-password -faceDescriptor -faceDescriptorVec')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      User.countDocuments({ companyId, role: 'Employee', isDeleted: { $ne: true } }),
      User.countDocuments({ companyId, role: 'Admin', isDeleted: { $ne: true } })
    ]);

    res.status(200).json({
      company,
      employees,
      hrs,
      stats: { totalEmployees, totalHRs }
    });
  } catch (error) {
    console.error("getCompanyProfile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ================= 2) UPDATE COMPANY PROFILE / SETTINGS ================= */
const updateCompanyProfile = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = req.user.role === 'SuperAdmin'
      ? (req.query.companyId || req.body.companyId || null)
      : req.user.companyId;

    if (!companyId) return res.status(400).json({ message: "Company ID missing" });

    if (!guardTenant(req, companyId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = { ...(req.body || {}) };

    // ✅ file upload (logo)
    if (req.file) {
      updates.logo = `uploads/images/${req.file.filename}`;
    }

    // ✅ parse nested fields (when sent via FormData)
    if (typeof updates.location === 'string') updates.location = safeJsonParse(updates.location, {});
    if (typeof updates.officeTiming === 'string') updates.officeTiming = safeJsonParse(updates.officeTiming, {});
    if (typeof updates.attendancePolicy === 'string') updates.attendancePolicy = safeJsonParse(updates.attendancePolicy, {});

    // 🔒 Security: block fields (SuperAdmin only)
    delete updates.status;
    delete updates.maxHrAdmins;
    delete updates.hrLimitRequest;

    // ✅ sanitize officeTiming
    if (updates.officeTiming && typeof updates.officeTiming === 'object') {
      const ot = updates.officeTiming;
      if (ot.startTime) ot.startTime = String(ot.startTime).slice(0, 5);
      if (ot.endTime) ot.endTime = String(ot.endTime).slice(0, 5);

      // allow any IANA timezone string (no hard enum here)
      if (ot.timeZone) ot.timeZone = String(ot.timeZone).trim();

      if (ot.workingHours != null) {
        const wh = Number(ot.workingHours);
        ot.workingHours = Number.isFinite(wh) && wh > 0 ? wh : 9;
      }
      updates.officeTiming = ot;
    }

    // ✅ sanitize location
    if (updates.location && typeof updates.location === 'object') {
      const loc = updates.location;
      if (loc.address != null) loc.address = clampStr(loc.address, 300);
      if (loc.lat != null) loc.lat = Number(loc.lat);
      if (loc.lng != null) loc.lng = Number(loc.lng);

      // radius (meters) can only be updated by SuperAdmin ideally,
      // but we allow company owner too if you want - here we block unless SuperAdmin
      if (loc.radius != null && req.user.role !== 'SuperAdmin') {
        delete loc.radius; // keep safe
      } else if (loc.radius != null) {
        const r = Number(loc.radius);
        loc.radius = Number.isFinite(r) && r >= 100 ? r : 3000;
      }
      updates.location = loc;
    }

    // ✅ sanitize attendancePolicy
    if (updates.attendancePolicy && typeof updates.attendancePolicy === 'object') {
      const p = updates.attendancePolicy;

      if (typeof p.requireGps === 'boolean') { /* ok */ }
      if (typeof p.requireFace === 'boolean') { /* ok */ }

      // allowedMethods sanitize
      if (Array.isArray(p.allowedMethods)) {
        const allowed = ['GPS_FACE', 'FACE_ONLY', 'QR_FACE', 'WIFI_FACE', 'IP_FACE', 'MANUAL_HR'];
        p.allowedMethods = p.allowedMethods.filter((m) => allowed.includes(m));
        if (!p.allowedMethods.length) p.allowedMethods = ['GPS_FACE', 'MANUAL_HR'];
      }

      if (typeof p.qrSecret === 'string') p.qrSecret = p.qrSecret.trim();
      if (Array.isArray(p.allowedWifiSSIDs)) p.allowedWifiSSIDs = p.allowedWifiSSIDs.map(String).slice(0, 50);
      if (Array.isArray(p.allowedIpRanges)) p.allowedIpRanges = p.allowedIpRanges.map(String).slice(0, 50);
      if (typeof p.requireDeviceBinding === 'boolean') { /* ok */ }

      updates.attendancePolicy = p;
    }

    const company = await Company.findByIdAndUpdate(companyId, updates, { new: true });
    res.status(200).json({ message: "Profile & Settings Updated ✅", company });
  } catch (error) {
    console.error("updateCompanyProfile error:", error);
    res.status(500).json({ message: "Update Failed" });
  }
};

/* ================= 3) REGISTER HR (LIMIT SAFE) ================= */
const registerHR = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ message: "Company missing" });

    const { name, email, mobile, password, designation } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "name, email, password required" });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Check current HR count
    const currentHRs = await User.countDocuments({ companyId, role: 'Admin', isDeleted: { $ne: true } });

    if (company.maxHrAdmins && currentHRs >= company.maxHrAdmins) {
      return res.status(400).json({ message: `HR Limit Reached (${company.maxHrAdmins}). Request upgrade from Dashboard.` });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "User email already exists" });

    await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      mobile: mobile ? String(mobile).trim() : "0000000000",
      password: String(password),
      role: 'Admin',
      companyId,
      designation: designation ? String(designation) : "HR Manager",
      status: 'Active',
      isApproved: true,
      createdBy: req.user._id
    });

    res.status(201).json({ message: "HR Created Successfully ✅" });
  } catch (error) {
    console.error("registerHR error:", error);
    res.status(500).json({ message: "Error creating HR" });
  }
};

/* ================= 4) REQUEST HR LIMIT UPGRADE ================= */
const requestHrLimit = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });
    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ message: "Company missing" });

    await Company.findByIdAndUpdate(companyId, { hrLimitRequest: 'Pending' });
    res.json({ message: "Request sent to Super Admin. Please wait for approval." });
  } catch (e) {
    console.error("requestHrLimit error:", e);
    res.status(500).json({ message: "Request Failed" });
  }
};

/* ================= 5) GET ALL EMPLOYEES (Company Admin) ================= */
const getAllEmployees = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = req.user.role === 'SuperAdmin'
      ? (req.query.companyId || req.body.companyId || null)
      : req.user.companyId;

    if (!companyId) return res.status(400).json({ message: "Company missing" });
    if (!guardTenant(req, companyId)) return res.status(403).json({ message: "Access denied" });

    const employees = await User.find({ companyId, role: 'Employee', isDeleted: { $ne: true } })
      .select('-password -faceDescriptor -faceDescriptorVec')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (e) {
    console.error("getAllEmployees error:", e);
    res.status(500).json({ message: "Fetch Failed" });
  }
};

/* ================= 6) GET ALL HRs (Company wise) ================= */
const getCompanyHRs = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const companyId = req.user.role === 'SuperAdmin'
      ? (req.query.companyId || req.body.companyId || null)
      : req.user.companyId;

    if (!companyId) return res.status(400).json({ message: "Company missing" });
    if (!guardTenant(req, companyId)) return res.status(403).json({ message: "Access denied" });

    const hrs = await User.find({ companyId, role: 'Admin', isDeleted: { $ne: true } })
      .select('-password -faceDescriptor -faceDescriptorVec')
      .sort({ createdAt: -1 });

    res.json(hrs);
  } catch (e) {
    console.error("getCompanyHRs error:", e);
    res.status(500).json({ message: "Fetch Failed" });
  }
};

/* ================= 7) UPDATE USER (HR/Employee) + optional password reset ================= */
const updateCompanyUser = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId } = req.params;
    const { name, email, mobile, password, designation } = req.body || {};

    const userToCheck = await User.findById(userId);
    if (!userToCheck || userToCheck.isDeleted) return res.status(404).json({ message: "User not found" });

    if (!guardTenant(req, userToCheck.companyId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (name) userToCheck.name = String(name).trim();
    if (email) userToCheck.email = String(email).toLowerCase().trim();
    if (mobile) userToCheck.mobile = String(mobile).trim();
    if (designation) userToCheck.designation = String(designation).trim();

    // Password reset (optional)
    if (password && String(password).trim().length >= 6) {
      userToCheck.password = String(password);
    }

    await userToCheck.save();

    res.json({
      message: "User details updated successfully",
      user: userToCheck.toJSON()
    });
  } catch (error) {
    console.error("updateCompanyUser error:", error);
    res.status(500).json({ message: "Update Failed" });
  }
};

const approveEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: "Employee ID required" });

    // Validate HR access
    const actorCompanyId = req.user.role === 'SuperAdmin' ? null : req.user.companyId;

    const user = await User.findById(employeeId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure within same company (unless SuperAdmin)
    if (actorCompanyId && String(user.companyId) !== String(actorCompanyId)) {
      return res.status(403).json({ message: "Unauthorized access to this employee" });
    }

    user.status = 'Active';
    user.isApproved = true;
    await user.save();

    res.json({ message: "Employee approved successfully", user });
  } catch (error) {
    console.error("approveEmployee error:", error);
    res.status(500).json({ message: "Approval Failed" });
  }
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  registerHR,
  requestHrLimit,
  getAllEmployees,
  getCompanyHRs,
  updateCompanyUser,
  approveEmployee
};
