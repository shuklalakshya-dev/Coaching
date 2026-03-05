const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    fatherName: {
      type: String,
      trim: true,
      maxlength: [100, 'Father name cannot exceed 100 characters'],
    },
    motherName: {
      type: String,
      trim: true,
      maxlength: [100, 'Mother name cannot exceed 100 characters'],
    },
    class: {
      type: String,
      trim: true,
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    profilePhotoPublicId: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Auto-generate roll number for students
userSchema.pre('save', async function (next) {
  if (this.isNew && this.role === 'student' && !this.rollNumber) {
    const count = await mongoose.model('User').countDocuments({ role: 'student' });
    this.rollNumber = `STU${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
