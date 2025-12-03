// File: src/routes/certificateRoutes.js
/**
 * @fileoverview Certificate Routes - Routes untuk sertifikat user
 */
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { uploadSingle, validateFileByBucket } = require('../middlewares/uploadMiddleware');

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

// Admin routes untuk manage certificate dengan file upload
/**
 * @route PUT /api/v1/admin/certificates/:id
 * @desc Update sertifikat dengan file upload
 * @access Admin
 */
router.put(
  '/admin/certificates/:id',
  isAdmin,
  uploadSingle.single('certificate'),
  validateFileByBucket,
  certificateController.updateCertificate
);

/**
 * @route DELETE /api/v1/admin/certificates/:id
 * @desc Hapus sertifikat
 * @access Admin
 */
router.delete(
  '/admin/certificates/:id',
  isAdmin,
  certificateController.deleteCertificate
);

module.exports = router;
