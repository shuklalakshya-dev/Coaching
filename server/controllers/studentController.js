const User = require('../models/User');
const Attendance = require('../models/Attendance');
const TestMarks = require('../models/TestMarks');
const MonthlyReport = require('../models/MonthlyReport');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all students
// @route   GET /api/students
// @access  Admin
const getAllStudents = async (req, res, next) => {
  const { page = 1, limit = 20, search = '', class: cls, isActive } = req.query;

  const query = { role: 'student' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (cls) query.class = cls;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [students, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: students.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: students,
  });
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Admin or Self
const getStudent = async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' }).select('-password');

  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Students can only view their own profile
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    return next(new ErrorResponse('Not authorized to view this profile', 403));
  }

  res.status(200).json({ success: true, data: student });
};

// @desc    Create student
// @route   POST /api/students
// @access  Admin
const createStudent = async (req, res, next) => {
  req.body.role = 'student';

  const student = await User.create(req.body);

  const studentObj = student.toObject();
  delete studentObj.password;

  res.status(201).json({ success: true, data: studentObj });
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Admin
const updateStudent = async (req, res, next) => {
  // Prevent password update via this route
  delete req.body.password;
  delete req.body.role;

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'student' },
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  res.status(200).json({ success: true, data: student });
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Admin
const deleteStudent = async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });

  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  // Cascade delete related records
  await Promise.all([
    Attendance.deleteMany({ studentId: req.params.id }),
    TestMarks.deleteMany({ studentId: req.params.id }),
    MonthlyReport.deleteMany({ studentId: req.params.id }),
    student.deleteOne(),
  ]);

  res.status(200).json({ success: true, message: 'Student and related records deleted' });
};

// @desc    Toggle student active status
// @route   PUT /api/students/:id/toggle-status
// @access  Admin
const toggleStudentStatus = async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });

  if (!student) {
    return next(new ErrorResponse('Student not found', 404));
  }

  student.isActive = !student.isActive;
  await student.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: { isActive: student.isActive },
    message: `Student account ${student.isActive ? 'activated' : 'deactivated'}`,
  });
};

// @desc    Get admin dashboard stats
// @route   GET /api/students/dashboard-stats
// @access  Admin
const getDashboardStats = async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [
    totalStudents,
    activeStudents,
    todayAttendance,
    recentMarks,
    classDistribution,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    Attendance.find({ date: { $gte: today, $lt: tomorrow } })
      .populate('studentId', 'name rollNumber class profilePhoto'),
    TestMarks.find()
      .populate('studentId', 'name rollNumber class')
      .sort({ createdAt: -1 })
      .limit(10),
    User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
  const absentToday = todayAttendance.filter((a) => a.status === 'absent').length;

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      activeStudents,
      todayAttendance: {
        total: todayAttendance.length,
        present: presentToday,
        absent: absentToday,
        records: todayAttendance,
      },
      recentMarks,
      classDistribution,
    },
  });
};

module.exports = {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentStatus,
  getDashboardStats,
};
