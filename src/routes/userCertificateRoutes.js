// File: src/routes/userCertificateRoutes.js
/**
 * @fileoverview User Certificate Routes - Routes untuk user generate sertifikat sendiri
 */
const express = require('express');
const router = express.Router();
const userCertificateController = require('../controllers/userCertificateController');
const { protect } = require('../middlewares/authMiddleware');

// Semua routes memerlukan autentikasi user
router.use(protect);

/**
 * @route GET /api/v1/user-certificates/check/:course_id
 * @desc Check apakah user sudah selesai course dan eligible untuk certificate
 * @access Private (User)
 */
router.get('/check/:course_id', userCertificateController.checkCourseCompletion);

/**
 * @route GET /api/v1/user-certificates/templates
 * @desc Get semua template yang available
 * @access Private (User)
 */
router.get('/templates', userCertificateController.getAvailableTemplates);

/**
 * @route POST /api/v1/user-certificates/preview
 * @desc Preview sertifikat sebelum generate
 * @access Private (User)
 */
router.post('/preview', userCertificateController.previewUserCertificate);

/**
 * @route POST /api/v1/user-certificates/generate
 * @desc Generate sertifikat dengan template yang dipilih user
 * @access Private (User)
 */
router.post('/generate', userCertificateController.generateUserCertificate);

module.exports = router;
