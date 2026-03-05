const express = require('express');
const router = express.Router();
const {
  addMarks,
  getStudentMarks,
  getAllMarks,
  updateMarks,
  deleteMarks,
} = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(authorize('admin'), getAllMarks)
  .post(authorize('admin'), addMarks);

router.get('/:studentId', getStudentMarks);
router.put('/:id', authorize('admin'), updateMarks);
router.delete('/:id', authorize('admin'), deleteMarks);

module.exports = router;
