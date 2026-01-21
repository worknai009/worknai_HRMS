// Backend/models/Application.js
"use strict";
const mongoose = require("mongoose");

const TimelineSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const ResumeFileSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },      // relative path like uploads/...
    name: { type: String, default: "" },
    mime: { type: String, default: "" },
    size: { type: Number, default: 0 },
    sha256: { type: String, default: "" },
  },
  { _id: false }
);

const CandidateSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },

    source: { type: String, default: "Portal" },
    totalExperience: { type: Number, default: 0 },
    currentCTC: { type: Number, default: 0 },
    expectedCTC: { type: Number, default: 0 },
    noticePeriodDays: { type: Number, default: 0 },
    passingYear: { type: String, default: "" }, // ✅ NEW
    notes: { type: String, default: "" },

    resumeFile: { type: ResumeFileSchema, default: null },
  },
  { _id: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },

    // legacy (not used now)
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", default: null },

    // ✅ NEW: snapshot candidate stored inside application
    candidate: { type: CandidateSnapshotSchema, required: true },

    trackId: { type: String, unique: true, sparse: true, index: true },

    stage: { type: String, default: "Applied", index: true },
    timeline: { type: [TimelineSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ IMPORTANT: async hook => no next()
ApplicationSchema.pre("validate", async function () {
  if (this.candidate?.email) this.candidate.email = String(this.candidate.email).toLowerCase().trim();

  if (!this.trackId) {
    // generate safe readable
    this.trackId = `APP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;
  }
});

module.exports = mongoose.model("Application", ApplicationSchema);
