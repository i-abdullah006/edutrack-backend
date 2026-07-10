const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication
} = require('../controllers/fingerprintController');

// Enrollment (used when adding/editing a student)
router.get('/:studentId/register-options', verifyToken, requireAdmin, getRegistrationOptions);
router.post('/:studentId/register-verify', verifyToken, requireAdmin, verifyRegistration);

// Daily attendance verification
router.get('/:studentId/auth-options', verifyToken, requireAdmin, getAuthenticationOptions);
router.post('/:studentId/auth-verify', verifyToken, requireAdmin, verifyAuthentication);

module.exports = router;
