const mongoose = require('mongoose');

const testMarksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: [0, 'Marks cannot be negative'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
    },
    date: {
      type: Date,
      required: [true, 'Test date is required'],
    },
    addedBy: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for percentage
testMarksSchema.virtual('percentage').get(function () {
  return ((this.marksObtained / this.maxMarks) * 100).toFixed(2);
});

// Validate marks obtained <= max marks
testMarksSchema.pre('save', function (next) {
  if (this.marksObtained > this.maxMarks) {
    return next(new Error('Marks obtained cannot exceed maximum marks'));
  }
  next();
});

module.exports = mongoose.model('TestMarks', testMarksSchema);
