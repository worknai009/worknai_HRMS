const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Tiny in-memory cache for Company (reduce DB hits)
 */
const COMPANY_CACHE_TTL_MS = 60 * 1000;
const COMPANY_CACHE_MAX = 500;
const companyCache = new Map(); // key -> { at, doc }

const cacheGetCompany = (companyId) => {
  const key = String(companyId || '');
  const entry = companyCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.at > COMPANY_CACHE_TTL_MS) {
    companyCache.delete(key);
    return null;
  }
  return entry.doc;
};

const cacheSetCompany = (companyId, doc) => {
  const key = String(companyId || '');
  if (!key) return;

  // keep cache small
  if (companyCache.size >= COMPANY_CACHE_MAX) {
    const firstKey = companyCache.keys().next().value;
    if (firstKey) companyCache.delete(firstKey);
  }
  companyCache.set(key, { at: Date.now(), doc });
};

const extractBearerToken = (req) => {
  const h = req.headers.authorization;
  if (h && typeof h === 'string' && h.startsWith('Bearer ')) return h.split(' ')[1];
  return null;
};

const protect = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Not authorized, token missing' });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;

    // ✅ SuperAdmin shortcut
    if (decoded?.role === 'SuperAdmin') {
      req.user = {
        _id: decoded.id || 'super_admin_root_id',
        id: decoded.id || 'super_admin_root_id',
        name: 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@hrms.com',
        role: 'SuperAdmin',
        companyId: null
      };
      req.company = null;
      req.ctx = {
        companyId: null,
        timeZone: 'Asia/Kolkata',
        radius: 3000,
        attendancePolicy: {}
      };
      return next();
    }

    if (!decoded?.id) return res.status(401).json({ message: 'Not authorized, invalid token payload' });

    // ✅ Normal user
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isDeleted) return res.status(401).json({ message: 'Not authorized, user not found' });

    // token-company mismatch => force relogin
    if (decoded.companyId && user.companyId && String(decoded.companyId) !== String(user.companyId)) {
      return res.status(401).json({ message: 'Session invalid. Please login again.' });
    }

    // ✅ Company attach + active check
    let company = null;
    if (user.companyId) {
      company = cacheGetCompany(user.companyId);
      if (!company) {
        company = await Company.findById(user.companyId);
        if (company) cacheSetCompany(user.companyId, company);
      }

      if (!company || company.status !== 'Active') {
        return res.status(403).json({ message: 'Access Denied: Company inactive or suspended' });
      }
    }

    req.user = user;
    req.user.id = user._id.toString(); // backward compatibility
    req.company = company;

    // ✅ Context helpers (controllers use this)
    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const radius = Number(company?.location?.radius) || 3000;

    req.ctx = {
      companyId: user.companyId ? String(user.companyId) : null,
      timeZone,
      radius,
      attendancePolicy: company?.attendancePolicy || {}
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// ✅ Role guard
const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user?.role === 'SuperAdmin') return next();
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access Denied: User role '${req.user?.role}' is not authorized`
      });
    }
    next();
  };
};

// ✅ Backward compatible aliases (tumhare purane routes ke liye)
const hrOnly = authorize('Admin', 'CompanyAdmin', 'SuperAdmin');
const companyOwnerOnly = authorize('CompanyAdmin', 'SuperAdmin');

const superAdminOnly = (req, res, next) => {
  if (req.user?.role === 'SuperAdmin') return next();
  return res.status(403).json({ message: 'SuperAdmin Access Required' });
};

// ✅ SaaS tenant guard
const tenantOnly = (req, res, next) => {
  if (req.user?.role === 'SuperAdmin') return next();
  if (!req.user?.companyId) return res.status(400).json({ message: 'Company ID missing in user profile' });
  next();
};

// ✅ Optional: ensure active employee
const requireActiveUser = (req, res, next) => {
  if (req.user?.role === 'SuperAdmin') return next();
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  if (req.user.role === 'Employee' && req.user.status && req.user.status !== 'Active') {
    return res.status(403).json({ message: 'Account is not active. Contact HR.' });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  tenantOnly,
  requireActiveUser,

  // ✅ these are needed because your routes are using them
  hrOnly,
  companyOwnerOnly,
  superAdminOnly
};
