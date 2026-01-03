const User = require('../models/User');
const Leave = require('../models/Leave'); // Import Leave Model

/** Helper: robust req.user id getter */
const getReqUserId = (req) => {
  if (!req || !req.user) return null;
  return req.user._id?.toString?.() || req.user.id || null;
};

// Submit WFH Request (Unified with Leave System)
const submitWfhRequest = async (req, res) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { lat, lng, address, reason } = req.body || {};

    if (!lat || !lng) {
      return res.status(400).json({ message: "Location coordinates are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Update User WFH Location (for reference)
    user.wfhLocation = {
      lat: Number(lat),
      lng: Number(lng),
      address: address || "Remote Location",
      approvedDate: null // Will be set on approval if needed
    };
    user.isWfhActive = false;
    await user.save();

    // 2. Create a 'Leave' record of type 'WFH' so HR can see it in requests
    const today = new Date().toISOString().split('T')[0]; // WFH is usually for "Today" or specific dates

    // Check if request already exists for today
    const existingRequest = await Leave.findOne({ 
      userId, 
      date: today, 
      leaveType: 'WFH' 
    });

    if (existingRequest) {
      return res.status(400).json({ message: "WFH Request for today already exists." });
    }

    await Leave.create({
      userId,
      companyId: user.companyId,
      leaveType: 'WFH', // Special type
      date: today,      // Single date logic for now
      startDate: new Date(),
      endDate: new Date(),
      reason: reason || "Work From Home Request",
      status: 'Pending',
      dayType: 'Full Day'
    });

    res.status(200).json({ message: "WFH Request Sent to HR 📩" });
  } catch (error) {
    console.error("WFH Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { submitWfhRequest };