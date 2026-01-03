// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * 🔐 PROTECT MIDDLEWARE
 * - JWT validate karta hai
 * - req.user set karta hai
 * - SuperAdmin & normal users handle karta hai
 * - Company active check karta hai (SaaS safe)
 * - BACKWARD COMPATIBLE: req.user.id & req.user._id dono available
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // 1️⃣ Token extract
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 3️⃣ SUPER ADMIN (SaaS Owner)
     * Token me role agar SuperAdmin hai
     */
    if (decoded && decoded.role === 'SuperAdmin') {
      req.user = {
        _id: decoded.id || 'super_admin_001',
        id: decoded.id || 'super_admin_001', // ✅ backward compatibility
        name: 'Super Admin',
        email: process.env.HR_EMAIL || 'admin@hrms.com',
        role: 'SuperAdmin',
        companyId: null
      };
      return next();
    }

    /**
     * 4️⃣ NORMAL USER (CompanyAdmin / Admin / Employee)
     */
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    /**
     * 5️⃣ SaaS SECURITY: Company Active Check
     */
    if (user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company || company.status !== 'Active') {
        return res.status(403).json({
          message: 'Access Denied: Company inactive or suspended'
        });
      }
    }

    /**
     * 6️⃣ Attach user to request
     * ✅ BOTH id formats set
     */
    req.user = user;
    req.user.id = user._id.toString(); // ✅ CRITICAL FIX

    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({
      message: 'Not authorized, token invalid or expired'
    });
  }
};

/* ================= ROLE BASED GUARDS ================= */

// 🛡 Super Admin Only
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'SuperAdmin') {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied: Super Admin Only' });
};

// 🏢 Company Owner Only
const companyOwnerOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'CompanyAdmin' || req.user.role === 'SuperAdmin')
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied: Company Owner Only' });
};

// 👨‍💼 HR / Admin Access
const hrOnly = (req, res, next) => {
  if (
    req.user &&
    (
      req.user.role === 'Admin' ||
      req.user.role === 'CompanyAdmin' ||
      req.user.role === 'SuperAdmin'
    )
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied: HR/Admin Only' });
};

module.exports = {
  protect,
  superAdminOnly,
  companyOwnerOnly,
  hrOnly
};
