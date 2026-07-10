const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  addStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  removeStudent,
  resetStudentPassword
} = require('../controllers/studentController');

// All these routes are admin-only (both verifyToken + requireAdmin apply)
router.post('/', verifyToken, requireAdmin, addStudent);
router.get('/', verifyToken, requireAdmin, getAllStudents);
router.get('/:id', verifyToken, requireAdmin, getStudentById);
router.put('/:id', verifyToken, requireAdmin, updateStudent);
router.delete('/:id', verifyToken, requireAdmin, removeStudent);
router.post('/:id/reset-password', verifyToken, requireAdmin, resetStudentPassword);

module.exports = router;
