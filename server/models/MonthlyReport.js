const mongoose = require('mongoose');

const monthlyReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    averageMarks: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    totalDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    performanceGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
      default: 'B',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Unique report per student per month per year
monthlyReportSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

// Auto-assign performance grade before save
monthlyReportSchema.pre('save', function (next) {
  const avg = this.averageMarks;
  if (avg >= 90) this.performanceGrade = 'A+';
  else if (avg >= 80) this.performanceGrade = 'A';
  else if (avg >= 70) this.performanceGrade = 'B+';
  else if (avg >= 60) this.performanceGrade = 'B';
  else if (avg >= 50) this.performanceGrade = 'C';
  else if (avg >= 40) this.performanceGrade = 'D';
  else this.performanceGrade = 'F';
  next();
});

module.exports = mongoose.model('MonthlyReport', monthlyReportSchema);
