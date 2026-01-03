const Company = require('../models/Company');
const User = require('../models/User');

const getReqUserId = (req) => {
  if (!req || !req.user) return null;
  return (req.user._id && req.user._id.toString && req.user._id.toString()) || req.user.id || null;
};

// 1. Get Company Profile & Stats
const getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(404).json({ message: "Company not linked." });

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Fetch Lists for Dashboard
    const employees = await User.find({ companyId, role: 'Employee', status: 'Active' }).select('-password -faceDescriptor').limit(5);
    const hrs = await User.find({ companyId, role: 'Admin', status: 'Active' }).select('-password');

    // Stats
    const totalEmployees = await User.countDocuments({ companyId, role: 'Employee' });
    const totalHRs = await User.countDocuments({ companyId, role: 'Admin' });

    res.status(200).json({ 
        company, 
        employees, // Recent 5 active employees
        hrs,       // All active HRs
        stats: { totalEmployees, totalHRs } 
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. Update Profile & Logo
const updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const updates = { ...req.body };
    
    // Logo Upload Logic (Assumes middleware puts file in req.file)
    if(req.file) {
        updates.logo = `uploads/${req.file.filename}`;
    }

    if ('status' in updates) delete updates.status; 
    if ('maxHrAdmins' in updates) delete updates.maxHrAdmins; // Owner cannot change limit directly

    const company = await Company.findByIdAndUpdate(companyId, updates, { new: true });
    res.status(200).json({ message: "Profile Updated", company });
  } catch (error) {
    res.status(500).json({ message: "Update Failed" });
  }
};

// 3. Register HR (With Audit Log Logic Placeholder)
const registerHR = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, email, mobile, password, designation } = req.body;

    const company = await Company.findById(companyId);
    
    // Check Limit
    const currentHRs = await User.countDocuments({ companyId, role: 'Admin' });
    if (company.maxHrAdmins && currentHRs >= company.maxHrAdmins) {
      return res.status(400).json({ message: `HR Limit Reached (${company.maxHrAdmins}). Request upgrade from Dashboard.` });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "User email already exists" });

    await User.create({
      name, email, mobile, password,
      role: 'Admin',
      companyId,
      designation: designation || "HR Manager",
      status: 'Active',
      isApproved: true,
      createdBy: req.user._id // 🛡️ Audit: Kisne banaya
    });

    res.status(201).json({ message: "HR Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating HR" });
  }
};

// 4. Request Extra HR Limit
const requestHrLimit = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        // Set a flag in Company model (You need to add this field to model if not exists, or handle via Inquiry)
        // Here we assume a 'limitRequest' field or we create a system inquiry.
        // For simplicity, we update the company doc with a request flag.
        
        await Company.findByIdAndUpdate(companyId, { hrLimitRequest: 'Pending' });
        
        res.json({ message: "Request sent to Super Admin. Please wait for approval." });
    } catch (e) {
        res.status(500).json({ message: "Request Failed" });
    }
};

// 5. Get All Employees (Full List)
const getAllEmployees = async (req, res) => {
    try {
        const employees = await User.find({ companyId: req.user.companyId, role: 'Employee' }).select('-password');
        res.json(employees);
    } catch (e) {
        res.status(500).json({ message: "Fetch Failed" });
    }
}

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  registerHR,
  requestHrLimit,
  getAllEmployees
};