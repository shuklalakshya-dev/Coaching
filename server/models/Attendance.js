const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: [true, 'Attendance status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance for same student on same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
