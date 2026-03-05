const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  toggleStudentStatus,
  getDashboardStats,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard-stats', authorize('admin'), getDashboardStats);
router.route('/').get(authorize('admin'), getAllStudents).post(authorize('admin'), createStudent);
router
  .route('/:id')
  .get(getStudent)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);
router.put('/:id/toggle-status', authorize('admin'), toggleStudentStatus);

module.exports = router;
