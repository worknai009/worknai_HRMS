// Backend/controllers/hrController.js
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const Company = require('../models/Company');


const OnboardingTemplate = require('../models/OnboardingTemplate');
const OnboardingAssignment = require('../models/OnboardingAssignment');

const PDFDocument = require('pdfkit');

/* ----------------------- Helpers ----------------------- */
const getReqUserId = (req) => req?.user?._id?.toString?.() || req?.user?.id || null;

const isHrRole = (role) => ['Admin', 'CompanyAdmin', 'SuperAdmin'].includes(role);

const clampStr = (s, max = 1000) => {
  if (s == null) return '';
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};

const dateStrInTZ = (date, tz) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD

// robust timezone time -> UTC Date (DST safe)
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

// inclusive list of date strings in TZ
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

const computeNetHours = (punchIn, punchOut) => {
  if (!punchIn || !punchOut) return 0;
  const ms = punchOut.getTime() - punchIn.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Number((ms / 36e5).toFixed(2));
};

const guardSameCompany = (req, targetCompanyId) => {
  if (req.user?.role === 'SuperAdmin') return true;
  if (!req.user?.companyId) return false;
  return String(req.user.companyId) === String(targetCompanyId);
};

/* ----------------------- 1) EMPLOYEE MANAGEMENT ----------------------- */

const getAllEmployees = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const q = { role: 'Employee', isDeleted: { $ne: true } };

    if (req.user.role !== 'SuperAdmin') {
      q.companyId = req.user.companyId;
    } else if (req.query.companyId) {
      q.companyId = req.query.companyId;
    }

    if (req.query.status) q.status = req.query.status;
    if (req.query.search) {
      const s = String(req.query.search).trim();
      q.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } }
      ];
    }

    const employees = await User.find(q)
      .select('-password -faceDescriptor -faceDescriptorVec')
      .sort({ createdAt: -1 })
      .limit(500);

    res.status(200).json(employees);
  } catch (err) {
    console.error('getAllEmployees error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateEmployeeDetails = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId } = req.params;
    const updates = { ...(req.body || {}) };

    delete updates.password;
    delete updates.role;
    delete updates.companyId;
    delete updates.isApproved;
    delete updates.status;
    delete updates.approvedBy;
    delete updates.approvedAt;
    delete updates.faceDescriptor;
    delete updates.faceDescriptorVec;
    delete updates.isDeleted;
    delete updates.deletedAt;

    const user = await User.findById(userId);
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowed = ['name', 'email', 'mobile', 'designation', 'department', 'managerId', 'employeeCode', 'basicSalary', 'salary', 'joiningDate'];
    console.log('updateEmployeeDetails req.body:', req.body); // ✅ DEBUG LOG


    // 1. Generic updates
    for (const k of allowed) {
      if (k in updates && k !== 'basicSalary' && k !== 'salary' && k !== 'joiningDate') {
        user[k] = updates[k];
      }
    }

    // 2. Salary Sync (Update both basicSalary and salary)
    if (updates.basicSalary !== undefined || updates.salary !== undefined) {
      const val = updates.basicSalary !== undefined ? updates.basicSalary : updates.salary;
      const numVal = Number(val);

      if (numVal < 0 || isNaN(numVal)) {
        return res.status(400).json({ message: 'Invalid salary value' });
      }

      user.basicSalary = numVal;
      user.salary = numVal; // Keep legacy field in sync
      console.log('Salary Updated to:', numVal); // ✅ DEBUG LOG
    }

    // 3. Joining Date
    if (updates.joiningDate !== undefined) {
      const d = new Date(updates.joiningDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: 'Invalid joining date' });
      }
      user.joiningDate = d;
    }

    await user.save();

    const safe = user.toJSON();
    res.json({ message: 'Employee updated successfully', user: safe });
  } catch (err) {
    console.error('updateEmployeeDetails error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
};

/**
 * ✅ UPDATED: approveEmployee
 * - Default: onboarding auto-assign OFF
 * - Optional: send { autoAssignOnboarding: true } to enable old behavior
 * - No auto employee/user creation anywhere
 */
const approveEmployee = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId, basicSalary, joiningDate, autoAssignOnboarding } = req.body || {};
    if (!userId || !basicSalary || !joiningDate) {
      return res.status(400).json({ message: 'userId, joiningDate and basicSalary are required.' });
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salaryNum = Number(basicSalary);
    const jDate = new Date(joiningDate);
    if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({ message: 'Invalid salary' });
    }
    if (Number.isNaN(jDate.getTime())) {
      return res.status(400).json({ message: 'Invalid joiningDate' });
    }

    user.isApproved = true;
    user.status = 'Active';
    user.basicSalary = salaryNum;
    user.salary = salaryNum;
    user.joiningDate = jDate;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();

    if (!user.employeeCode) {
      user.employeeCode = `EMP-${String(user._id).slice(-6).toUpperCase()}`;
    }

    await user.save();

    // ✅ IMPORTANT: Default = NO onboarding auto-assign (old employees bhi same registration flow)
    // If you want old behavior sometimes, pass: autoAssignOnboarding: true
    if (autoAssignOnboarding === true) {
      try {
        const template = await OnboardingTemplate.findOne({
          companyId: user.companyId,
          isActive: true
        }).sort({ createdAt: -1 }).lean();

        if (template) {
          const items = (template.items || []).map((it) => {
            const dueAt = it?.dueDays
              ? new Date(jDate.getTime() + Number(it.dueDays) * 86400000)
              : null;

            let desc = it.description || '';
            if (Array.isArray(it.attachments) && it.attachments.length) {
              const attachText = it.attachments
                .map((a) => `• ${a.type === 'link' ? 'Link' : 'File'}: ${a.name || ''} ${a.url || ''}`.trim())
                .join('\n');
              desc = `${desc}\n\nAttachments:\n${attachText}`;
            }

            return {
              templateItemId: it._id,
              title: it.title || '',
              description: desc,
              ownerRole: it.ownerRole || 'Employee',
              dueAt: dueAt || null,
              status: 'Pending',
              doneAt: null,
              comment: ''
            };
          });

          await OnboardingAssignment.findOneAndUpdate(
            { companyId: user.companyId, userId: user._id },
            { $set: { templateId: template._id, status: 'Active', items } },
            { upsert: true, new: true }
          );
        }
      } catch (e) {
        console.error('Onboarding auto-assign failed (non-blocking):', e?.message);
      }
    }

    res.json({
      message: 'Employee Approved & Active 🚀',
      onboardingAutoAssigned: autoAssignOnboarding === true
    });
  } catch (err) {
    console.error('approveEmployee error:', err);
    res.status(500).json({ message: 'Approval failed' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const user = await User.findById(req.params.userId);
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [attendanceCount, leaveCount] = await Promise.all([
      Attendance.countDocuments({ userId: user._id }),
      Leave.countDocuments({ userId: user._id })
    ]);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Exit_Report_${String(user.name || 'Employee').replace(/\s+/g, '_')}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text('EMPLOYEE EXIT REPORT', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Designation: ${user.designation}`);
    doc.text(`Status: Terminated/Left`);
    doc.moveDown();

    doc.text(`Total Working Days Logged: ${attendanceCount}`);
    doc.text(`Total Leaves Taken: ${leaveCount}`);
    doc.moveDown();

    doc.fontSize(10).text('Generated by HRMS System', { align: 'center' });
    doc.end();

    res.on('finish', async () => {
      try {
        await Promise.all([
          Attendance.deleteMany({ userId: user._id }),
          Leave.deleteMany({ userId: user._id }),
          OnboardingAssignment.deleteMany({ userId: user._id }),
          User.deleteOne({ _id: user._id })
        ]);
      } catch (e) {
        console.error('deleteEmployee cleanup failed:', e?.message);
      }
    });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Delete failed' });
  }
};

/* ----------------------- 2) MANUAL ATTENDANCE (HR) ----------------------- */

const addManualAttendance = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId, date, status, remarks, inTime, outTime } = req.body || {};
    if (!userId || !date) return res.status(400).json({ message: 'userId & date required' });

    const user = await User.findById(userId).populate('companyId');
    if (!user || user.isDeleted) return res.status(404).json({ message: 'Employee not found' });

    if (!guardSameCompany(req, user.companyId?._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const company = user.companyId;
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const startTime = company?.officeTiming?.startTime || '09:30';
    const endTime = company?.officeTiming?.endTime || '18:30';

    const safeDate = String(date).trim();

    const punchIn = (status === 'Holiday' || status === 'Absent' || status === 'On Leave')
      ? null
      : zonedTimeToUtc(safeDate, inTime || startTime, tz);

    const punchOut = (status === 'Holiday' || status === 'Absent' || status === 'On Leave')
      ? null
      : zonedTimeToUtc(safeDate, outTime || endTime, tz);

    let netWorkHours = 0;
    if (['Present', 'HalfDay', 'Completed'].includes(status) && punchIn && punchOut) {
      netWorkHours = computeNetHours(punchIn, punchOut);
    }

    // ✅ Only Paid/Unpaid/WFH meaning for payroll:
    const mode =
      status === 'Holiday' ? 'Holiday'
        : status === 'On Leave' ? 'Paid Leave'
          : status === 'Absent' ? 'Unpaid Leave'
            : 'Manual';

    const updateData = {
      userId: user._id,
      companyId: company._id,
      date: safeDate,
      status: status || 'Present',
      mode,
      source: 'MANUAL_HR',
      remarks: clampStr(remarks || 'Manual entry by HR', 800),
      isManualEntry: true,
      addedBy: getReqUserId(req),
      netWorkHours,
      punchInTime: punchIn,
      punchOutTime: punchOut,
      isEdited: true,
      editedBy: req.user._id
    };

    const record = await Attendance.findOneAndUpdate(
      { userId: user._id, date: safeDate, companyId: company._id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Attendance Updated Successfully', data: record });
  } catch (err) {
    console.error('addManualAttendance error:', err);
    res.status(500).json({ message: 'Attendance update failed' });
  }
};

/* ----------------------- 3) HOLIDAY MANAGEMENT ----------------------- */

const markHoliday = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { date, reason } = req.body || {};
    if (!date || !reason) return res.status(400).json({ message: 'date & reason required' });

    const companyId = req.user.role === 'SuperAdmin' ? (req.body.companyId || req.query.companyId) : req.user.companyId;
    if (!companyId) return res.status(400).json({ message: 'Company missing' });

    const exists = await Holiday.findOne({ date, companyId }).lean();
    if (exists) return res.status(400).json({ message: 'Holiday already exists for this date' });

    const holiday = await Holiday.create({
      date: String(date),
      reason: clampStr(reason, 300),
      year: new Date(date).getFullYear(),
      companyId
    });

    const employees = await User.find({
      companyId,
      role: 'Employee',
      status: 'Active',
      isDeleted: { $ne: true }
    }).select('_id').lean();

    const existing = await Attendance.find({ companyId, date: String(date) })
      .select('userId punchInTime punchOutTime')
      .lean();

    const locked = new Set(
      existing
        .filter((a) => a.punchInTime || a.punchOutTime)
        .map((a) => String(a.userId))
    );

    const ops = [];
    for (const emp of employees) {
      if (locked.has(String(emp._id))) continue;

      ops.push({
        updateOne: {
          filter: {
            userId: emp._id,
            date: String(date),
            companyId
          },
          update: {
            $set: {
              status: 'Holiday',
              mode: 'Holiday',
              remarks: clampStr(reason, 300),
              netWorkHours: 0,
              source: 'SYSTEM',
              punchInTime: null,
              punchOutTime: null
            }
          },
          upsert: true
        }
      });
    }

    if (ops.length) {
      await Attendance.bulkWrite(ops, { ordered: false });
    }

    res.status(201).json({
      message: 'Holiday marked & Attendance updated',
      holiday,
      updatedEmployees: ops.length,
      skippedEmployeesWithPunch: locked.size
    });
  } catch (err) {
    console.error('markHoliday error:', err);
    res.status(500).json({ message: 'Failed to mark holiday' });
  }
};

/* ----------------------- 4) EMPLOYEE HISTORY ----------------------- */

const getEmployeeHistory = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const user = await User.findById(req.params.userId).select('-password -faceDescriptor -faceDescriptorVec');
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId)) return res.status(403).json({ message: 'Access denied' });

    // ✅ Legacy compatible company scope
    const history = await Attendance.find({
      userId: user._id,
      $or: [{ companyId: user.companyId }, { companyId: { $exists: false } }]
    })
      .sort({ date: -1 })
      .limit(366);

    res.json({ user, history });
  } catch (err) {
    console.error('getEmployeeHistory error:', err);
    res.status(500).json({ message: 'Fetch failed' });
  }
};


/* ----------------------- 5) PAYROLL STATS (Attendance-driven) ----------------------- */

const getPayrollStats = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId)) return res.status(403).json({ message: 'Access denied' });

    const company = await Company.findById(user.companyId).lean();
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';

    const now = new Date();
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0));
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12, 0, 0));

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const dayStrings = getDateStringsBetweenInTZ(start, end, tz);
    const startStr = dayStrings[0];
    const endStr = dayStrings[dayStrings.length - 1];

    const [attendance, holidays] = await Promise.all([
      Attendance.find({
        userId: user._id,
        date: { $gte: startStr, $lte: endStr },
        $or: [{ companyId: user.companyId }, { companyId: { $exists: false } }]
      }).lean(),
      Holiday.find({ companyId: user.companyId, date: { $gte: startStr, $lte: endStr } }).lean()
    ]);

    const attMap = new Map(attendance.map((a) => [a.date, a]));
    const holidaySet = new Set(holidays.map((h) => h.date));

    let presentDays = 0;
    let halfDays = 0;
    let wfhDays = 0;
    let holidayCount = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;

    for (const d of dayStrings) {
      const a = attMap.get(d);

      if (a) {
        const st = String(a.status || '');
        const mode = String(a.mode || '');

        if (mode === 'Holiday' || st === 'Holiday') { holidayCount++; continue; }
        if (st === 'HalfDay') { halfDays++; continue; }
        if (mode === 'WFH') { wfhDays++; continue; }

        if (mode === 'Paid Leave' || st === 'On Leave') { paidLeaveDays++; continue; }
        if (mode === 'Unpaid Leave' || st === 'Absent') { unpaidLeaveDays++; absentDays++; continue; }

        if (['Present', 'Completed'].includes(st)) { presentDays++; continue; }
      } else {
        if (holidaySet.has(d)) holidayCount++;
        else absentDays++;
      }
    }

    const totalPayableDays = presentDays + wfhDays + paidLeaveDays + holidayCount + (halfDays * 0.5);

    // Fixed 30-day calculation (as per policy)
    const FIXED_MONTH_DAYS = 30;
    const baseSalary = Number(user.basicSalary || user.salary || 0);
    const extraDays = Math.min(10, Math.max(0, parseInt(req.query.extraDays) || 0)); // 0-10 cap

    // unpaidDays = absent + unpaid leave (counted in absentDays)
    const unpaidDays = absentDays;

    let estimatedSalary;
    if (unpaidDays === 0 && extraDays === 0) {
      // Full salary if no unpaid days and no extra adjustment
      estimatedSalary = Math.round(baseSalary);
    } else {
      // Prorate using fixed 30 days
      const perDaySalary = baseSalary > 0 ? baseSalary / FIXED_MONTH_DAYS : 0;
      let paidDays = FIXED_MONTH_DAYS - unpaidDays + extraDays;
      // Cap: paid_days cannot exceed 30 (no exceed monthly)
      paidDays = Math.min(FIXED_MONTH_DAYS, Math.max(0, paidDays));
      estimatedSalary = Math.round(perDaySalary * paidDays);
    }

    res.json({
      userId: user._id,
      employeeName: user.name,
      designation: user.designation,
      basicSalary: baseSalary,
      range: { startDate: startStr, endDate: endStr, timeZone: tz },
      totalPayableDays,
      presentDays,
      wfhDays,
      paidLeaveDays,
      unpaidLeaveDays,
      halfDays,
      holidayCount,
      absentDays,
      extraDays,
      estimatedSalary,
      breakdown: `Present(${presentDays}) + WFH(${wfhDays}) + PaidLeave(${paidLeaveDays}) + Holidays(${holidayCount}) + HalfDays(${halfDays * 0.5}) - Absent(${absentDays})${extraDays > 0 ? ` + Extra(${extraDays})` : ''}`
    });
  } catch (err) {
    console.error('getPayrollStats error:', err);
    res.status(500).json({ message: 'Payroll calculation error' });
  }
};

/* ----------------------- 6) SALARY SLIP PDF (HR) ----------------------- */

const generateSalarySlip = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId } = req.params;

    const user = await User.findById(userId).populate('companyId');
    if (!user || user.isDeleted) return res.status(404).json({ message: 'Employee not found' });

    if (!guardSameCompany(req, user.companyId?._id)) return res.status(403).json({ message: 'Access denied' });

    const company = user.companyId;
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';

    const now = new Date();
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0));
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12, 0, 0));

    const dayStrings = getDateStringsBetweenInTZ(start, end, tz);
    const startStr = dayStrings[0];
    const endStr = dayStrings[dayStrings.length - 1];

    const [attendance, holidays] = await Promise.all([
      Attendance.find({
        userId: user._id,
        date: { $gte: startStr, $lte: endStr },
        $or: [{ companyId: company._id }, { companyId: { $exists: false } }]
      }).lean(),
      Holiday.find({ companyId: company._id, date: { $gte: startStr, $lte: endStr } }).lean()
    ]);

    const attMap = new Map(attendance.map((a) => [a.date, a]));
    const holidaySet = new Set(holidays.map((h) => h.date));

    let presentDays = 0, halfDays = 0, wfhDays = 0, holidayCount = 0, paidLeaveDays = 0, unpaidLeaveDays = 0;

    for (const d of dayStrings) {
      const a = attMap.get(d);
      if (a) {
        const st = String(a.status || '');
        const mode = String(a.mode || '');

        if (mode === 'Holiday' || st === 'Holiday') holidayCount++;
        else if (st === 'HalfDay') halfDays++;
        else if (mode === 'WFH') wfhDays++;
        else if (mode === 'Paid Leave' || st === 'On Leave') paidLeaveDays++;
        else if (mode === 'Unpaid Leave' || st === 'Absent') unpaidLeaveDays++;
        else if (['Present', 'Completed'].includes(st)) presentDays++;
      } else {
        if (holidaySet.has(d)) holidayCount++;
      }
    }

    const totalPayableDays = presentDays + wfhDays + paidLeaveDays + holidayCount + (halfDays * 0.5);

    // Fixed 30-day calculation (as per policy)
    const FIXED_MONTH_DAYS = 30;
    const baseSalary = Number(user.basicSalary || user.salary || 0);
    const extraDays = Math.min(10, Math.max(0, parseInt(req.query.extraDays) || 0)); // 0-10 cap

    // unpaidDays = days that are not paid (unpaid leave + absent)
    const totalUnpaidDays = unpaidLeaveDays;

    let estimatedSalary;
    if (totalUnpaidDays === 0 && extraDays === 0) {
      // Full salary if no unpaid days
      estimatedSalary = Math.round(baseSalary);
    } else {
      // Prorate using fixed 30 days
      const perDaySalary = baseSalary > 0 ? baseSalary / FIXED_MONTH_DAYS : 0;
      let paidDays = FIXED_MONTH_DAYS - totalUnpaidDays + extraDays;
      // Cap: paid_days cannot exceed 30 (no exceed monthly)
      paidDays = Math.min(FIXED_MONTH_DAYS, Math.max(0, paidDays));
      estimatedSalary = Math.round(perDaySalary * paidDays);
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=SalarySlip_${String(user.name || 'Employee').replace(/\s+/g, '_')}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(company?.name || 'COMPANY', { align: 'center' });
    doc.fontSize(9).text(company?.location?.address || '', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('SALARY SLIP', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(11).text(`Employee Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Designation: ${user.designation}`);
    doc.text(`Employee Code: ${user.employeeCode || String(user._id).slice(-6).toUpperCase()}`);
    doc.text(`Pay Period: ${startStr} to ${endStr} (${tz})`);
    doc.moveDown();

    doc.text('------------------------------------------------------------');
    doc.text(`Basic Salary (Monthly): ₹${baseSalary}`);
    doc.text(`Present Days: ${presentDays}`);
    doc.text(`WFH Days: ${wfhDays}`);
    doc.text(`Paid Leave Days: ${paidLeaveDays}`);
    doc.text(`Unpaid Days (Unpaid Leave/Absent): ${unpaidLeaveDays}`);
    doc.text(`Holidays: ${holidayCount}`);
    doc.text(`Half Days: ${halfDays} (counts ${(halfDays * 0.5).toFixed(1)} day)`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text(`Total Payable Days: ${totalPayableDays}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Estimated Salary: ₹${estimatedSalary}`, { align: 'right' });
    doc.font('Helvetica').moveDown(2);

    doc.fontSize(9).text('This is a system generated salary slip. No signature required.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('generateSalarySlip error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'PDF Generation Failed' });
  }
};

/* ----------------------- 7) WFH MANAGEMENT (Backward Compatible) ----------------------- */
const manageWfhRequest = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: 'HR Access Required' });

    const { userId, action, wfhType, date } = req.body || {};
    if (!userId || !action) return res.status(400).json({ message: 'userId and action required' });

    const user = await User.findById(userId).populate('companyId');
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (!guardSameCompany(req, user.companyId?._id)) return res.status(403).json({ message: 'Access denied' });

    const company = user.companyId;
    const tz = company?.officeTiming?.timeZone || 'Asia/Kolkata';
    const dayStr = date ? String(date) : dateStrInTZ(new Date(), tz);

    if (action !== 'Approve') {
      return res.json({ message: 'WFH Request Updated' });
    }

    const startTime = company?.officeTiming?.startTime || '09:30';
    const endTime = company?.officeTiming?.endTime || '18:30';

    const punchIn = zonedTimeToUtc(dayStr, startTime, tz);
    const punchOut = zonedTimeToUtc(dayStr, endTime, tz);

    const half = wfhType === 'HalfDay';
    const net = half ? 4 : Number(company?.officeTiming?.workingHours || 8);

    await Attendance.findOneAndUpdate(
      { userId: user._id, date: dayStr, companyId: company._id },
      {
        $set: {
          userId: user._id,
          companyId: company._id,
          date: dayStr,
          status: half ? 'HalfDay' : 'Present',
          mode: 'WFH',
          source: 'MANUAL_HR',
          punchInTime: punchIn,
          punchOutTime: punchOut,
          netWorkHours: net,
          remarks: 'WFH Approved by HR',
          isManualEntry: true,
          addedBy: getReqUserId(req)
        }
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'WFH Approved & Marked ✅' });
  } catch (err) {
    console.error('manageWfhRequest error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllEmployees,
  updateEmployeeDetails,
  approveEmployee,
  deleteEmployee,
  addManualAttendance,
  markHoliday,
  getEmployeeHistory,
  getPayrollStats,
  generateSalarySlip,
  manageWfhRequest
};
