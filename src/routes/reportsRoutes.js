// File: src/routes/reportsRoutes.js
/**
 * @fileoverview Reports Routes - Routes untuk analytics dan reports admin
 * Semua route dilindungi dengan middleware admin-only
 */
const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getCoursePerformance,
  getClassPerformance,
  getStudentPerformance,
  getSalesReport,
  getEnrollmentTrends,
  getCertificateStats
} = require('../controllers/reportsController');

const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua routes
router.use(protect);
router.use(isAdmin);

/**
 * @route GET /api/v1/admin/reports/user-analytics
 * @description Mendapatkan analitik pengguna
 * @access Private/Admin
 */
router.get('/user-analytics', getUserAnalytics);

/**
 * @route GET /api/v1/admin/reports/course-performance
 * @description Mendapatkan performa kursus (enrollment, completion, revenue)
 * @access Private/Admin
 */
router.get('/course-performance', getCoursePerformance);

/**
 * @route GET /api/v1/admin/reports/class-performance
 * @description Mendapatkan performa kelas (Learning Path) untuk UI Report & Monitoring
 * @access Private/Admin
 */
router.get('/class-performance', getClassPerformance);

/**
 * @route GET /api/v1/admin/reports/student-performance
 * @description Mendapatkan performa belajar siswa untuk UI Report & Monitoring
 * @access Private/Admin
 */
router.get('/student-performance', getStudentPerformance);

/**
 * @route GET /api/v1/admin/reports/sales-report
 * @description Mendapatkan laporan penjualan per bulan
 * @access Private/Admin
 * @query {number} months - Jumlah bulan (default: 12)
 */
router.get('/sales-report', getSalesReport);

/**
 * @route GET /api/v1/admin/reports/enrollment-trends
 * @description Mendapatkan tren enrollment (daily untuk 30 hari terakhir)
 * @access Private/Admin
 */
router.get('/enrollment-trends', getEnrollmentTrends);

/**
 * @route GET /api/v1/admin/reports/certificate-stats
 * @description Mendapatkan statistik sertifikat
 * @access Private/Admin
 */
router.get('/certificate-stats', getCertificateStats);

module.exports = router;
