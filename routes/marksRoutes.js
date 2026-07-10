const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  saveMarks,
  getStudentSubjectsForExam,
  getStudentMarks,
  getMyMarks,
  deleteMarks
} = require('../controllers/marksController');

// Admin routes
router.post('/', verifyToken, requireAdmin, saveMarks);
router.get('/student/:studentId/subjects-for-exam', verifyToken, requireAdmin, getStudentSubjectsForExam);
router.get('/student/:studentId', verifyToken, requireAdmin, getStudentMarks);
router.delete('/:id', verifyToken, requireAdmin, deleteMarks);

// Student route
router.get('/my-marks', verifyToken, getMyMarks);

module.exports = router;
