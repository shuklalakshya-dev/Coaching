const TestMarks = require('../models/TestMarks');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Add test marks
// @route   POST /api/marks
// @access  Admin
const addMarks = async (req, res, next) => {
  req.body.addedBy = req.user.id;
  const marks = await TestMarks.create(req.body);
  const populated = await marks.populate('studentId', 'name rollNumber class');
  res.status(201).json({ success: true, data: populated });
};

// @desc    Get all marks for a student
// @route   GET /api/marks/:studentId
// @access  Admin or Self
const getStudentMarks = async (req, res, next) => {
  const { studentId } = req.params;
  const { subject, month, year } = req.query;

  if (req.user.role === 'student' && req.user.id !== studentId) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const query = { studentId };

  if (subject) query.subject = { $regex: subject, $options: 'i' };

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }

  const marks = await TestMarks.find(query)
    .populate('addedBy', 'name')
    .sort({ date: -1 });

  // Calculate stats
  const totalTests = marks.length;
  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
  const averagePercentage =
    totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

  // Subject-wise breakdown
  const subjectMap = {};
  marks.forEach((m) => {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { tests: 0, obtained: 0, max: 0 };
    }
    subjectMap[m.subject].tests += 1;
    subjectMap[m.subject].obtained += m.marksObtained;
    subjectMap[m.subject].max += m.maxMarks;
  });

  const subjectBreakdown = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    tests: data.tests,
    obtained: data.obtained,
    max: data.max,
    percentage: ((data.obtained / data.max) * 100).toFixed(2),
  }));

  res.status(200).json({
    success: true,
    data: {
      marks,
      stats: {
        totalTests,
        totalObtained,
        totalMax,
        averagePercentage: parseFloat(averagePercentage),
        subjectBreakdown,
      },
    },
  });
};

// @desc    Get all marks (admin view)
// @route   GET /api/marks
// @access  Admin
const getAllMarks = async (req, res, next) => {
  const { page = 1, limit = 20, subject, studentId } = req.query;
  const query = {};
  if (subject) query.subject = { $regex: subject, $options: 'i' };
  if (studentId) query.studentId = studentId;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [marks, total] = await Promise.all([
    TestMarks.find(query)
      .populate('studentId', 'name rollNumber class')
      .populate('addedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TestMarks.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: marks.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: marks,
  });
};

// @desc    Update marks
// @route   PUT /api/marks/:id
// @access  Admin
const updateMarks = async (req, res, next) => {
  const marks = await TestMarks.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('studentId', 'name rollNumber');

  if (!marks) {
    return next(new ErrorResponse('Test record not found', 404));
  }

  res.status(200).json({ success: true, data: marks });
};

// @desc    Delete marks
// @route   DELETE /api/marks/:id
// @access  Admin
const deleteMarks = async (req, res, next) => {
  const marks = await TestMarks.findById(req.params.id);

  if (!marks) {
    return next(new ErrorResponse('Test record not found', 404));
  }

  await marks.deleteOne();
  res.status(200).json({ success: true, message: 'Test record deleted' });
};

module.exports = { addMarks, getStudentMarks, getAllMarks, updateMarks, deleteMarks };
