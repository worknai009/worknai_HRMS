const Attendance = require('../models/Attendance');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

/* ------------------ HELPERS ------------------ */
const getReqUserId = (req) => req?.user?._id?.toString?.() || req?.user?.id || null;

const getIndianDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// --- OPTIMIZED FACE MATCHING (FAST) ---
const CACHE_SIZE = 500;
const THRESHOLD = 0.60; 
const THRESHOLD_SQ = THRESHOLD * THRESHOLD;
const userDescriptorCache = new Map();
const inputDescriptorCache = new Map();

function cacheSet(map, key, value) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  if (map.size > CACHE_SIZE) map.delete(map.keys().next().value);
}

function parseDescriptorCached(raw, cacheKey, cacheMap) {
  if (!raw) return null;
  if (cacheKey && cacheMap.has(cacheKey)) return cacheMap.get(cacheKey);
  
  let arr = null;
  try {
    if (Array.isArray(raw)) arr = raw.map(Number);
    else if (typeof raw === 'string') {
      const t = raw.trim();
      arr = t.startsWith('[') ? JSON.parse(t) : t.split(',').map(Number);
    }
  } catch { return null; }

  if (!Array.isArray(arr)) return null;
  const typed = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) typed[i] = Number(arr[i]) || 0;
  
  if (cacheKey) cacheSet(cacheMap, cacheKey, typed);
  return typed;
}

// Euclidean Distance Squared (Faster than Math.sqrt)
function squaredDistanceEarlyExit(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
    if (sum > THRESHOLD_SQ) return Infinity; // Early exit for speed
  }
  return sum;
}

/* --- ROBUST LOCATION CHECK --- */
function isInsideOffice(userLoc, officeLoc) {
  if (!officeLoc || !officeLoc.lat || !officeLoc.lng) {
      console.log("⚠️ Office Lat/Lng missing. Skipping Geo-Fence.");
      return true; 
  }
  if (!userLoc || !userLoc.lat || !userLoc.lng) return false;

  const lat1 = parseFloat(userLoc.lat);
  const lon1 = parseFloat(userLoc.lng);
  const lat2 = parseFloat(officeLoc.lat);
  const lon2 = parseFloat(officeLoc.lng);

  const R = 6371e3; // Meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const limit = officeLoc.radius || 3000; // Increased default to 3000m

  // LOGS FOR DEBUGGING
  console.log(`📍 GEO: User(${lat1.toFixed(5)}, ${lon1.toFixed(5)}) | Office(${lat2.toFixed(5)}, ${lon2.toFixed(5)}) | Dist: ${distance.toFixed(2)}m | Limit: ${limit}m`);

  return distance <= limit;
}

/* ---------- 1️⃣ PUNCH IN ---------- */
const punchIn = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { faceDescriptor, image, location } = req.body || {};
    if (!faceDescriptor) return res.status(400).json({ message: 'Face data required' });

    const today = getIndianDate();
    const openSession = await Attendance.findOne({ userId, date: today });
    if (openSession) return res.status(400).json({ message: 'Attendance already marked for today!' });

    const user = await User.findById(userId).populate('companyId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // 1. FAST FACE CHECK
    const stored = parseDescriptorCached(user.faceDescriptor, userId, userDescriptorCache);
    const incoming = parseDescriptorCached(faceDescriptor, null, inputDescriptorCache);

    if (!stored || !incoming || squaredDistanceEarlyExit(stored, incoming) === Infinity) {
      return res.status(400).json({ message: '❌ Face Mismatch! Try again.' });
    }

    // 2. LOCATION CHECK
    let userLoc = {};
    try { userLoc = typeof location === 'string' ? JSON.parse(location) : location; } catch {}

    if (user.companyId && user.companyId.location && user.companyId.location.lat) {
        if (!isInsideOffice(userLoc, user.companyId.location)) {
          return res.status(403).json({ message: '❌ You are too far from the office.' });
        }
    }

    // 3. SAVE IMAGE (Async - doesn't block response)
    let imagePath = '';
    if (image) {
      const fileName = `in_${userId}_${Date.now()}.jpg`;
      imagePath = `uploads/${fileName}`;
      const filePath = path.join(__dirname, '../uploads', fileName);
      fs.writeFile(filePath, image.replace(/^data:image\/\w+;base64,/, ''), 'base64').catch(e => console.error("Img Save Error:", e));
    }

    // 4. CREATE RECORD
    const attendance = await Attendance.create({
      userId,
      companyId: user.companyId?._id,
      date: today,
      punchInTime: new Date(),
      location: userLoc, 
      inImage: imagePath,
      status: 'Present',
      mode: 'Office'
    });

    res.status(201).json({ message: 'Punch In Successful ✅', attendance });
  } catch (err) {
    console.error('Punch In Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ... (KEEP startBreak, endBreak, punchOut, getMyHistory, getAttendanceStats AS THEY WERE IN PREVIOUS CODE) ...
/* ---------- 2️⃣ START BREAK ---------- */
const startBreak = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const today = getIndianDate();
    const att = await Attendance.findOne({ userId, date: today });
    if (!att) return res.status(404).json({ message: 'No active attendance found for today.' });
    if (att.punchOutTime) return res.status(400).json({ message: 'You have already punched out.' });
    if (att.status === 'On Break') return res.status(400).json({ message: 'Already on break' });
    att.status = 'On Break';
    await att.save();
    res.json({ message: 'Break started ☕', attendance: att });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- 3️⃣ END BREAK ---------- */
const endBreak = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const today = getIndianDate();
    const att = await Attendance.findOne({ userId, date: today });
    if (!att) return res.status(404).json({ message: 'No active session found.' });
    att.status = 'Present';
    await att.save();
    res.json({ message: 'Break ended 🚀', attendance: att });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- 4️⃣ PUNCH OUT ---------- */
const punchOut = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const { faceDescriptor, dailyReport } = req.body || {};
    const today = getIndianDate();

    if (!dailyReport || dailyReport.trim().length < 5) {
        return res.status(400).json({ message: '⚠️ Daily Work Report is MANDATORY before Punch Out.' });
    }

    const [user, att] = await Promise.all([
      User.findById(userId),
      Attendance.findOne({ userId, date: today, punchOutTime: null })
    ]);

    if (!att) return res.status(400).json({ message: 'No active session or already punched out.' });

    if (faceDescriptor) {
      const stored = parseDescriptorCached(user.faceDescriptor, userId, userDescriptorCache);
      const incoming = parseDescriptorCached(faceDescriptor, typeof faceDescriptor === 'string' ? faceDescriptor : null, inputDescriptorCache);
      if (!stored || !incoming || squaredDistanceEarlyExit(stored, incoming) === Infinity) {
        return res.status(400).json({ message: 'Face mismatch at Punch Out' });
      }
    }

    att.punchOutTime = new Date();
    att.dailyReport = dailyReport;
    att.status = 'Completed'; 

    const grossMs = att.punchOutTime - att.punchInTime;
    const netMs = Math.max(0, grossMs);
    att.netWorkHours = (netMs / 36e5).toFixed(2); 
    if (parseFloat(att.netWorkHours) < 4) att.status = 'HalfDay';

    await att.save();
    res.json({ message: 'Punch Out Successful 🏠', attendance: att });
  } catch (err) {
    console.error('Punch Out Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- 5️⃣ HISTORY ---------- */
const getMyHistory = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const history = await Attendance.find({ userId }).sort({ date: -1 }).limit(31);
    res.json(history);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- 6️⃣ STATS ---------- */
const getAttendanceStats = async (req, res) => {
    try {
        const userId = getReqUserId(req);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

        const records = await Attendance.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        let stats = { present: 0, absent: 0, leaves: 0, halfDays: 0, holidays: 0, wfh: 0, totalWorkingDays: 0 };

        records.forEach(att => {
            if (att.status === 'Present' || att.status === 'Completed') stats.present++;
            if (att.status === 'HalfDay') stats.halfDays++;
            if (att.mode === 'WFH') stats.wfh++;
            if (att.mode === 'Paid Leave') stats.leaves++;
            if (att.mode === 'Unpaid Leave') stats.absent++;
            if (att.mode === 'Holiday') stats.holidays++;
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

module.exports = { punchIn, startBreak, endBreak, punchOut, getMyHistory, getAttendanceStats };
