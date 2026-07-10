const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  setSecretPassword,
  changeAdminPassword
} = require('../controllers/settingsController');

router.get('/', verifyToken, requireAdmin, getSettings);
router.put('/', verifyToken, requireAdmin, updateSettings);
router.put('/secret-password', verifyToken, requireAdmin, setSecretPassword);
router.put('/change-password', verifyToken, requireAdmin, changeAdminPassword);

module.exports = router;
