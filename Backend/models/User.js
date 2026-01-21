const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // keep global unique to avoid cross-company login conflicts
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    mobile: { type: String, default: "0000000000" },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['SuperAdmin', 'CompanyAdmin', 'Admin', 'Employee'],
      default: 'Employee',
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function () { return this.role !== 'SuperAdmin'; },
      index: true
    },

    designation: { type: String, default: 'Staff' },

    // salary
    salary: { type: Number, default: 0 },       // keep old
    basicSalary: { type: Number, default: 0 },  // new main

    joiningDate: { type: Date, default: null },

    profileImage: { type: String, default: "" },

    // backward compatible
    faceDescriptor: { type: mongoose.Schema.Types.Mixed, default: "[]" },

    // new fast vector buffer
    faceDescriptorVec: { type: Buffer, default: null },

    status: {
      type: String,
      enum: ['Pending', 'Active', 'Inactive', 'Rejected'],
      default: 'Pending',
      index: true
    },

    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },

    // WFH
    isWfhActive: { type: Boolean, default: false },
    wfhLocation: { lat: Number, lng: Number, address: String, approvedDate: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // onboarding helpers
    employeeCode: { type: String, default: '' },
    department: { type: String, default: '' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // security / audit helpers
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.faceDescriptor;
  delete obj.faceDescriptorVec;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
