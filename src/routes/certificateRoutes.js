// File: src/routes/certificateRoutes.js
/**
 * @fileoverview Certificate Routes - Routes untuk sertifikat user
 */
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { uploadSingle, validateFile } = require('../middlewares/uploadMiddleware');

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

// [NEW] Get certificate status for a course (User side)
router.get('/status/:course_id', certificateController.getUserCertificateStatus);


// Admin routes untuk manage certificate dengan file upload

/**
 * @route GET /api/v1/certificates/admin/all
 * @desc Get all certificates (Admin)
 * @access Admin
 */
router.get('/admin/all', isAdmin, certificateController.getAllCertificates);

// [NEW] Get certificate candidates (completed course, no cert)
router.get('/admin/candidates', isAdmin, certificateController.getCertificateCandidates);

// [NEW] Preview certificate
router.post('/admin/preview', isAdmin, certificateController.previewCertificate);

/**
 * @route GET /api/v1/certificates/admin/templates
 * @desc Get all certificate templates
 * @access Admin
 */
router.get('/admin/templates', isAdmin, certificateController.getTemplates);

/**
 * @route GET /api/v1/certificates/admin/pending
 * @desc List users who completed course but certificate not generated
 * @access Admin
 */
router.get('/admin/pending', isAdmin, certificateController.getPendingCertificates);

/**
 * @route GET /api/v1/certificates/admin/:userId/:courseId/preview
 * @desc Preview certificate data for a user+course
 * @access Admin
 */
router.get('/admin/:userId/:courseId/preview', isAdmin, certificateController.previewCertificateData);

/**
 * @route POST /api/v1/certificates/admin/templates
 * @desc Create new certificate template
 * @access Admin
 */
router.post(
  '/admin/templates',
  isAdmin,
  uploadSingle.single('template'),
  // validateFileByBucket, // Skip bucket validation for now or add 'templates' to allowed buckets
  certificateController.createTemplate
);

/**
 * @route DELETE /api/v1/certificates/admin/templates/:id
 * @desc Delete certificate template (Admin)
 */
router.delete('/admin/templates/:id', isAdmin, certificateController.deleteTemplate);

/**
 * @route POST /api/v1/certificates/admin/generate
 * @desc Generate single certificate
 * @access Admin
 */
router.post('/admin/generate', isAdmin, certificateController.generateCertificate);

/**
 * @route POST /api/v1/certificates/admin/bulk-generate
 * @desc Generate bulk certificates from CSV
 * @access Admin
 */
router.post(
  '/admin/bulk-generate',
  isAdmin,
  uploadSingle.single('file'),
  certificateController.generateBulkCertificates
);

/**
 * @route PUT /api/v1/certificates/admin/:id
 * @desc Update sertifikat dengan file upload
 * @access Admin
 */
router.put(
  '/admin/:id',
  isAdmin,
  uploadSingle.single('certificate'),
  validateFile,
  certificateController.updateCertificate
);

/**
 * @route DELETE /api/v1/certificates/admin/:id
 * @desc Hapus sertifikat
 * @access Admin
 */
router.delete(
  '/admin/:id',
  isAdmin,
  certificateController.deleteCertificate
);

/**
 * @route GET /api/v1/certificates/:id
 * @desc Mendapatkan detail sertifikat berdasarkan ID
 * @access Private
 */
// Duplicate removed

module.exports = router;
