const express = require('express');
const router = express.Router();
const { adminLogin, adminAutoLogin, studentLogin, studentAutoLogin } = require('../controllers/authController');

router.post('/admin/login', adminLogin);
router.post('/admin/auto-login', adminAutoLogin);
router.post('/student/login', studentLogin);
router.post('/student/auto-login', studentAutoLogin);

module.exports = router;
