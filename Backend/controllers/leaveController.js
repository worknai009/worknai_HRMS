// Backend/controllers/leaveController.js
const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');

/* ---------------- Helpers ---------------- */
const getReqUserId = (req) => req?.user?._id?.toString?.() || req?.user?.id || null;

const clampStr = (s, max = 1000) => {
  if (s == null) return '';
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};

const isHrRole = (role) => ['Admin', 'CompanyAdmin', 'SuperAdmin'].includes(role);

const dateStrInTZ = (date, tz) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD

const calculateDaysInclusive = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const diff = Math.floor(
    (Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()) -
      Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())) / 86400000
  );
  return diff + 1;
};

// Robust timezone time -> UTC Date
const zonedTimeToUtc = (dateStr, timeStr, tz) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);

  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = Object.fromEntries(
    dtf.formatToParts(guess)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );

  const tzAsUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  const offsetMs = tzAsUTC - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
};

const getDateStringsBetweenInTZ = (startDate, endDate, tz) => {
  const startStr = dateStrInTZ(startDate, tz);
  const endStr = dateStrInTZ(endDate, tz);

  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);

  let cursor = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const end = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));

  const out = [];
  while (cursor.getTime() <= end.getTime()) {
    out.push(dateStrInTZ(cursor, tz));
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return out;
};

const normalizeLeaveType = (v) => {
  const t = String(v || '').trim();
  const lower = t.toLowerCase();
  if (lower === 'paid' || lower === 'paid leave') return 'Paid';
  if (lower === 'unpaid' || lower === 'unpaid leave') return 'Unpaid';
  if (lower === 'wfh' || lower === 'work from home') return 'WFH';
  // legacy → paid
  if (lower === 'sick' || lower === 'casual') return 'Paid';
  return t;
};

// Only allow these in NEW requests
const ALLOWED_REQUEST_TYPES = new Set(['Paid', 'Unpaid', 'WFH']);

const buildAttendanceForLeaveDay = (leave, company, dateStr, tz) => {
  const startTime = company?.officeTiming?.startTime || '09:30';
  const endTime = company?.officeTiming?.endTime || '18:30';

  const leaveType = normalizeLeaveType(leave.leaveType);

  // Defaults (Paid)
  let status = 'On Leave';
  let mode = 'Paid Leave';
  let netWorkHours = 0;
  let punchInTime = null;
  let punchOutTime = null;
  let remarks = `Approved: ${leaveType}`;

  if (leaveType === 'Unpaid') {
    status = 'Absent';
    mode = 'Unpaid Leave';
    netWorkHours = 0;
    remarks = 'Unpaid Leave Approved';
  } else if (leaveType === 'WFH') {
    status = 'Present';
    mode = 'WFH';
    netWorkHours = leave.dayType === 'Half Day' ? 4 : Number(company?.officeTiming?.workingHours || 8);
    punchInTime = zonedTimeToUtc(dateStr, startTime, tz);
    punchOutTime = zonedTimeToUtc(dateStr, endTime, tz);
    remarks = 'WFH Approved';
  } else {
    // Paid (including legacy Sick/Casual mapped → Paid)
    mode = 'Paid Leave';
    if (leave.dayType === 'Half Day') {
      status = 'HalfDay';
      netWorkHours = 4;
    } else {
      status = 'On Leave';
      netWorkHours = Number(company?.officeTiming?.workingHours || 8);
    }
    punchInTime = zonedTimeToUtc(dateStr, startTime, tz);
    punchOutTime = zonedTimeToUtc(dateStr, endTime, tz);
  }

  return { status, mode, netWorkHours, punchInTime, punchOutTime, remarks };
};

// decide if we can override an existing attendance for leave approval
const canOverrideAttendance = (att) => {
  if (!att) return true;
  if (att.isManualEntry) return false;
  if (att.punchInTime || att.punchOutTime) return false;

  // If employee already punched or HR marked, don't override.
  // BUT if it's SYSTEM/Not Started placeholder, override allowed.
  const status = String(att.status || '');
  const source = String(att.source || '');
  if (status === 'Not Started') return true;
  if (source === 'SYSTEM') return true;

  return false;
};

/* ================= 1) APPLY LEAVE (Employee) ================= */
const applyLeave = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized: User ID missing' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const companyId = user.companyId;
    if (!companyId) return res.status(400).json({ message: 'Your account is not linked to a company.' });

    const company = await Company.findById(companyId).lean();
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';

    let { leaveType, dayType, startDate, endDate, reason } = req.body || {};
    leaveType = normalizeLeaveType(leaveType);

    // ✅ STRICT: only 3 types for new requests
    if (!ALLOWED_REQUEST_TYPES.has(leaveType)) {
      return res.status(400).json({ message: 'Only Paid / Unpaid / WFH are allowed.' });
    }

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start Date, End Date, and Reason are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid startDate/endDate' });
    }
    if (end < start) return res.status(400).json({ message: 'End Date cannot be before Start Date' });

    if (dayType === 'Half Day') {
      const sStr = dateStrInTZ(start, tz);
      const eStr = dateStrInTZ(end, tz);
      if (sStr !== eStr) return res.status(400).json({ message: 'Half Day leave must be for a single date' });
    }

    const existingLeave = await Leave.findOne({
      companyId,
      userId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: start }, endDate: { $gte: start } },
        { startDate: { $lte: end }, endDate: { $gte: end } },
        { startDate: { $gte: start }, endDate: { $lte: end } }
      ]
    }).lean();

    if (existingLeave) {
      return res.status(400).json({
        message: `You already have a ${existingLeave.status} request for overlapping dates.`
      });
    }

    let daysCount = 1;
    if (dayType === 'Half Day') daysCount = 0.5;
    else daysCount = calculateDaysInclusive(start, end);

    const legacyDate = dateStrInTZ(start, tz);

    const leave = await Leave.create({
      userId,
      companyId,
      leaveType,
      dayType,
      startDate: start,
      endDate: end,
      daysCount,
      reason: clampStr(reason, 1200),
      date: legacyDate,
      status: 'Pending'
    });

    return res.status(201).json({ message: 'Request Submitted Successfully', leave });
  } catch (err) {
    console.error('applyLeave error:', err);
    return res.status(500).json({ message: 'Server Error: Could not apply leave.' });
  }
};

/* ================= 2) GET MY LEAVES (Employee) ================= */
const getMyLeaves = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json(leaves);
  } catch (err) {
    console.error('getMyLeaves error:', err);
    return res.status(500).json({ message: 'Error fetching leaves' });
  }
};

/* ================= 3) GET ALL LEAVES (HR) ================= */
const getAllLeaves = async (req, res) => {
  try {
    if (!req.user?.companyId && req.user?.role !== 'SuperAdmin') {
      return res.status(400).json({ message: 'Company missing' });
    }

    const query = {};
    if (req.user.role !== 'SuperAdmin') query.companyId = req.user.companyId;
    if (req.query.status) query.status = req.query.status;

    const leaves = await Leave.find(query)
      .populate('userId', 'name designation profileImage email')
      .sort({ createdAt: -1 });

    return res.json(leaves);
  } catch (err) {
    console.error('getAllLeaves error:', err);
    return res.status(500).json({ message: 'Error fetching leaves' });
  }
};

/* ================= 4) UPDATE STATUS (HR Action) ================= */
const updateLeaveStatus = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { leaveId, status, rejectReason } = req.body || {};
    if (!leaveId || !status) return res.status(400).json({ message: 'leaveId and status required' });

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // SaaS isolation
    if (req.user.role !== 'SuperAdmin' && leave.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // ✅ normalize old values so Casual/Sick never create wrong attendance
    leave.leaveType = normalizeLeaveType(leave.leaveType);

    // update leave
    leave.status = status;
    leave.actionBy = req.user._id;
    leave.actionAt = new Date();
    if (status === 'Rejected') {
      leave.rejectReason = clampStr(rejectReason || '', 800);
    } else {
      leave.rejectReason = '';
    }
    await leave.save();

    if (status !== 'Approved') {
      return res.json({ message: 'Request Rejected successfully' });
    }

    const company = await Company.findById(leave.companyId).lean();
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';

    const days = getDateStringsBetweenInTZ(leave.startDate, leave.endDate, tz);
    const finalDays = leave.dayType === 'Half Day' ? [days[0]] : days;

    // Fetch existing attendance once
    const existing = await Attendance.find({
      userId: leave.userId,
      companyId: leave.companyId,
      date: { $in: finalDays }
    }).select('date status mode source isManualEntry punchInTime punchOutTime').lean();

    const map = new Map(existing.map((x) => [x.date, x]));

    const ops = [];
    let updatedOrUpserted = 0;
    let skipped = 0;

    for (const dStr of finalDays) {
      const prev = map.get(dStr);
      if (!canOverrideAttendance(prev)) {
        skipped++;
        continue;
      }

      const attPack = buildAttendanceForLeaveDay(leave, company, dStr, tz);

      ops.push({
        updateOne: {
          filter: { userId: leave.userId, companyId: leave.companyId, date: dStr },
          update: {
            $set: {
              status: attPack.status,
              mode: attPack.mode,
              punchInTime: attPack.punchInTime,
              punchOutTime: attPack.punchOutTime,
              netWorkHours: attPack.netWorkHours,
              remarks: attPack.remarks,
              source: 'SYSTEM',
              isManualEntry: false,
              addedBy: null
            },
            $setOnInsert: {
              userId: leave.userId,
              companyId: leave.companyId,
              date: dStr
            }
          },
          upsert: true
        }
      });

      updatedOrUpserted++;
    }

    if (ops.length > 0) {
      await Attendance.bulkWrite(ops, { ordered: false });
    }

    return res.json({
      message: 'Request Approved successfully',
      attendanceUpsertedOrUpdated: updatedOrUpserted,
      attendanceSkipped: skipped
    });
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    return res.status(500).json({ message: 'Update failed' });
  }
};

/* ================= 5) GET EMPLOYEE LEAVES (HR View) ================= */
const getEmployeeLeaves = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId } = req.params;
    const user = await User.findById(userId).select('companyId');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure HR and Employee are in same company (or SuperAdmin)
    if (req.user.role !== 'SuperAdmin' && String(user.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json(leaves);
  } catch (err) {
    console.error('getEmployeeLeaves error:', err);
    return res.status(500).json({ message: 'Error fetching employee leaves' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getEmployeeLeaves
};
