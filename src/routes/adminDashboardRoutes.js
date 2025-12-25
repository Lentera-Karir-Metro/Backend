// File: src/routes/adminDashboardRoutes.js
/**
 * @fileoverview Admin Dashboard Routes - Routes untuk statistik dan overview admin
 * Semua route dilindungi dengan middleware admin-only
 */
const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getRecentTransactions,
  getUserGrowthChart,
  getEnrollmentStats,
  getRecentUsers,
  getRecentLearningPaths
} = require('../controllers/adminDashboardController');

const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua routes
router.use(protect);
router.use(isAdmin);

/**
 * @route GET /api/v1/admin/dashboard/stats
 * @description Mendapatkan statistik dashboard admin
 * @access Private/Admin
 */
router.get('/stats', getAdminDashboardStats);

/**
 * @route GET /api/v1/admin/dashboard/recent-transactions
 * @description Mendapatkan transaksi terbaru
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 10)
 */
router.get('/recent-transactions', getRecentTransactions);

/**
 * @route GET /api/v1/admin/dashboard/user-growth
 * @description Mendapatkan data pertumbuhan user per bulan
 * @access Private/Admin
 * @query {number} months - Jumlah bulan (default: 12)
 */
router.get('/user-growth', getUserGrowthChart);

/**
 * @route GET /api/v1/admin/dashboard/enrollment-stats
 * @description Mendapatkan statistik enrollment per learning path
 * @access Private/Admin
 */
router.get('/enrollment-stats', getEnrollmentStats);

/**
 * @route GET /api/v1/admin/dashboard/recent-users
 * @description Mendapatkan user yang baru registrasi
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 5)
 */
router.get('/recent-users', getRecentUsers);

/**
 * @route GET /api/v1/admin/dashboard/recent-learning-paths
 * @description Mendapatkan learning path yang baru dibuat
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 5)
 */
router.get('/recent-learning-paths', getRecentLearningPaths);

module.exports = router;
