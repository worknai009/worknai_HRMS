const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Holiday = require("../models/Holiday");
const PDFDocument = require("pdfkit");

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
    const query = { role: "Employee" };
    if (req.user.role !== "SuperAdmin" && req.user.companyId) {
      query.companyId = req.user.companyId;
    }
    const employees = await User.find(query)
      .select("-password -faceDescriptor")
      .sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (err) {
    console.error("Get All Employees Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Employee Details
const updateEmployeeDetails = async (req, res) => {
  try {
    const updates = req.body || {};
    delete updates.status;
    delete updates.isApproved;

    const user = await User.findByIdAndUpdate(req.params.userId, updates, {
      new: true,
    }).select("-password -faceDescriptor");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Employee updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// Approve Employee
const approveEmployee = async (req, res) => {
  try {
    const { userId, basicSalary, joiningDate } = req.body;

    if (!basicSalary || !joiningDate) {
      return res
        .status(400)
        .json({ message: "Joining Date and Basic Salary are required." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        status: "Active",
        basicSalary: Number(basicSalary),
        joiningDate: new Date(joiningDate),
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Employee Approved & Active 🚀" });
  } catch (err) {
    res.status(500).json({ message: "Approval failed" });
  }
};

// Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const attendanceCount = await Attendance.countDocuments({
      userId: user._id,
    });
    const leaveCount = await Leave.countDocuments({ userId: user._id });

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Journey_Report_${user.name.replace(
        /\s+/g,
        "_"
      )}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text("EMPLOYEE JOURNEY REPORT", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Designation: ${user.designation}`);
    doc.text(`Status: ${user.status}`);
    doc.moveDown();
    doc.text(`Total Working Days: ${attendanceCount}`);
    doc.text(`Total Leaves Applied: ${leaveCount}`);
    doc.end();

    res.on("finish", async () => {
      await User.deleteOne({ _id: user._id });
      await Attendance.deleteMany({ userId: user._id });
      await Leave.deleteMany({ userId: user._id });
    });
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: "Delete failed" });
  }
};

/* ================= 2. ATTENDANCE & PAYROLL (UPDATED) ================= */

// ✅ MANUAL ATTENDANCE (UPDATED: Handles Time & Status)
const addManualAttendance = async (req, res) => {
  try {
    const { userId, date, status, remarks, inTime, outTime } = req.body;
    if (!userId || !date)
      return res.status(400).json({ message: "userId & date required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    // Calculate Times
    // If In/Out time provided by HR, use it. Otherwise default to 9 AM - 6 PM
    let punchIn = inTime
      ? new Date(`${date}T${inTime}:00`)
      : new Date(`${date}T09:00:00`);
    let punchOut = outTime
      ? new Date(`${date}T${outTime}:00`)
      : new Date(`${date}T18:00:00`);

    // Calculate Net Hours based on Time
    let netWorkHours = "0.00";
    if (status === "Present" || status === "HalfDay") {
      const diffMs = punchOut - punchIn;
      if (diffMs > 0) {
        netWorkHours = (diffMs / 36e5).toFixed(2); // Convert ms to hours
      }
    }

    // Check if record exists for that date
    const exists = await Attendance.findOne({ userId, date });

    if (exists) {
      exists.status = status;
      exists.remarks = remarks || exists.remarks;
      exists.punchInTime = punchIn;
      exists.punchOutTime = punchOut;
      exists.netWorkHours = netWorkHours;
      exists.isManualEntry = true;

      // If updating to Holiday, change mode
      if (status === "Holiday") exists.mode = "Holiday";

      await exists.save();
      return res.json({ message: "Attendance Updated", data: exists });
    }

    const record = await Attendance.create({
      userId,
      companyId: user.companyId,
      date,
      status,
      remarks: remarks || "Manual entry by HR",
      isManualEntry: true,
      addedBy: getReqUserId(req),
      netWorkHours,
      punchInTime: punchIn,
      punchOutTime: punchOut,
      mode: status === "Holiday" ? "Holiday" : "Manual",
    });

    res.status(201).json({ message: "Manual Attendance Added", data: record });
  } catch (err) {
    console.error("Add Manual Attendance Error:", err);
    res.status(500).json({ message: "Attendance error" });
  }
};

/* ================= HOLIDAY MANAGEMENT ================= */

// Mark Holiday
const markHoliday = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason)
      return res.status(400).json({ message: "date & reason required" });

    const exists = await Holiday.findOne({
      date,
      companyId: req.user.companyId,
    });
    if (exists)
      return res.status(400).json({ message: "Holiday already exists" });

    const holiday = await Holiday.create({
      date,
      reason,
      year: new Date(date).getFullYear(),
      companyId: req.user.companyId,
    });

    // Optional: Auto-mark attendance for all employees as Holiday
    const employees = await User.find({
      companyId: req.user.companyId,
      role: "Employee",
      status: "Active",
    });

    const attendanceOps = employees.map((emp) => ({
      updateOne: {
        filter: { userId: emp._id, date: date },
        update: {
          $set: {
            status: "Holiday",
            mode: "Holiday",
            remarks: reason,
            companyId: req.user.companyId,
            netWorkHours: "0.00",
          },
        },
        upsert: true,
      },
    }));

    if (attendanceOps.length > 0) {
      await Attendance.bulkWrite(attendanceOps);
    }

    res
      .status(201)
      .json({ message: "Holiday marked & Attendance updated", holiday });
  } catch (err) {
    console.error("Mark Holiday Error:", err);
    res.status(500).json({ message: "Failed to mark holiday" });
  }
};

// Get History
const getEmployeeHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const history = await Attendance.find({ userId: user._id }).sort({
      date: -1,
    });
    res.json({ user, history });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ✅ PAYROLL CALCULATION ENGINE (FIXED: Leave Counting)
const getPayrollStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const start = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const sStr = start.toISOString().split("T")[0];
    const eStr = end.toISOString().split("T")[0];

    // Fetch Data
    const attendance = await Attendance.find({
      userId: user._id,
      date: { $gte: sStr, $lte: eStr },
    });
    const holidays = await Holiday.find({
      companyId: user.companyId,
      date: { $gte: sStr, $lte: eStr },
    });

    // ✅ Fix: Get ALL approved leaves, then filter in loop to match range
    const leaves = await Leave.find({ userId: user._id, status: "Approved" });

    let presentDays = 0;
    let halfDays = 0;
    let holidayCount = 0;

    attendance.forEach((a) => {
      if (a.mode === "Holiday" || a.status === "Holiday") holidayCount++;
      else if (a.status === "HalfDay") halfDays++;
      else if (["Present", "Completed", "Punched Out"].includes(a.status))
        presentDays++;
    });

    // Check holidays (avoid double count)
    holidays.forEach((h) => {
      const isRecorded = attendance.find((a) => a.date === h.date);
      if (!isRecorded) holidayCount++;
    });

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    // ✅ Logic to count only leaves falling inside selected date range
    leaves.forEach((l) => {
      const leaveStart = new Date(l.startDate);
      const leaveEnd = new Date(l.endDate);
      const payStart = new Date(sStr);
      const payEnd = new Date(eStr);

      // Check for overlap
      if (leaveStart <= payEnd && leaveEnd >= payStart) {
        // Determine duration
        const days = l.daysCount || 1; // Default to 1 if missing
        const val = l.dayType === "Half Day" ? 0.5 : days;

        if (["Paid", "Sick", "Casual"].includes(l.leaveType)) {
          paidLeaveDays += val;
        } else if (l.leaveType === "Unpaid") {
          unpaidLeaveDays += val;
        }
      }
    });

    const totalPayableDays =
      presentDays + holidayCount + paidLeaveDays + halfDays * 0.5;
    const daysInMonth = getDaysInMonth(
      start.getFullYear(),
      start.getMonth() + 1
    );
    const perDaySalary = user.basicSalary ? user.basicSalary / daysInMonth : 0;
    const estimatedSalary = Math.round(perDaySalary * totalPayableDays);

    res.json({
      basicSalary: user.basicSalary,
      totalPayableDays,
      presentDays,
      halfDays,
      holidayCount,
      paidLeaveDays,
      unpaidLeaveDays,
      estimatedSalary,
      breakdown: `Present(${presentDays}) + Holidays(${holidayCount}) + PaidLeaves(${paidLeaveDays}) + HalfDays(${
        halfDays * 0.5
      })`,
    });
  } catch (err) {
    console.error("Payroll Error:", err);
    res.status(500).json({ message: "Payroll calculation error" });
  }
};

// Generate Salary Slip
const generateSalarySlip = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=SalarySlip.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text("SALARY SLIP", { align: "center", underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${user.name}`);
    doc.text(`Basic Salary: Rs. ${user.basicSalary || 0}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "PDF Generation Failed" });
  }
};

/* ================= 3. WFH MANAGEMENT ================= */
const manageWfhRequest = async (req, res) => {
  try {
    const { userId, action, wfhType, date } = req.body;
    if (action === "Approve") {
      const day = date || new Date().toISOString().split("T")[0];
      const exists = await Attendance.findOne({ userId, date: day });

      if (exists)
        return res.status(400).json({ message: "Attendance already exists" });

      await Attendance.create({
        userId,
        companyId: req.user.companyId,
        date: day,
        status: wfhType === "HalfDay" ? "HalfDay" : "Present",
        mode: "WFH",
        punchInTime: new Date(`${day}T09:00:00`),
        punchOutTime: new Date(`${day}T18:00:00`),
        netWorkHours: wfhType === "HalfDay" ? "4.00" : "8.00",
        remarks: "WFH Approved by HR",
      });
      return res.json({ message: "WFH Approved & Marked ✅" });
    }
    res.json({ message: "Request Updated" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
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
  manageWfhRequest,
};
