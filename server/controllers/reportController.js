const MonthlyReport = require('../models/MonthlyReport');
const Attendance = require('../models/Attendance');
const TestMarks = require('../models/TestMarks');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Generate or fetch report for a student (monthly / quarterly / half-yearly / yearly)
// @route   GET /api/report/:studentId?month=&year= OR ?startMonth=&endMonth=&year=
// @access  Admin or Self
const getOrGenerateReport = async (req, res, next) => {
  const { studentId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  // Support single-month OR multi-month date range
  const isRange = req.query.startMonth && req.query.endMonth;
  const startMonth = isRange
    ? parseInt(req.query.startMonth)
    : (parseInt(req.query.month) || new Date().getMonth() + 1);
  const endMonth = isRange ? parseInt(req.query.endMonth) : startMonth;

  if (req.user.role === 'student' && req.user.id !== studentId) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Compute from raw data across the full range
  const start = new Date(year, startMonth - 1, 1);
  const end = new Date(year, endMonth, 0, 23, 59, 59);

  const [attendanceRecords, marksRecords] = await Promise.all([
    Attendance.find({ studentId, date: { $gte: start, $lte: end } }),
    TestMarks.find({ studentId, date: { $gte: start, $lte: end } }),
  ]);

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter((a) => a.status === 'present').length;
  const absentDays = totalDays - presentDays;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  const totalTests = marksRecords.length;
  const totalObtained = marksRecords.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = marksRecords.reduce((s, m) => s + m.maxMarks, 0);
  const averageMarks = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

  // Calculate grade directly (findOneAndUpdate bypasses pre-save hooks)
  let performanceGrade = 'F';
  if (averageMarks >= 90) performanceGrade = 'A+';
  else if (averageMarks >= 80) performanceGrade = 'A';
  else if (averageMarks >= 70) performanceGrade = 'B+';
  else if (averageMarks >= 60) performanceGrade = 'B';
  else if (averageMarks >= 50) performanceGrade = 'C';
  else if (averageMarks >= 40) performanceGrade = 'D';

  const reportPayload = {
    totalTests,
    averageMarks: parseFloat(averageMarks.toFixed(2)),
    attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    totalDays,
    presentDays,
    absentDays,
    performanceGrade,
  };

  let report;
  if (!isRange) {
    // Single month — upsert to DB
    report = await MonthlyReport.findOneAndUpdate(
      { studentId, month: startMonth, year },
      { studentId, month: startMonth, year, ...reportPayload, generatedBy: req.user.id },
      { new: true, upsert: true, runValidators: false }
    );
  } else {
    // Multi-month range — return virtual report (not persisted)
    report = { ...reportPayload, studentId, month: startMonth, year };
  }

  // Subject-wise marks breakdown (same logic for all report types)
  const subjectMap = {};
  marksRecords.forEach((m) => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = { obtained: 0, max: 0, tests: 0 };
    subjectMap[m.subject].obtained += m.marksObtained;
    subjectMap[m.subject].max += m.maxMarks;
    subjectMap[m.subject].tests += 1;
  });

  const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    tests: data.tests,
    obtained: data.obtained,
    max: data.max,
    percentage: data.max > 0 ? ((data.obtained / data.max) * 100).toFixed(2) : 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      report,
      student: {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        class: student.class,
        profilePhoto: student.profilePhoto,
      },
      marksRecords,
      attendanceRecords,
      subjectBreakdown,
    },
  });
};

// @desc    Get all reports (admin — list by student or all)
// @route   GET /api/report
// @access  Admin
const getAllReports = async (req, res, next) => {
  const { month, year, studentId } = req.query;
  const query = {};
  if (month) query.month = parseInt(month);
  if (year) query.year = parseInt(year);
  if (studentId) query.studentId = studentId;

  const reports = await MonthlyReport.find(query)
    .populate('studentId', 'name rollNumber class profilePhoto')
    .sort({ year: -1, month: -1 });

  res.status(200).json({ success: true, count: reports.length, data: reports });
};

// @desc    Update report remarks
// @route   PUT /api/report/:id
// @access  Admin
const updateReportRemarks = async (req, res, next) => {
  const { remarks } = req.body;
  const report = await MonthlyReport.findByIdAndUpdate(
    req.params.id,
    { remarks },
    { new: true }
  );
  if (!report) return next(new ErrorResponse('Report not found', 404));
  res.status(200).json({ success: true, data: report });
};

module.exports = { getOrGenerateReport, getAllReports, updateReportRemarks };
