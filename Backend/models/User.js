const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, default: "0000000000" },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SuperAdmin', 'CompanyAdmin', 'Admin', 'Employee'],
      default: 'Employee'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function () { return this.role !== 'SuperAdmin'; }
    },
    designation: { type: String, default: 'Staff' },
    salary: { type: Number, default: 0 }, 
    basicSalary: { type: Number, default: 0 }, 
    joiningDate: { type: Date, default: null },
    profileImage: { type: String, default: "" },
    faceDescriptor: { type: String, default: "[]" },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Inactive', 'Rejected'],
      default: 'Pending'
    },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    isWfhActive: { type: Boolean, default: false },
    wfhLocation: { lat: Number, lng: Number, address: String, approvedDate: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// ✅ PASSWORD HASHING HOOK
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw new Error("Password Hashing Failed");
  }
});

// ✅ PASSWORD COMPARISON METHOD
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.faceDescriptor;
  return obj;
};

module.exports = mongoose.model('User', userSchema);