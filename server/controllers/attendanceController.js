const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Mark attendance (bulk or single)
// @route   POST /api/attendance
// @access  Admin
const markAttendance = async (req, res, next) => {
  const { records, date } = req.body;
  // records: [{ studentId, status, remarks }]

  if (!records || !Array.isArray(records) || records.length === 0) {
    return next(new ErrorResponse('Attendance records array is required', 400));
  }

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const ops = records.map((r) => ({
    updateOne: {
      filter: { studentId: r.studentId, date: attendanceDate },
      update: {
        $set: {
          status: r.status,
          remarks: r.remarks || '',
          markedBy: req.user.id,
          date: attendanceDate,
          studentId: r.studentId,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);

  res.status(200).json({ success: true, message: `Attendance marked for ${records.length} students` });
};

// @desc    Get attendance by studentId
// @route   GET /api/attendance/:studentId
// @access  Admin or Self
const getStudentAttendance = async (req, res, next) => {
  const { studentId } = req.params;
  const { month, year, startDate, endDate } = req.query;

  // Students can only view own attendance
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const query = { studentId };

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .populate('markedBy', 'name');

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const lateDays = records.filter((r) => r.status === 'late').length;
  const attendancePercentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  res.status(200).json({
    success: true,
    data: {
      records,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage: parseFloat(attendancePercentage),
      },
    },
  });
};

// @desc    Get all attendance for a specific date
// @route   GET /api/attendance/date/:date
// @access  Admin
const getAttendanceByDate = async (req, res, next) => {
  const date = new Date(req.params.date);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  const records = await Attendance.find({
    date: { $gte: date, $lt: nextDay },
  }).populate('studentId', 'name rollNumber class profilePhoto');

  // Get all students and fill in absent if not marked
  const allStudents = await User.find({ role: 'student', isActive: true }).select(
    'name rollNumber class profilePhoto'
  );

  const markedIds = records.map((r) => r.studentId._id.toString());
  const unmarked = allStudents.filter((s) => !markedIds.includes(s._id.toString()));

  res.status(200).json({
    success: true,
    data: {
      date: date.toISOString().split('T')[0],
      marked: records,
      unmarked,
      summary: {
        total: allStudents.length,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        late: records.filter((r) => r.status === 'late').length,
        notMarked: unmarked.length,
      },
    },
  });
};

// @desc    Update single attendance record
// @route   PUT /api/attendance/:id
// @access  Admin
const updateAttendance = async (req, res, next) => {
  const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!record) {
    return next(new ErrorResponse('Attendance record not found', 404));
  }

  res.status(200).json({ success: true, data: record });
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  updateAttendance,
};
