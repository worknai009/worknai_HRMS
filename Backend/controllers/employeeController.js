// Backend/controllers/employeeController.js
const User = require('../models/User');
const Leave = require('../models/Leave');

let getDateStringInTZ;
try {
  ({ getDateStringInTZ } = require('../utils/timezone'));
} catch (e) {
  getDateStringInTZ = (tz = 'Asia/Kolkata') =>
    new Date().toLocaleDateString('en-CA', { timeZone: tz });
}

const getReqUserId = (req) => {
  if (!req || !req.user) return null;
  return req.user._id?.toString?.() || req.user.id || null;
};

const getCompanyIdFromReq = (req) => {
  return req?.user?.companyId?.toString?.() || req?.tenant?.companyId || null;
};

const getCompanyTZFromReq = (req) => {
  const tz = req?.company?.officeTiming?.timeZone;
  return tz || 'Asia/Kolkata';
};

/* =========================
   ✅ GET MY PROFILE (LATEST)
   - Employee role: salary fields hidden
========================= */
const getMyProfile = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const companyId = getCompanyIdFromReq(req);

    const baseSelect = '-password -faceDescriptor -faceDescriptorVec';
    const employeeSafeSelect = `${baseSelect} -salary -basicSalary`; // ✅ hide salary from employee

    const selectStr = req.user?.role === 'Employee' ? employeeSafeSelect : baseSelect;

    const user = await User.findOne({
      _id: userId,
      ...(companyId ? { companyId } : {}),
      isDeleted: { $ne: true }
    })
      .populate({
        path: 'companyId',
        select: 'name status location radius officeTiming attendanceMethod attendancePolicy timeZone'
      })
      .select(selectStr);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // same policy as login
    if (
      user.role !== 'SuperAdmin' &&
      user.companyId &&
      user.companyId.status &&
      user.companyId.status !== 'Active'
    ) {
      return res.status(403).json({ message: 'Company Account Suspended/Inactive' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('getMyProfile error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const submitWfhRequest = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const companyId = getCompanyIdFromReq(req);
    if (!companyId) return res.status(400).json({ message: 'Your account is not linked to a company. Contact Admin.' });

    if (req.user?.role && req.user.role !== 'Employee') {
      return res.status(403).json({ message: 'Only employees can submit WFH request.' });
    }

    const { lat, lng, address, reason } = req.body || {};

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: 'Valid location coordinates are required.' });
    }

    const user = await User.findOne({ _id: userId, companyId, isDeleted: { $ne: true } });
    if (!user) return res.status(404).json({ message: 'User not found in your company' });

    const tz = getCompanyTZFromReq(req);
    const todayStr = getDateStringInTZ(tz);

    // ✅ Block if ANY leave already exists for today (paid/unpaid/wfh)
    const existing = await Leave.findOne({
      userId,
      companyId,
      date: todayStr,
      status: { $in: ['Pending', 'Approved'] }
    });

    if (existing) {
      return res.status(400).json({ message: 'A leave/WFH request for today already exists.' });
    }

    user.wfhLocation = {
      lat: latNum,
      lng: lngNum,
      address: address || 'Remote Location',
      approvedDate: null
    };
    user.isWfhActive = false;
    await user.save();

    const leave = await Leave.create({
      userId,
      companyId,
      leaveType: 'WFH',
      dayType: 'Full Day',
      daysCount: 1,
      date: todayStr,
      startDate: new Date(`${todayStr}T00:00:00.000Z`),
      endDate: new Date(`${todayStr}T00:00:00.000Z`),
      reason: reason || 'Work From Home Request',
      status: 'Pending'
    });

    return res.status(201).json({
      message: 'WFH Request Sent to HR 📩',
      leave
    });
  } catch (error) {
    console.error('WFH Request Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getMyProfile,
  submitWfhRequest
};
