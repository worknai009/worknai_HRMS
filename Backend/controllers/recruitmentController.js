// Backend/controllers/recruitmentController.js
"use strict";
const mongoose = require("mongoose");
const path = require("path");

const Job = require("../models/Job");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const { sha256File } = require("../utils/fileSecurity");

const HR_ROLES = new Set(["Admin", "CompanyAdmin", "SuperAdmin"]);
const isHrRole = (role) => HR_ROLES.has(role);

const ensureObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const normalizeEmail = (email) => String(email || "").toLowerCase().trim();
const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const clampStr = (s, max = 2000) => {
  if (s == null) return "";
  const t = String(s);
  return t.length > max ? t.slice(0, max) : t;
};
const relUploadPath = (absPath) => {
  if (!absPath) return "";
  return path.relative(process.cwd(), absPath).split(path.sep).join("/");
};

const getCompanyIdForHr = (req) => {
  if (req.user?.role === "SuperAdmin") return req.query.companyId || req.body.companyId;
  return req.user?.companyId;
};

const pushTimeline = (app, { by, action, meta }) => {
  app.timeline = Array.isArray(app.timeline) ? app.timeline : [];
  app.timeline.push({ at: new Date(), by: by || null, action: action || "", meta: meta || {} });
};

const getUploadedResume = (req) => {
  // supports multer array OR fields
  if (Array.isArray(req.files) && req.files.length) return req.files[0];
  const f1 = req.files?.files?.[0];
  const f2 = req.files?.resume?.[0];
  return f1 || f2 || null;
};

const buildResumeMeta = async (file) => {
  if (!file?.path) return null;
  const hash = await sha256File(file.path);
  return {
    url: relUploadPath(file.path),
    name: file.originalname || "",
    mime: file.mimetype || "",
    size: Number(file.size || 0),
    sha256: hash || "",
  };
};

/* ================= PUBLIC FLOW ================= */

// Public Jobs
// Public Jobs (with Pagination & Search)
const listJobs = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    const q = {};

    // Search logic (Title or Department)
    if (search) {
      const regex = new RegExp(search, "i");
      q.$or = [{ title: regex }, { department: regex }];
    }

    // public list
    if (!req.user) {
      if (req.query.companyId) q.companyId = req.query.companyId;
      q.status = "Open";
    } else {
      // HR list
      if (!isHrRole(req.user.role)) return res.status(403).json({ message: "Access Denied" });
      q.companyId = getCompanyIdForHr(req);
    }

    const jobs = await Job.find(q)
      .populate("companyId", "companyName name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(jobs);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

const getJob = async (req, res) => {
  try {
    const j = await Job.findById(req.params.id);
    if (!j) return res.status(404).json({ message: "Job not found" });
    return res.json(j);
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const createPublicApplication = async (req, res) => {
  try {
    const { jobId, name, email, mobile, totalExperience, currentCTC, expectedCTC, noticePeriodDays, passingYear, notes } = req.body;

    if (!jobId || !ensureObjectId(jobId)) return res.status(400).json({ message: "Job ID required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.status !== "Open") return res.status(400).json({ message: "Job is closed." });

    const companyId = job.companyId;

    const file = getUploadedResume(req);
    const resumeMeta = file ? await buildResumeMeta(file) : null;

    const normEmail = normalizeEmail(email);

    const candPayload = {
      name: String(name || "").trim(),
      email: normEmail,
      mobile: String(mobile || "").trim(),
      source: "Portal",
      totalExperience: toNum(totalExperience, 0),
      currentCTC: toNum(currentCTC, 0),
      expectedCTC: toNum(expectedCTC, 0),
      noticePeriodDays: toNum(noticePeriodDays, 0),
      passingYear: String(passingYear || "").trim(), // ✅ NEW
      notes: clampStr(notes || "", 5000),
      resumeFile: resumeMeta || null,
    };

    // readable trackId
    const trackId = `APP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;

    const app = await Application.create({
      companyId,
      jobId,
      trackId,
      candidateId: null,
      candidate: candPayload,
      stage: "Applied",
      timeline: [{ at: new Date(), action: "Applied via Portal", meta: { trackId } }],
    });

    return res.status(201).json({
      message: "Applied successfully ✅",
      applicationId: app._id,
      trackId,
      email: candPayload.email,
    });
  } catch (e) {
    console.error("Apply Error:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

// Check Status (Public)
const checkApplicationStatus = async (req, res) => {
  try {
    const { email, applicationId } = req.body;
    if (!email || !applicationId) return res.status(400).json({ message: "Email & Application ID required" });

    const inputEmail = normalizeEmail(email);

    let app = null;

    app = await Application.findOne({ trackId: applicationId }).populate("jobId", "title");
    if (!app) app = await Application.findOne({ "timeline.meta.trackId": applicationId }).populate("jobId", "title");
    if (!app && ensureObjectId(applicationId)) app = await Application.findById(applicationId).populate("jobId", "title");

    if (!app) return res.status(404).json({ message: "Application not found with this ID." });

    const snapEmail = normalizeEmail(app.candidate?.email);
    if (!snapEmail || snapEmail !== inputEmail) return res.status(404).json({ message: "Email does not match application record." });

    // ✅ Dynamic Feedback
    let feedback = "Your application is under review.";
    let interviewDetails = null;

    if (app.stage === "Rejected") {
      feedback = "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.";
    } else if (app.stage === "Hired") {
      feedback = "Congratulations! You have been selected.";
    } else if (app.stage === "Interview") {
      // Find latest interview
      const interview = await Interview.findOne({ applicationId: app._id }).sort({ scheduledAt: -1 });
      if (interview) {
        feedback = "You have an interview scheduled.";
        interviewDetails = {
          mode: interview.mode,
          location: interview.location || interview.meetingLink || "Remote",
          scheduledAt: interview.scheduledAt,
          notes: interview.notes,
        };
      } else {
        feedback = "Interview process initiated. Pending scheduling.";
      }
    } else if (app.stage === "Screened") {
      feedback = "Your profile has been screened and shortlisted.";
    }

    return res.json({
      jobTitle: app.jobId?.title || "Unknown Role",
      stage: app.stage,
      updatedAt: app.updatedAt,
      feedback,
      interview: interviewDetails,
    });
  } catch (e) {
    console.error("Check Status Error:", e);
    return res.status(500).json({ message: "Error checking status" });
  }
};

// ✅ Respond to Interview (Public)
const respondToInterview = async (req, res) => {
  try {
    const { interviewId, email, response, note } = req.body;

    if (!interviewId || !email || !response) {
      return res.status(400).json({ message: "Missing required fields: interviewId, email, response" });
    }

    const interview = await Interview.findById(interviewId).populate("applicationId");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Security: verify email matches application candidate
    const app = interview.applicationId;
    if (!app || normalizeEmail(app.candidate?.email) !== normalizeEmail(email)) {
      return res.status(403).json({ message: "Unauthorized: Email does not match application." });
    }

    const validResponses = ["Confirmed", "Declined", "RescheduleRequested"];
    if (!validResponses.includes(response)) {
      return res.status(400).json({ message: "Invalid response status. Valid: " + validResponses.join(", ") });
    }

    interview.candidateResponse = response;
    interview.candidateResponseNote = note || "";
    await interview.save();

    return res.json({ message: "Response recorded", candidateResponse: interview.candidateResponse });
  } catch (e) {
    console.error("Respond Interview Error:", e);
    return res.status(500).json({ message: "Error recording response" });
  }
};

/* ================= HR FLOW ================= */

const createJob = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);
    const {
      title, department, location, employmentType, openings, description,
      experience, passingYear, salaryRange, contactEmail, skills
    } = req.body;

    // Parse skills if string
    let parsedSkills = [];
    if (skills) {
      parsedSkills = Array.isArray(skills) ? skills : String(skills).split(",").map(s => s.trim()).filter(Boolean);
    }

    const job = await Job.create({
      companyId,
      createdBy: req.user._id,
      title,
      department,
      location,
      employmentType,
      openings: toNum(openings, 1),
      description,
      experience: experience || "Fresher",
      passingYear: passingYear || "",
      salaryRange: salaryRange || "",
      contactEmail: contactEmail || "",
      education: req.body.education || "", // ✅ NEW
      deadline: req.body.deadline ? new Date(req.body.deadline) : null, // ✅ NEW
      skills: parsedSkills,
      status: "Open",
    });

    return res.status(201).json({ message: "Job created ✅", job });
  } catch (e) {
    console.error("createJob error:", e);
    return res.status(500).json({ message: "Server error: " + e.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const companyId = getCompanyIdForHr(req);
    const job = await Job.findOneAndUpdate({ _id: req.params.id, companyId }, req.body, { new: true });
    return res.json({ message: "Updated", job });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteJob = async (req, res) => {
  try {
    const companyId = getCompanyIdForHr(req);
    await Job.findOneAndDelete({ _id: req.params.id, companyId });
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const listApplications = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);

    const apps = await Application.find({ companyId }).populate("jobId", "title").sort({ createdAt: -1 });
    return res.json(apps);
  } catch (e) {
    console.error("listApplications error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

// ✅ NEW: get single application (for HR modal/view)
const getApplication = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });
    const companyId = getCompanyIdForHr(req);

    const id = req.params.id;
    if (!ensureObjectId(id)) return res.status(400).json({ message: "Invalid ID" });

    const app = await Application.findOne({ _id: id, companyId }).populate("jobId", "title");
    if (!app) return res.status(404).json({ message: "Application not found" });

    return res.json(app);
  } catch (e) {
    console.error("getApplication error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const updateApplicationStage = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const { stage } = req.body;
    if (!stage) return res.status(400).json({ message: "stage required" });

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "App not found" });

    const prev = app.stage;
    app.stage = String(stage);

    pushTimeline(app, { by: req.user._id, action: `Stage: ${prev} -> ${stage}` });

    // ✅ IMPORTANT: Hired = OFFLINE ONLY (NO Employee auto-create)
    if (String(stage) === "Hired") {
      pushTimeline(app, {
        by: req.user._id,
        action: "Marked as Hired (Offline)",
        meta: { note: "No employee auto-created" },
      });
    }

    await app.save();
    return res.json({ message: "Status Updated", application: app });
  } catch (e) {
    console.error("updateApplicationStage error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

// ✅ NEW: update-stage by body (compatibility)
const updateApplicationStageByBody = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });
    const { applicationId, stage } = req.body;
    if (!applicationId || !ensureObjectId(applicationId)) return res.status(400).json({ message: "applicationId required" });
    if (!stage) return res.status(400).json({ message: "stage required" });

    req.params.id = applicationId;
    return updateApplicationStage(req, res);
  } catch (e) {
    console.error("updateApplicationStageByBody error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const scheduleInterview = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const { applicationId, scheduledAt, mode, meetingLink, location, notes } = req.body;
    if (!applicationId || !ensureObjectId(applicationId)) return res.status(400).json({ message: "Application ID required" });

    const companyId = getCompanyIdForHr(req);
    const app = await Application.findOne({ _id: applicationId, companyId });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const interview = await Interview.create({
      companyId,
      applicationId,
      scheduledAt,
      mode,
      meetingLink,
      location,
      notes,
      status: "Scheduled",
    });

    const prev = app.stage;
    app.stage = "Interview"; // ✅ UI friendly
    pushTimeline(app, { by: req.user._id, action: "Interview Scheduled", meta: { interviewId: interview._id, from: prev } });
    await app.save();

    return res.status(201).json({ message: "Interview Scheduled", interview });
  } catch (e) {
    console.error("scheduleInterview error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const listInterviews = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);

    const interviews = await Interview.find({ companyId })
      .populate({
        path: "applicationId",
        populate: [{ path: "jobId", select: "title" }],
        select: "candidate trackId stage jobId createdAt",
      })
      .sort({ scheduledAt: 1 });

    return res.json(interviews);
  } catch (e) {
    console.error("listInterviews error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const updateInterview = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    const upd = { ...req.body };
    if (upd.scheduledAt) upd.scheduledAt = new Date(upd.scheduledAt);

    const interview = await Interview.findOneAndUpdate({ _id: id, companyId }, upd, { new: true });
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    return res.json({ message: "Updated", interview });
  } catch (e) {
    console.error("updateInterview error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const deleteInterview = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);
    const id = req.params.id;

    const deleted = await Interview.findOneAndDelete({ _id: id, companyId });
    if (!deleted) return res.status(404).json({ message: "Interview not found" });

    return res.json({ message: "Interview Deleted Successfully" });
  } catch (e) {
    console.error("deleteInterview error:", e);
    return res.status(500).json({ message: "Error deleting interview" });
  }
};

const deleteApplication = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);

    const app = await Application.findOneAndDelete({ _id: req.params.id, companyId });
    if (!app) return res.status(404).json({ message: "Application not found" });

    return res.json({ message: "Application Deleted Successfully" });
  } catch (e) {
    console.error("deleteApplication error:", e);
    return res.status(500).json({ message: "Error deleting application" });
  }
};

// Candidates derived
const listCandidates = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);

    const apps = await Application.find({ companyId }).select("candidate trackId createdAt").sort({ createdAt: -1 }).lean();

    const seen = new Set();
    const derived = [];
    for (const a of apps) {
      const em = normalizeEmail(a?.candidate?.email);
      if (!em || seen.has(em)) continue;
      seen.add(em);
      derived.push({
        _id: a._id, // application id as candidate-id
        ...a.candidate,
        trackId: a.trackId || "",
        derivedFrom: "Application",
        createdAt: a.createdAt,
      });
    }

    return res.json(derived);
  } catch (e) {
    console.error("listCandidates error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

const getCandidate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!ensureObjectId(id)) return res.status(400).json({ message: "Invalid ID" });

    const app = await Application.findById(id).select("candidate trackId createdAt").lean();
    if (!app?.candidate) return res.status(404).json({ message: "Candidate not found" });

    return res.json({
      _id: id,
      ...app.candidate,
      trackId: app.trackId || "",
      derivedFrom: "Application",
      createdAt: app.createdAt,
    });
  } catch (e) {
    console.error("getCandidate error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

// ✅ Offline hire (NO employee creation)
const hireApplicant = async (req, res) => {
  try {
    if (!isHrRole(req.user?.role)) return res.status(403).json({ message: "Access Denied" });

    const companyId = getCompanyIdForHr(req);
    const appId = req.params.appId;

    const app = await Application.findOne({ _id: appId, companyId });
    if (!app) return res.status(404).json({ message: "Application not found" });

    const prev = app.stage;
    app.stage = "Hired";
    pushTimeline(app, { by: req.user._id, action: `Stage: ${prev} -> Hired` });
    pushTimeline(app, { by: req.user._id, action: "Hired (Offline)", meta: { note: "No employee auto-created. Onboarding later." } });

    await app.save();
    return res.json({ message: "Marked as Hired (Offline)", application: app });
  } catch (e) {
    console.error("hireApplicant error:", e);
    return res.status(500).json({ message: "Error" });
  }
};

module.exports = {
  // Public
  listJobs,
  getJob,
  createPublicApplication,
  checkApplicationStatus,
  respondToInterview,

  // Jobs (HR)
  createJob,
  updateJob,
  deleteJob,

  // Applications (HR)
  listApplications,
  getApplication,
  updateApplicationStage,
  updateApplicationStageByBody,
  deleteApplication,
  hireApplicant,

  // Interviews (HR)
  scheduleInterview,
  listInterviews,
  updateInterview,
  deleteInterview,

  // Candidates (HR derived)
  listCandidates,
  getCandidate,
};
