const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Helper: Get User ID safely
const getReqUserId = (req) => {
  return req.user?._id?.toString() || req.user?.id || null;
};

// Helper: Calculate number of days
const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    
    // Validate Dates
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
};

/* ================= 1. APPLY LEAVE ================= */
const applyLeave = async (req, res) => {
  try {
    console.log("🔹 Leave Request Received:", req.body);

    // 1. User & Company Validation
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized: User ID missing' });

    if (!req.user.companyId) {
        return res.status(400).json({ message: 'Your account is not linked to a company. Contact Admin.' });
    }

    const { leaveType, dayType, startDate, endDate, reason } = req.body;

    // 2. Validate Fields
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start Date, End Date, and Reason are required' });
    }

    // 3. Date Logic Check
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
        return res.status(400).json({ message: 'End Date cannot be before Start Date' });
    }

    // ✅ CRITICAL NEW LOGIC: Check for Overlapping Leaves
    // Hum check karenge ki kya is user ki koi 'Pending' ya 'Approved' leave
    // in dates ke beech already exist karti hai ya nahi.
    const existingLeave = await Leave.findOne({
        userId: userId,
        status: { $in: ['Pending', 'Approved'] }, // Sirf Active leaves check karo (Rejected wapas apply kar sakte hain)
        $or: [
            // Case 1: New Start Date falls inside an existing leave
            { startDate: { $lte: start }, endDate: { $gte: start } },
            // Case 2: New End Date falls inside an existing leave
            { startDate: { $lte: end }, endDate: { $gte: end } },
            // Case 3: New Leave completely covers an existing leave
            { startDate: { $gte: start }, endDate: { $lte: end } }
        ]
    });

    if (existingLeave) {
        console.log("❌ Duplicate Leave Attempt:", existingLeave._id);
        return res.status(400).json({ 
            message: `You already have a ${existingLeave.status} request for these dates (${new Date(existingLeave.startDate).toLocaleDateString()} to ${new Date(existingLeave.endDate).toLocaleDateString()}).` 
        });
    }

    // 4. Calculate Days
    let daysCount = 1;
    if (dayType === 'Half Day') {
        daysCount = 0.5;
    } else {
        daysCount = calculateDays(startDate, endDate);
    }

    // 5. Create Leave in Database
    const leave = await Leave.create({
      userId,
      companyId: req.user.companyId,
      leaveType,
      dayType,
      startDate,
      endDate,
      daysCount,
      reason,
      status: 'Pending'
    });

    console.log("✅ Leave Applied Successfully:", leave._id);
    res.status(201).json({ message: 'Request Submitted Successfully', leave });

  } catch (err) {
    console.error('🔥 Apply Leave Error:', err); 
    res.status(500).json({ 
        message: 'Server Error: Could not apply leave.',
        error: err.message 
    });
  }
};

/* ================= 2. GET MY LEAVES ================= */
const getMyLeaves = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("Get My Leaves Error:", err);
    res.status(500).json({ message: 'Error fetching leaves' });
  }
};

/* ================= 3. GET ALL LEAVES (HR) ================= */
const getAllLeaves = async (req, res) => {
  try {
    const query = {};
    if (req.user.companyId) {
      query.companyId = req.user.companyId;
    }
    
    const leaves = await Leave.find(query)
      .populate('userId', 'name designation profileImage')
      .sort({ createdAt: -1 });
      
    res.json(leaves);
  } catch (err) {
    console.error("Get All Leaves Error:", err);
    res.status(500).json({ message: 'Error fetching leaves' });
  }
};

/* ================= 4. UPDATE STATUS (HR Action) ================= */
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId, status } = req.body;
    
    // 1. Update Leave Status
    const leave = await Leave.findByIdAndUpdate(leaveId, { 
        status,
        actionBy: req.user._id,
        actionAt: new Date()
    }, { new: true });

    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // 2. If Approved, Create Attendance
    if (status === 'Approved') {
        
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Timezone safe date
            const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            
            // Check Duplicate Attendance
            const exists = await Attendance.findOne({ userId: leave.userId, date: dateStr });
            
            if (!exists) {
                let attStatus = 'On Leave';
                let attMode = 'Leave';
                let netHours = 0;
                let remarks = `Approved: ${leave.leaveType}`;
                let punchIn = null;
                let punchOut = null;

                if (leave.leaveType === 'Unpaid') {
                    attStatus = 'Absent';
                    attMode = 'Unpaid Leave';
                    remarks = "Unpaid Leave Approved (00:00)";
                } 
                else if (['Paid', 'Sick', 'Casual'].includes(leave.leaveType)) {
                    attStatus = leave.dayType === 'Half Day' ? 'HalfDay' : 'On Leave'; 
                    attMode = 'Paid Leave';
                    netHours = leave.dayType === 'Half Day' ? 4 : 8; 
                    punchIn = new Date(`${dateStr}T09:00:00`);
                    punchOut = new Date(`${dateStr}T18:00:00`);
                }
                else if (leave.leaveType === 'WFH') {
                    attStatus = 'Present';
                    attMode = 'WFH';
                    netHours = 8;
                    punchIn = new Date(`${dateStr}T09:00:00`);
                    punchOut = new Date(`${dateStr}T18:00:00`);
                }

                await Attendance.create({
                    userId: leave.userId,
                    companyId: leave.companyId,
                    date: dateStr,
                    status: attStatus,
                    mode: attMode,
                    punchInTime: punchIn, 
                    punchOutTime: punchOut,
                    netWorkHours: netHours,
                    remarks: remarks
                });
            }
        }
    }

    res.json({ message: `Request ${status} successfully` });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: 'Update failed' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus
};