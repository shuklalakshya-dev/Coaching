const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getStudentAttendance,
  getAttendanceByDate,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), markAttendance);
router.get('/date/:date', authorize('admin'), getAttendanceByDate);
router.get('/:studentId', getStudentAttendance);
router.put('/:id', authorize('admin'), updateAttendance);

module.exports = router;
