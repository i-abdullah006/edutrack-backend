const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  markAttendance,
  markBulkAttendance,
  markAttendanceByFace,
  markAttendanceByFingerprint,
  getAttendanceByDate,
  getStudentAttendance,
  getMyAttendance
} = require('../controllers/attendanceController');

// Admin routes
router.post('/mark', verifyToken, requireAdmin, markAttendance);
router.post('/mark-bulk', verifyToken, requireAdmin, markBulkAttendance);
router.post('/mark-face', verifyToken, requireAdmin, markAttendanceByFace);
router.post('/mark-fingerprint', verifyToken, requireAdmin, markAttendanceByFingerprint);
router.get('/date/:date', verifyToken, requireAdmin, getAttendanceByDate);
router.get('/student/:studentId', verifyToken, requireAdmin, getStudentAttendance);

// Student route - to view their own attendance
router.get('/my-attendance', verifyToken, getMyAttendance);

module.exports = router;
