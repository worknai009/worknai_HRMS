const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const Inquiry = require('../models/Inquiry');

/* ================= JWT HELPER ================= */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
};

/* ================= 1. LOGIN USER ================= */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find User (Explicitly select password as it might be excluded)
    const user = await User.findOne({ email }); // User model doesn't exclude password by default unless 'select: false' is set in schema
    
    if (!user) {
      return res.status(401).json({ message: 'User not found with this email' });
    }

    // 2. Debugging Log (Remove in production)
    console.log(`Login Attempt for: ${email}`);
    // console.log(`Stored Hash: ${user.password}`); // Uncomment only if needed for extreme debugging

    // 3. Compare Password
    // Try both method and direct compare to be safe
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("Password Mismatch");
      return res.status(401).json({ message: 'Invalid Credentials (Password Incorrect)' });
    }

    // 4. SaaS Active Check
    if (user.role !== 'SuperAdmin' && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company || company.status !== 'Active') {
        return res.status(403).json({ message: 'Company Account Suspended/Inactive' });
      }
    }

    // 5. Generate Token
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
    console.error("Login Controller Error:", err);
    res.status(500).json({ message: 'Login failed due to server error' });
  }
};

/* ================= 2. SUPER ADMIN LOGIN (STRICT ENV) ================= */
// Database lookup REMOVED. Only checks .env credentials.
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const envEmail = process.env.SUPER_ADMIN_EMAIL;
    const envPass = process.env.SUPER_ADMIN_PASSWORD;

    if (!envEmail || !envPass) {
      return res.status(500).json({ message: 'Super Admin not configured on server.' });
    }

    if (email !== envEmail || password !== envPass) {
      return res.status(401).json({ message: 'Invalid Super Admin credentials' });
    }

    const token = generateToken({
      role: 'SuperAdmin',
      isRoot: true,
      id: 'super_admin_root_id' // Static ID for Root
    });

    res.json({
      user: { 
        role: 'SuperAdmin', 
        email: envEmail, 
        name: 'System Root' 
      },
      token
    });

  } catch (err) {
    console.error("Super Admin Login Error:", err);
    res.status(500).json({ message: 'Super Admin login failed' });
  }
};

/* ================= 3. EMPLOYEE REGISTRATION (With Validations) ================= */
const registerEmployee = async (req, res) => {
  try {
    const { name, email, mobile, password, designation, companyId, faceDescriptor } = req.body;
    let imagePath = "";

    // Image Upload check
    if (req.file) {
      imagePath = `uploads/${req.file.filename}`;
    }

    // 1. Validation: Check if Company Exists & Active
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(400).json({ message: "Invalid Company ID. Please select a valid company." });
    }
    if (company.status !== 'Active') {
      return res.status(403).json({ message: "Registration not allowed. Company is inactive." });
    }

    // 2. Check Duplicate Email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // 3. Create User (Status: Pending)
    const user = await User.create({
      name,
      email,
      mobile,
      password, // Hashed automatically in Model
      designation,
      companyId,
      role: 'Employee',
      status: 'Pending', // Default status
      isApproved: false,
      profileImage: imagePath,
      faceDescriptor: faceDescriptor || "[]"
    });

    res.status(201).json({
      message: 'Registration successful! You can login now, but salary calculation starts after HR approval.',
      userId: user._id
    });

  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

/* ================= 4. PUBLIC: GET ACTIVE COMPANIES (For Dropdown) ================= */
const getActiveCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: 'Active' }).select('_id name');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Failed to load companies" });
  }
};


const hrOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'CompanyAdmin' || req.user.role === 'SuperAdmin')) {
    return next();
  }
  return res.status(403).json({ message: 'HR Access Required' });
};

/* ================= 5. SUBMIT INQUIRY (Fixed for Location) ================= */
const submitInquiry = async (req, res) => {
  try {
    // ✅ Fix: Parse Coordinates explicitly
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid Coordinates. Please use the map pin or enter manually." });
    }

    const inquiry = await Inquiry.create({ 
        ...req.body, 
        lat, 
        lng, 
        status: 'Pending' 
    });
    res.status(201).json({ message: 'Inquiry Submitted', inquiry });
  } catch (error) {
    console.error("Inquiry Error:", error);
    res.status(500).json({ message: "Submission Failed" });
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