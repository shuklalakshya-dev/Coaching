const express = require('express');
const router = express.Router();
const {
  getOrGenerateReport,
  getAllReports,
  updateReportRemarks,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin'), getAllReports);
router.get('/:studentId', getOrGenerateReport);
router.put('/:id', authorize('admin'), updateReportRemarks);

module.exports = router;
