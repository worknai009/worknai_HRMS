const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const PDFDocument = require('pdfkit');

/* ================= HELPER ================= */
const getReqUserId = (req) => {
  if (!req || !req.user) return null;
  return req.user._id?.toString?.() || req.user.id || null;
};

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

/* ================= 1. EMPLOYEE MANAGEMENT ================= */

// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const query = { role: 'Employee' };
    if (req.user.role !== 'SuperAdmin' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }
    const employees = await User.find(query).select('-password -faceDescriptor').sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    console.error('Get All Employees Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update Employee Details
const updateEmployeeDetails = async (req, res) => {
  try {
    const updates = req.body || {};
    
    // Prevent accidental status change via simple update (use approve endpoint instead)
    delete updates.status; 
    delete updates.isApproved;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true }
    ).select('-password -faceDescriptor');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Employee updated successfully', user });
  } catch (err) {
    console.error('Update Employee Error:', err);
    res.status(500).json({ message: 'Update failed' });
  }
};

// ✅ APPROVE EMPLOYEE (Sets Salary & Joining Date)
const approveEmployee = async (req, res) => {
  try {
    const { userId, basicSalary, joiningDate } = req.body;

    if (!basicSalary || !joiningDate) {
      return res.status(400).json({ message: "Joining Date and Basic Salary are required for approval." });
    }

    const user = await User.findByIdAndUpdate(userId, {
      isApproved: true,
      status: 'Active',
      basicSalary: Number(basicSalary),
      joiningDate: new Date(joiningDate),
      approvedBy: req.user._id,
      approvedAt: new Date()
    }, { new: true });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Employee Approved & Active 🚀' });
  } catch (err) {
    console.error('Approve Employee Error:', err);
    res.status(500).json({ message: 'Approval failed' });
  }
};

// ✅ DELETE EMPLOYEE + JOURNEY REPORT (PDF)
const deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const attendanceCount = await Attendance.countDocuments({ userId: user._id });
    const leaveCount = await Leave.countDocuments({ userId: user._id });

    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Journey_Report_${user.name.replace(/\s+/g, '_')}.pdf`);

    doc.pipe(res);

    // PDF Header
    doc.fontSize(20).text('EMPLOYEE JOURNEY REPORT', { align: 'center' });
    doc.moveDown();
    
    // Profile
    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Designation: ${user.designation}`);
    doc.text(`Status: ${user.status}`);
    doc.text(`Joined: ${user.joiningDate ? new Date(user.joiningDate).toDateString() : 'N/A'}`);
    doc.moveDown();

    // Stats
    doc.fontSize(14).text('Performance Stats', { underline: true });
    doc.fontSize(12).text(`Total Working Days: ${attendanceCount}`);
    doc.text(`Total Leaves Applied: ${leaveCount}`);
    
    doc.end();

    // Hard Delete after PDF generation
    res.on('finish', async () => {
      await User.deleteOne({ _id: user._id });
      await Attendance.deleteMany({ userId: user._id });
      await Leave.deleteMany({ userId: user._id });
    });

  } catch (err) {
    console.error('Delete Employee Error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Delete failed' });
  }
};

/* ================= 2. ATTENDANCE & PAYROLL ================= */

// Manual Attendance (HR Override)
const addManualAttendance = async (req, res) => {
  try {
    const { userId, date, status, remarks } = req.body;
    if (!userId || !date) return res.status(400).json({ message: 'userId & date required' });

    // Check if record exists
    const exists = await Attendance.findOne({ userId, date });
    if (exists) {
        // Allow updating existing record
        exists.status = status;
        exists.remarks = remarks || exists.remarks;
        await exists.save();
        return res.json({ message: 'Attendance Updated', data: exists });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const record = await Attendance.create({
      userId,
      companyId: user.companyId,
      date,
      status,
      remarks: remarks || 'Manual entry by HR',
      isManualEntry: true,
      addedBy: getReqUserId(req),
      netWorkHours: status === 'Present' ? '8.00' : '0.00',
      punchInTime: new Date(`${date}T09:00:00`),
      punchOutTime: new Date(`${date}T18:00:00`)
    });

    res.status(201).json({ message: 'Manual Attendance Added', data: record });
  } catch (err) {
    console.error('Add Manual Attendance Error:', err);
    res.status(500).json({ message: 'Attendance error' });
  }
};

/* ================= HOLIDAY MANAGEMENT ================= */

// Mark Holiday
const markHoliday = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return res.status(400).json({ message: 'date & reason required' });

    const exists = await Holiday.findOne({ date, companyId: req.user.companyId });
    if (exists) return res.status(400).json({ message: 'Holiday already exists' });

    const holiday = await Holiday.create({
      date,
      reason,
      year: new Date(date).getFullYear(),
      companyId: req.user.companyId
    });

    res.status(201).json({ message: 'Holiday marked successfully', holiday });
  } catch (err) {
    console.error('Mark Holiday Error:', err);
    res.status(500).json({ message: 'Failed to mark holiday' });
  }
};

// Get Employee History (Kundali View)
const getEmployeeHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sort by date descending (Newest first)
    const history = await Attendance.find({ userId: user._id }).sort({ date: -1 });
    res.json({ user, history });
  } catch (err) {
    res.status(500).json({ message: 'Fetch failed' });
  }
};

// ✅ PAYROLL CALCULATION ENGINE (UPDATED Logic)
const getPayrollStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];

    // 1. Fetch Attendance (Includes WFH marked as Present/HalfDay)
    const attendance = await Attendance.find({
      userId: user._id,
      date: { $gte: sStr, $lte: eStr }
    });

    // 2. Fetch Holidays
    const holidays = await Holiday.find({
      companyId: user.companyId,
      date: { $gte: sStr, $lte: eStr }
    });

    // 3. Fetch Approved Paid Leaves
    // Only fetch leaves that fall within the range and are PAID
    const leaves = await Leave.find({
      userId: user._id,
      status: 'Approved',
      startDate: { $gte: start }, 
      // Note: Ideally filter leaves overlapping the range properly
    });

    // --- LOGIC ---
    let presentDays = 0;
    let halfDays = 0;
    let wfhDays = 0;

    attendance.forEach(a => {
      // Skip if before joining
      if (user.joiningDate && new Date(a.date) < new Date(user.joiningDate)) return;

      if (a.mode === 'WFH') wfhDays++; // Track for stats

      if (a.status === 'HalfDay') halfDays++;
      else if (['Present', 'Completed', 'Punched Out'].includes(a.status)) presentDays++;
    });

    // Count Paid Leaves
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    leaves.forEach(l => {
      // Logic: If leaveType is Paid/Sick/Casual -> It's Paid
      if (['Paid', 'Sick', 'Casual'].includes(l.leaveType)) { 
         paidLeaveDays += (l.dayType === 'Half Day' ? 0.5 : (l.daysCount || 1));
      } else if (l.leaveType === 'Unpaid') {
         unpaidLeaveDays += (l.dayType === 'Half Day' ? 0.5 : (l.daysCount || 1));
      }
      // Note: WFH requests are tracked via Attendance (mode='WFH') once approved
    });

    const holidayCount = holidays.length;

    // TOTAL PAYABLE DAYS FORMULA
    // Present (Inc WFH) + Holidays + Paid Leaves + (Half Days * 0.5)
    const totalPayableDays = presentDays + holidayCount + paidLeaveDays + (halfDays * 0.5);
    
    // Salary Calc
    const daysInMonth = getDaysInMonth(start.getFullYear(), start.getMonth() + 1);
    const perDaySalary = user.basicSalary ? (user.basicSalary / daysInMonth) : 0;
    const estimatedSalary = Math.round(perDaySalary * totalPayableDays);

    res.json({
      basicSalary: user.basicSalary,
      totalPayableDays,
      presentDays,
      halfDays,
      holidayCount,
      paidLeaveDays,
      unpaidLeaveDays,
      wfhDays,
      estimatedSalary,
      breakdown: `Present(${presentDays}) + Holidays(${holidayCount}) + PaidLeaves(${paidLeaveDays}) + HalfDays(${halfDays*0.5})`
    });

  } catch (err) {
    console.error('Payroll Error:', err);
    res.status(500).json({ message: 'Payroll calculation error' });
  }
};

// Generate Salary Slip (PDF)
const generateSalarySlip = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SalarySlip_${user.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('SALARY SLIP', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${user.name}`);
    doc.text(`ID: ${user._id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Basic Salary: Rs. ${user.basicSalary || 0}`);
    doc.moveDown();
    doc.fontSize(10).text('* This is a computer-generated document.', { align: 'center' });
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'PDF Generation Failed' });
  }
};

/* ================= 3. WFH MANAGEMENT ================= */
const manageWfhRequest = async (req, res) => {
  try {
    const { userId, action, wfhType, date } = req.body;
    
    if (action === 'Approve') {
      const day = date || new Date().toISOString().split('T')[0];
      const exists = await Attendance.findOne({ userId, date: day });
      
      if (exists) return res.status(400).json({ message: 'Attendance already exists for this date' });

      await Attendance.create({
        userId,
        companyId: req.user.companyId,
        date: day,
        status: wfhType === 'HalfDay' ? 'HalfDay' : 'Present',
        mode: 'WFH',
        punchInTime: new Date(`${day}T09:00:00`), 
        punchOutTime: new Date(`${day}T18:00:00`),
        netWorkHours: wfhType === 'HalfDay' ? '4.00' : '8.00',
        remarks: 'WFH Approved by HR'
      });

      return res.json({ message: 'WFH Approved & Attendance Marked ✅' });
    }
    res.json({ message: 'Request Updated' });
  } catch (err) {
    console.error('WFH Error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllEmployees,
  updateEmployeeDetails,
  approveEmployee,
  deleteEmployee,
  addManualAttendance,
  getEmployeeHistory,
  markHoliday,
  getPayrollStats,
  generateSalarySlip,
  manageWfhRequest
};