const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { getCurriculumStructure, previewSubjects } = require('../controllers/curriculumController');

router.get('/', verifyToken, requireAdmin, getCurriculumStructure);
router.post('/preview-subjects', verifyToken, requireAdmin, previewSubjects);

module.exports = router;
