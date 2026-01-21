// Backend/models/RecruitmentJob.js
"use strict";
const mongoose = require("mongoose");

const RecruitmentJobSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, default: "" },

    employmentType: { type: String, default: "Full-time" },
    openings: { type: Number, default: 1 },

    experience: { type: String, default: "Fresher" },
    passingYear: { type: String, default: "" },
    salaryRange: { type: String, default: "" },

    description: { type: String, default: "" },
    status: { type: String, default: "Open", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruitmentJob", RecruitmentJobSchema);
