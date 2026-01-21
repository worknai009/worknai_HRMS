const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const User = require('../models/User');
const Company = require('../models/Company');
const Inquiry = require('../models/Inquiry');

/* ================= JWT HELPER ================= */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const parseDescriptorToFloat32 = (raw) => {
  if (!raw) return null;
  let arr = raw;
  try {
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === 'string') {
      const t = raw.trim();
      arr = t.startsWith('[') ? JSON.parse(t) : t.split(',').map(Number);
    }
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length < 32) return null;
  const f = new Float32Array(arr.map(Number));
  return f;
};

const float32ToBuffer = (f32) => {
  if (!f32 || !(f32 instanceof Float32Array) || f32.length === 0) return null;
  return Buffer.from(f32.buffer.slice(0));
};

const relUploadPath = (absPath) => {
  // convert absolute path to relative URL-like path
  const rel = path.relative(process.cwd(), absPath).split(path.sep).join('/');
  return rel;
};

/* ================= 1) LOGIN USER ================= */
const loginUser = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET missing' });
    }

    const { email, password } = req.body || {};
    const e = normalizeEmail(email);

    if (!e || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: e });
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: 'User not found with this email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Credentials (Password Incorrect)' });
    }

    // SaaS active company check
    if (user.role !== 'SuperAdmin' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company || company.status !== 'Active') {
        return res.status(403).json({ message: 'Company Account Suspended/Inactive' });
      }
    }

    const token = generateToken({
      id: user._id,
      role: user.role,
      companyId: user.companyId || null
    });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        status: user.status,
        designation: user.designation,
        profileImage: user.profileImage,
        isWfhActive: user.isWfhActive
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed due to server error' });
  }
};

/* ================= 2) SUPER ADMIN LOGIN (ENV ONLY) ================= */
const superAdminLogin = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET missing' });
    }

    const { email, password } = req.body || {};

    const envEmail = process.env.SUPER_ADMIN_EMAIL;
    const envPass = process.env.SUPER_ADMIN_PASSWORD;

    if (!envEmail || !envPass) {
      return res.status(500).json({ message: 'Super Admin not configured on server.' });
    }

    if (String(email || '') !== envEmail || String(password || '') !== envPass) {
      return res.status(401).json({ message: 'Invalid Super Admin credentials' });
    }

    const token = generateToken({
      role: 'SuperAdmin',
      isRoot: true,
      id: 'super_admin_root_id'
    });

    res.json({
      user: { role: 'SuperAdmin', email: envEmail, name: 'System Root' },
      token
    });
  } catch {
    res.status(500).json({ message: 'Super Admin login failed' });
  }
};

/* ================= 3) EMPLOYEE REGISTRATION (PUBLIC) ================= */
const registerEmployee = async (req, res) => {
  try {
    const { name, email, mobile, password, designation, companyId, faceDescriptor } = req.body || {};
    const e = normalizeEmail(email);

    if (!name || !e || !password || !companyId) {
      return res.status(400).json({ message: 'Name, email, password, companyId required' });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(400).json({ message: 'Invalid Company ID. Please select a valid company.' });
    if (company.status !== 'Active') return res.status(403).json({ message: 'Registration not allowed. Company is inactive.' });

    // global unique email (current system)
    const userExists = await User.findOne({ email: e });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email.' });

    // profile image path
    let imagePath = '';
    if (req.file?.path) {
      imagePath = relUploadPath(req.file.path);
    }

    const f32 = parseDescriptorToFloat32(faceDescriptor);
    const vecBuf = float32ToBuffer(f32);

    const user = await User.create({
      name: String(name).trim(),
      email: e,
      mobile: mobile || '0000000000',
      password,
      designation: designation || 'Staff',
      companyId,
      role: 'Employee',
      status: 'Pending',
      isApproved: false,
      profileImage: imagePath,
      faceDescriptor: faceDescriptor || '[]',
      faceDescriptorVec: vecBuf
    });

    res.status(201).json({
      message: 'Registration successful! You can login now, but salary calculation starts after HR approval.',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

/* ================= 4) PUBLIC: GET ACTIVE COMPANIES ================= */
const getActiveCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'Active' }).select('_id name');
    res.json(companies);
  } catch {
    res.status(500).json({ message: 'Failed to load companies' });
  }
};

/* ================= HR ONLY middleware (kept) ================= */
const hrOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'CompanyAdmin' || req.user.role === 'SuperAdmin')) {
    return next();
  }
  return res.status(403).json({ message: 'HR Access Required' });
};

/* ================= 5) SUBMIT INQUIRY (radius + officeTiming + timezone) =================
   ✅ Fixes:
   - handles duplicate email (11000) -> 409
   - handles validation error -> 400
   - supports officeTiming as string JSON OR object
   - supports old fields AND new fields (officeStartTime/officeEndTime)
   - avoids spreading req.body into DB (prevents unexpected fields)
*/
const submitInquiry = async (req, res) => {
  try {
    const body = req.body || {};

    // Required fields (keep schema aligned)
    const companyName = String(body.companyName || '').trim();
    const contactPerson = String(body.contactPerson || '').trim();
    const email = normalizeEmail(body.email);
    const mobile = String(body.mobile || '').trim();
    const address = String(body.address || '').trim();

    const lat = Number.parseFloat(body.lat);
    const lng = Number.parseFloat(body.lng);

    if (!companyName || !contactPerson || !email || !mobile || !address) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Invalid Coordinates. Please use the map pin or enter manually.' });
    }

    // radius validation (keep old logic but safe)
    let radius = body.radius !== undefined ? Number(body.radius) : 3000;
    if (!Number.isFinite(radius)) radius = 3000;
    radius = Math.max(100, Math.min(radius, 50000));

    // officeTiming may come as JSON string (FormData) OR object
    let officeTiming = body.officeTiming;

    if (typeof officeTiming === 'string') {
      try { officeTiming = JSON.parse(officeTiming); } catch { officeTiming = undefined; }
    }

    // Backward support: accept separate fields (old/new UI)
    // - old: startTime/endTime/timeZone
    // - new: officeStartTime/officeEndTime/timeZone
    if (!officeTiming) {
      const startTime = body.startTime || body.officeStartTime;
      const endTime = body.endTime || body.officeEndTime;
      const timeZone = body.timeZone;

      if (startTime || endTime || timeZone) {
        officeTiming = {
          startTime: startTime || '09:30',
          endTime: endTime || '18:30',
          workingHours: Number(body.workingHours) || 9,
          timeZone: timeZone || 'Asia/Kolkata'
        };
      }
    }

    // Build payload strictly (do NOT spread req.body)
    const payload = {
      companyName,
      contactPerson,
      email,
      mobile,
      address,
      lat,
      lng,
      radius,
      officeTiming: officeTiming && typeof officeTiming === 'object' ? officeTiming : undefined,
      status: 'Pending'
    };

    const inquiry = await Inquiry.create(payload);

    // keep response shape same
    return res.status(201).json({ message: 'Inquiry Submitted', inquiry });
  } catch (err) {
    console.error('submitInquiry error:', err);

    // ✅ Duplicate email unique key
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'This email already submitted an inquiry.' });
    }

    // ✅ Validation errors from schema
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Submission Failed' });
  }
};

module.exports = {
  loginUser,
  hrOnly,
  superAdminLogin,
  registerEmployee,
  getActiveCompanies,
  submitInquiry
};
