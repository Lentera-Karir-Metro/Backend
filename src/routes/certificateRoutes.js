// File: src/routes/certificateRoutes.js
/**
 * @fileoverview Certificate Routes - Routes untuk sertifikat user
 */
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect } = require('../middlewares/authMiddleware');

// Semua routes di sini memerlukan autentikasi
router.use(protect);

/**
 * @route GET /api/v1/certificates
 * @desc Mendapatkan semua sertifikat user
 * @access Private
 */
router.get('/', certificateController.getMyCertificates);

/**
 * @route GET /api/v1/certificates/:id
 * @desc Mendapatkan detail sertifikat berdasarkan ID
 * @access Private
 */
router.get('/:id', certificateController.getCertificateById);

module.exports = router;
