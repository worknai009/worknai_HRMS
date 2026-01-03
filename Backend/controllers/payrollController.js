const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');

/**
 * GET /hr/payroll/salary-slip/:userId
 * Query: startDate, endDate
 */
const generateSalarySlip = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const attendance = await Attendance.find({
      userId,
      date: { $gte: startStr, $lte: endStr }
    });

    const holidays = await Holiday.find({
      companyId: user.companyId,
      date: { $gte: startStr, $lte: endStr }
    });

    const leaves = await Leave.find({
      userId,
      status: 'Approved'
    });

    /* ===== PAYROLL CALCULATION ===== */
    let present = 0, halfDay = 0, paidLeave = 0;

    attendance.forEach(a => {
      if (a.status === 'HalfDay') halfDay++;
      else if (['Present', 'Completed', 'Punched Out'].includes(a.status)) present++;
    });

    leaves.forEach(l => {
      if (l.leaveType === 'Paid') {
        if (l.dayType === 'Half Day') halfDay++;
        else paidLeave += (l.days || 1);
      }
    });

    const payableDays = present + holidays.length + paidLeave + (halfDay * 0.5);
    const perDaySalary = user.salary ? user.salary / 30 : 0;
    const netSalary = Math.round(perDaySalary * payableDays);

    /* ===== PDF GENERATION ===== */
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Salary_Slip_${user.name.replace(/\s+/g, '_')}.pdf`
    );

    doc.pipe(res);

    // HEADER
    doc.fontSize(20).text('SALARY SLIP', { align: 'center' });
    doc.moveDown();

    // COMPANY
    doc.fontSize(12).text(`Company ID: ${user.companyId}`);
    doc.text(`Pay Period: ${startStr} to ${endStr}`);
    doc.moveDown();

    // EMPLOYEE
    doc.fontSize(14).text('Employee Details');
    doc.fontSize(11);
    doc.text(`Name: ${user.name}`);
    doc.text(`Designation: ${user.designation}`);
    doc.text(`Email: ${user.email}`);
    doc.moveDown();

    // SALARY TABLE
    doc.fontSize(14).text('Salary Breakdown');
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Base Monthly Salary: ₹${user.salary}`);
    doc.text(`Present Days: ${present}`);
    doc.text(`Half Days: ${halfDay}`);
    doc.text(`Paid Leaves: ${paidLeave}`);
    doc.text(`Holidays: ${holidays.length}`);
    doc.moveDown();

    doc.fontSize(13).text(`Net Payable Salary: ₹${netSalary}`, {
      underline: true
    });

    doc.moveDown(2);
    doc.fontSize(10).text(
      'This is a system generated salary slip. No signature required.',
      { align: 'center', color: 'gray' }
    );

    doc.end();
  } catch (error) {
    console.error('Salary Slip Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Salary slip generation failed' });
    }
  }
};

module.exports = { generateSalarySlip };
