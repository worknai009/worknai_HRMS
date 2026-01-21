// Backend/controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Company = require('../models/Company');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getDateStringInTZ, getMonthRangeStringsInTZ, dateFromYMDHMInTZ } = require('../utils/timezone');

/* ------------------ HELPERS ------------------ */
const getReqUserId = (req) => req?.user?._id?.toString?.() || req?.user?.id || null;

const safeJsonParse = (v) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  if (typeof v !== 'string') return null;
  try { return JSON.parse(v); } catch { return null; }
};

const ensureDir = async (dir) => {
  try { await fs.mkdir(dir, { recursive: true }); } catch { }
};

const clampStr = (s, max = 2000) => {
  if (s == null) return '';
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};

// ✅ tenant-safe but legacy-compatible (old attendance without companyId will still match)
const scopedUserDateFilter = (userId, companyId, date) => ({
  userId,
  date,
  $or: [{ companyId }, { companyId: { $exists: false } }]
});

const scopedUserFilter = (userId, companyId) => ({
  userId,
  $or: [{ companyId }, { companyId: { $exists: false } }]
});

/* ------------------ FAST FACE MATCH ------------------ */
const CACHE_SIZE = 500;
const THRESHOLD = 0.60;
const THRESHOLD_SQ = THRESHOLD * THRESHOLD;
const userDescriptorCache = new Map();

function cacheSet(map, key, value) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  if (map.size > CACHE_SIZE) map.delete(map.keys().next().value);
}

function getStoredDescriptor(user) {
  const userId = user._id.toString();
  if (userDescriptorCache.has(userId)) return userDescriptorCache.get(userId);

  if (user.faceDescriptorVec && Buffer.isBuffer(user.faceDescriptorVec) && user.faceDescriptorVec.length > 0) {
    const ab = user.faceDescriptorVec.buffer.slice(
      user.faceDescriptorVec.byteOffset,
      user.faceDescriptorVec.byteOffset + user.faceDescriptorVec.byteLength
    );
    const arr = new Float32Array(ab);
    cacheSet(userDescriptorCache, userId, arr);
    return arr;
  }

  let raw = user.faceDescriptor;
  let arr = null;
  try {
    if (Array.isArray(raw)) arr = raw.map(Number);
    else if (typeof raw === 'string') {
      const t = raw.trim();
      arr = t.startsWith('[') ? JSON.parse(t) : t.split(',').map(Number);
    }
  } catch { arr = null; }

  if (!Array.isArray(arr) || arr.length < 32) return null;
  const f = new Float32Array(arr.map(Number));
  cacheSet(userDescriptorCache, userId, f);
  return f;
}

function parseIncomingDescriptor(raw) {
  if (!raw) return null;
  let arr = raw;
  try {
    if (Array.isArray(raw)) arr = raw;
    else if (typeof raw === 'string') {
      const t = raw.trim();
      arr = t.startsWith('[') ? JSON.parse(t) : t.split(',').map(Number);
    }
  } catch { return null; }

  if (!Array.isArray(arr) || arr.length < 32) return null;
  return new Float32Array(arr.map(Number));
}

function squaredDistanceEarlyExit(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
    if (sum > THRESHOLD_SQ) return Infinity;
  }
  return sum;
}

/* ------------------ LOCATION (FAST) ------------------ */
function normalizeLoc(loc) {
  if (!loc) return null;
  const latRaw = (loc.lat ?? loc.latitude);
  const lngRaw = (loc.lng ?? loc.longitude);
  if (latRaw === undefined || lngRaw === undefined) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, address: loc.address || loc.addr || '' };
}

function distanceMeters(a, b) {
  const R = 6371e3;
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;

  const x = Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function isInsideOffice(userLocRaw, officeLocRaw, radiusMeters = 3000) {
  const officeLoc = normalizeLoc(officeLocRaw);
  if (!officeLoc) return true;
  const userLoc = normalizeLoc(userLocRaw);
  if (!userLoc) return false;
  const dist = distanceMeters(userLoc, officeLoc);
  return dist <= radiusMeters;
}

/* ------------------ IP + WIFI + QR (LIGHTWEIGHT) ------------------ */
function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf && typeof xf === 'string') return xf.split(',')[0].trim();
  return (req.ip || req.connection?.remoteAddress || '').replace('::ffff:', '');
}

function ipToInt(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3];
}

function cidrContains(ip, cidr) {
  const [range, bitsStr] = String(cidr).split('/');
  const bits = Number(bitsStr);
  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(range);
  if (ipInt == null || rangeInt == null || !Number.isFinite(bits)) return false;
  const mask = bits === 0 ? 0 : (~((1 << (32 - bits)) - 1) >>> 0) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function ipAllowed(ip, allowedRanges = []) {
  if (!ip) return false;
  if (!Array.isArray(allowedRanges) || allowedRanges.length === 0) return false;
  return allowedRanges.some((r) => {
    if (!r) return false;
    const s = String(r).trim();
    if (!s) return false;
    if (s.includes('/')) return cidrContains(ip, s);
    return s === ip;
  });
}

function constantTimeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function expectedQrCode(secret, todayStr) {
  return crypto.createHmac('sha256', String(secret)).update(String(todayStr)).digest('hex');
}

/* ------------------ ATTENDANCE METHOD POLICY ------------------ */
function resolveMethod(reqMethod, company) {
  const policy = company?.attendancePolicy || {};
  const allowed = policy.allowedMethods || ['GPS_FACE', 'MANUAL_HR'];
  const m = (reqMethod || 'GPS_FACE').toString().trim();
  return allowed.includes(m) ? m : 'GPS_FACE';
}

function needsFace(method, company) {
  const policy = company?.attendancePolicy || {};
  if (policy.requireFace === false) return false;
  return method !== 'MANUAL_HR';
}

function needsGps(method, company) {
  const policy = company?.attendancePolicy || {};
  if (policy.requireGps === true && method !== 'MANUAL_HR') return true;
  return method === 'GPS_FACE';
}

/* ================== CONTROLLERS ================== */

/* ------------------ TIME HELPERS (For Manual Attendance) ------------------ */
function parseHHMM(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function addMinutesToHHMM(timeStr, minsToAdd) {
  const p = parseHHMM(timeStr);
  if (!p) return null;
  let totalMins = p.h * 60 + p.m + minsToAdd;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

function computeNetHours(d1, d2) {
  if (!d1 || !d2) return 0;
  const diffMs = d2.getTime() - d1.getTime();
  if (diffMs <= 0) return 0;
  return Number((diffMs / 3600000).toFixed(2));
}

/**
 * POST /attendance/punch-in
 */
const punchIn = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { faceDescriptor, image, location, plannedTasks, method, wifiSsid, qrCode } = req.body || {};

    const user = await User.findById(userId).populate('companyId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const company = user.companyId;
    if (!company) return res.status(400).json({ message: 'Company not linked' });

    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const today = getDateStringInTZ(timeZone);
    const chosenMethod = resolveMethod(method, company);

    const openSession = await Attendance.findOne(scopedUserDateFilter(userId, company._id, today)).lean();
    if (openSession) return res.status(400).json({ message: 'Attendance already marked for today!' });

    const policy = company?.attendancePolicy || {};

    if (chosenMethod === 'WIFI_FACE') {
      const allowedSSIDs = policy.allowedWifiSSIDs || [];
      const ssid = String(wifiSsid || '').trim();
      if (!ssid) return res.status(400).json({ message: 'WiFi SSID required' });
      if (!Array.isArray(allowedSSIDs) || !allowedSSIDs.includes(ssid)) {
        return res.status(403).json({ message: 'WiFi not allowed for attendance' });
      }
    }

    if (chosenMethod === 'IP_FACE') {
      const ip = getClientIp(req);
      if (!ipAllowed(ip, policy.allowedIpRanges || [])) {
        return res.status(403).json({ message: 'IP not allowed for attendance' });
      }
    }

    if (chosenMethod === 'QR_FACE') {
      const secret = policy.qrSecret || '';
      if (!secret) return res.status(400).json({ message: 'QR attendance not configured' });
      const expected = expectedQrCode(secret, today);
      if (!qrCode || !constantTimeEqual(String(qrCode).trim(), expected)) {
        return res.status(403).json({ message: 'Invalid QR code' });
      }
    }

    if (needsFace(chosenMethod, company)) {
      if (!faceDescriptor) return res.status(400).json({ message: 'Face data required' });
      const stored = getStoredDescriptor(user);
      const incoming = parseIncomingDescriptor(faceDescriptor);
      if (!stored || !incoming || squaredDistanceEarlyExit(stored, incoming) === Infinity) {
        return res.status(400).json({ message: '❌ Face Mismatch!' });
      }
    }

    const radius = Number(company?.location?.radius) || 3000;
    let userLoc = location;
    if (typeof location === 'string') userLoc = safeJsonParse(location);

    if (needsGps(chosenMethod, company)) {
      if (!userLoc) return res.status(400).json({ message: 'Location required for this attendance method' });
      if (company?.location?.lat != null && company?.location?.lng != null) {
        if (!isInsideOffice(userLoc, company.location, radius)) {
          return res.status(403).json({ message: `❌ You are too far from office. Allowed radius: ${radius}m` });
        }
      }
    }

    let imagePath = '';
    if (image && typeof image === 'string') {
      if (image.length > 8 * 1024 * 1024) return res.status(400).json({ message: 'Image too large' });
      const uploadsDir = path.join(process.cwd(), 'uploads/images');
      await ensureDir(uploadsDir);
      const fileName = `in_${userId}_${Date.now()}.jpg`;
      imagePath = `uploads/images/${fileName}`;
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      await fs.writeFile(path.join(uploadsDir, fileName), base64Data, 'base64');
    }

    try {
      const attendance = await Attendance.create({
        userId,
        companyId: company._id,
        date: today,
        punchInTime: new Date(),
        location: userLoc ? normalizeLoc(userLoc) : null,
        inImage: imagePath,
        status: 'Present',
        mode: chosenMethod === 'MANUAL_HR' ? 'Manual' : 'Office',
        source: chosenMethod,
        plannedTasks: clampStr(plannedTasks || '', 1500)
      });
      return res.status(201).json({ message: 'Punch In Successful ✅', attendance });
    } catch (e) {
      if (e && e.code === 11000) return res.status(400).json({ message: 'Attendance already marked for today!' });
      throw e;
    }
  } catch (err) {
    console.error('punchIn error:', err);
    return res.status(500).json({ message: 'Server error during Punch In' });
  }
};

/**
 * POST /attendance/break-start
 */
const startBreak = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).populate('companyId');
    const company = user?.companyId;
    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const today = getDateStringInTZ(timeZone);

    const att = await Attendance.findOne(scopedUserDateFilter(userId, company?._id, today));
    if (!att || att.punchOutTime) return res.status(400).json({ message: 'Invalid break request.' });

    if (!att.breakStartAt) att.breakStartAt = new Date();
    att.status = 'On Break';
    await att.save();

    return res.json({ message: 'Break started ☕', attendance: att });
  } catch (err) {
    console.error('startBreak error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /attendance/break-end
 */
const endBreak = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).populate('companyId');
    const company = user?.companyId;
    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const today = getDateStringInTZ(timeZone);

    const att = await Attendance.findOne(scopedUserDateFilter(userId, company?._id, today));
    if (!att) return res.status(404).json({ message: 'No active session.' });

    if (att.breakStartAt) {
      const mins = Math.max(0, Math.round((Date.now() - att.breakStartAt.getTime()) / 60000));
      att.totalBreakMinutes = Number(att.totalBreakMinutes || 0) + mins;
      att.breakTimeMinutes = Number(att.breakTimeMinutes || 0) + mins;
      att.breakStartAt = null;
    }

    att.status = 'Present';
    await att.save();

    return res.json({ message: 'Break ended 🚀', attendance: att });
  } catch (err) {
    console.error('endBreak error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /attendance/punch-out
 */
const punchOut = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { faceDescriptor, dailyReport } = req.body || {};
    const user = await User.findById(userId).populate('companyId');
    const company = user?.companyId;
    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const today = getDateStringInTZ(timeZone);

    const att = await Attendance.findOne({
      ...scopedUserDateFilter(userId, company?._id, today),
      punchOutTime: null
    });

    if (!att) return res.status(400).json({ message: 'No active session or already out.' });

    if (faceDescriptor) {
      const stored = getStoredDescriptor(user);
      const incoming = parseIncomingDescriptor(faceDescriptor);
      if (!stored || !incoming || squaredDistanceEarlyExit(stored, incoming) === Infinity) {
        return res.status(400).json({ message: 'Face mismatch' });
      }
    }

    if (att.breakStartAt) {
      const mins = Math.max(0, Math.round((Date.now() - att.breakStartAt.getTime()) / 60000));
      att.totalBreakMinutes = Number(att.totalBreakMinutes || 0) + mins;
      att.breakTimeMinutes = Number(att.breakTimeMinutes || 0) + mins;
      att.breakStartAt = null;
    }

    att.punchOutTime = new Date();
    att.dailyReport = clampStr(dailyReport || '', 2000);
    att.status = 'Completed';

    const rawMs = att.punchOutTime.getTime() - att.punchInTime.getTime();
    const breakMs = Number(att.totalBreakMinutes || 0) * 60000;
    const netMs = Math.max(0, rawMs - breakMs);
    const hours = Number((netMs / 36e5).toFixed(2));
    att.netWorkHours = Number.isFinite(hours) ? hours : 0;
    if (att.netWorkHours > 0 && att.netWorkHours < 4) att.status = 'HalfDay';

    await att.save();
    return res.json({ message: 'Punch Out Successful 🏠', attendance: att });
  } catch (err) {
    console.error('punchOut error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /attendance/history (Employee own)
 */
const getMyHistory = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('companyId').lean();
    const companyId = user?.companyId;

    const history = await Attendance.find(companyId ? scopedUserFilter(userId, companyId) : { userId })
      .sort({ date: -1 })
      .limit(31)
      .lean();

    return res.json(history);
  } catch (err) {
    console.error('getMyHistory error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /attendance/stats
 * ✅ Paid/Unpaid/WFH only counting (no double count)
 * (keeps old response keys so frontend doesn't break)
 */
const getAttendanceStats = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).populate('companyId');
    const company = user?.companyId;
    const timeZone = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const { start, end } = getMonthRangeStringsInTZ(timeZone);

    const filter = company?._id
      ? { userId, date: { $gte: start, $lte: end }, $or: [{ companyId: company._id }, { companyId: { $exists: false } }] }
      : { userId, date: { $gte: start, $lte: end } };

    const records = await Attendance.find(filter).lean();

    // keep old keys: present, absent, leaves, halfDays, holidays, wfh, payableDays
    const stats = { present: 0, absent: 0, leaves: 0, halfDays: 0, holidays: 0, wfh: 0, payableDays: 0 };

    records.forEach((att) => {
      const st = String(att.status || '');
      const mode = String(att.mode || '');

      // ✅ Order matters to prevent double counting
      if (mode === 'WFH') { stats.wfh++; return; }
      if (mode === 'Holiday' || st === 'Holiday') { stats.holidays++; return; }

      // HalfDay counts as 0.5 day only (don’t add to present/leaves again)
      if (st === 'HalfDay') { stats.halfDays++; return; }

      // Paid leave
      if (mode === 'Paid Leave' || st === 'On Leave') { stats.leaves++; return; }

      // Unpaid leave / Absent
      if (mode === 'Unpaid Leave' || st === 'Absent') { stats.absent++; return; }

      // Present
      if (st === 'Present' || st === 'Completed') { stats.present++; return; }
    });

    stats.payableDays = stats.present + stats.wfh + stats.leaves + stats.holidays + (stats.halfDays * 0.5);
    return res.json(stats);
  } catch (err) {
    console.error('getAttendanceStats error:', err);
    return res.status(500).json({ message: 'Error fetching stats' });
  }
};

/**
 * GET /attendance/all (HR usage)
 * Supports pagination ?page=1&limit=20&search=...
 */
const getAllAttendance = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: 'Company ID missing' });

    const search = (req.query.search || "").trim();

    const query = { companyId };

    // Search by User Name (requires lookup) or Status
    // Since we populate userId, searching by name in DB is hard without aggregation.
    // For now, simpler search: Status, Date, or Mode
    if (search) {
      // if date YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(search)) {
        query.date = search;
      } else {
        query.$or = [
          { status: { $regex: search, $options: 'i' } },
          { mode: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const logs = await Attendance.find(query)
      .populate('userId', 'name email designation profileImage')
      .sort({ date: -1 })
      .lean();

    return res.json(logs);
  } catch (err) {
    console.error('getAllAttendance error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /attendance/history/:userId (HR)
 * ✅ company scoped + user exists check
 * Supports pagination
 */
/**
 * GET /attendance/history/:userId (HR)
 * ✅ company scoped + legacy compatible + search safe (no $or overwrite)
 */
const getUserHistory = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (!targetUserId) return res.status(400).json({ message: 'User ID required' });

    const companyId = req.user?.companyId;
    if (!companyId && req.user?.role !== 'SuperAdmin') {
      return res.status(400).json({ message: 'Company missing' });
    }

    // ensure user belongs to HR company (unless SuperAdmin)
    const user = await User.findById(targetUserId).select('companyId isDeleted').lean();
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'SuperAdmin' && String(user.companyId) !== String(companyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const search = (req.query.search || "").trim();

    // ✅ Legacy compatible scope (old attendance without companyId)
    const query = {
      userId: user._id,
      $or: [{ companyId: user.companyId }, { companyId: { $exists: false } }]
    };

    if (search) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(search)) {
        query.date = search;
      } else {
        // ✅ Don't overwrite existing $or (company scope already uses $or)
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { status: { $regex: search, $options: 'i' } },
            { mode: { $regex: search, $options: 'i' } }
          ]
        });
      }
    }

    const history = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    console.log("DEBUG: getUserHistory", {
      targetUserId,
      realId: user._id,
      count: history.length
    });

    return res.json(history);
  } catch (err) {
    console.error('getUserHistory error:', err);
    return res.status(500).json({ message: 'Failed to fetch user history' });
  }
};


/**
 * POST /attendance/manual (HR)
 * ✅ company scoped + safe upsert
/**
 * POST /attendance/manual (HR)
 * ✅ FIX: timezone-safe in/out time + blank time uses company default timing
 */
const markManualAttendance = async (req, res) => {
  try {
    console.log("markManualAttendance called"); // Debug log

    // --- Internal Helpers for safety ---
    function parseHHMM(timeStr) {
      if (!timeStr || typeof timeStr !== 'string') return null;
      const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return { h, m };
    }

    function addMinutesToHHMM(timeStr, minsToAdd) {
      const p = parseHHMM(timeStr);
      if (!p) return null;
      let totalMins = p.h * 60 + p.m + minsToAdd;
      const newH = Math.floor(totalMins / 60) % 24;
      const newM = totalMins % 60;
      return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    }

    function computeNetHours(d1, d2) {
      if (!d1 || !d2) return 0;
      const diffMs = d2.getTime() - d1.getTime();
      if (diffMs <= 0) return 0;
      return Number((diffMs / 3600000).toFixed(2));
    }
    // -----------------------------------

    const { userId, date, status, inTime, outTime, remarks } = req.body || {};

    if (!userId || !date || !status) {
      return res.status(400).json({ message: "Missing required fields (userId, date, status)" });
    }

    const hrCompanyId = req.user?.companyId;
    if (!hrCompanyId && req.user?.role !== 'SuperAdmin') {
      return res.status(400).json({ message: 'Company missing' });
    }

    const user = await User.findById(userId).select('companyId isDeleted').lean();
    if (!user || user.isDeleted) return res.status(404).json({ message: "User not found" });

    if (req.user.role !== 'SuperAdmin' && String(user.companyId) !== String(hrCompanyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const company = await Company.findById(user.companyId).select('officeTiming').lean();
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';

    const startTime = company?.officeTiming?.startTime || '09:30';
    const endTime = company?.officeTiming?.endTime || '18:30';

    const workingHours = Number(company?.officeTiming?.workingHours || 8);
    const halfMinutes = Math.round((Number.isFinite(workingHours) ? workingHours : 8) * 60 / 2);

    const safeDate = String(date).trim();
    const st = String(status).trim();

    // mode mapping (keeps old payroll logic safe)
    const mode =
      st === 'Holiday' ? 'Holiday'
        : st === 'On Leave' ? 'Paid Leave'
          : st === 'Absent' ? 'Unpaid Leave'
            : 'Manual';

    // For Holiday/Absent/Leave => no punch times, 0 hours
    const noTimes = (st === 'Holiday' || st === 'Absent' || st === 'On Leave');

    let finalInStr = null;
    let finalOutStr = null;

    if (!noTimes) {
      // Blank -> company default
      finalInStr = parseHHMM(inTime) ? String(inTime).trim() : startTime;
      finalOutStr = parseHHMM(outTime) ? String(outTime).trim() : endTime;

      // HalfDay + blank outTime => auto set outTime = inTime + halfDay hours
      if (st === 'HalfDay' && !parseHHMM(outTime)) {
        const computed = addMinutesToHHMM(finalInStr, halfMinutes);
        if (computed) finalOutStr = computed;
      }

      // If someone sends only outTime but no inTime (rare) => use startTime
      if (!parseHHMM(inTime) && parseHHMM(outTime)) {
        finalInStr = startTime;
      }
    }

    let punchInTime = null;
    let punchOutTime = null;

    if (!noTimes) {
      punchInTime = dateFromYMDHMInTZ(safeDate, finalInStr, tz);
      punchOutTime = dateFromYMDHMInTZ(safeDate, finalOutStr, tz);
    }

    let netWorkHours = 0;
    if (!noTimes && punchInTime && punchOutTime) {
      netWorkHours = computeNetHours(punchInTime, punchOutTime);
    }

    const update = {
      userId,
      companyId: user.companyId,
      date: safeDate,
      source: "MANUAL_HR",
      mode,
      isManualEntry: true,
      addedBy: req.user?._id || null,
      status: st,
      dailyReport: clampStr(remarks || "Marked manually by HR", 1200),

      punchInTime,
      punchOutTime,
      netWorkHours
    };

    const att = await Attendance.findOneAndUpdate(
      scopedUserDateFilter(userId, user.companyId, update.date),
      { $set: update },
      { new: true, upsert: true }
    );

    return res.status(200).json({ message: "Attendance updated successfully ✅", attendance: att });
  } catch (err) {
    console.error("markManualAttendance error:", err);
    return res.status(500).json({ message: "Failed to mark manual attendance" });
  }
};

// ✅ Backward compatible aliases so routes never pass undefined
const getAttendanceByUserId = getUserHistory;
const manualAttendance = markManualAttendance;

module.exports = {
  punchIn,
  startBreak,
  endBreak,
  punchOut,
  getMyHistory,
  getAttendanceStats,
  getAllAttendance,
  getUserHistory,
  markManualAttendance,
  // aliases
  getAttendanceByUserId,
  manualAttendance
};
