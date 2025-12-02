// File: src/routes/dashboardRoutes.js
/**
 * @fileoverview Dashboard Routes - Routes untuk dashboard user
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// Semua routes di sini memerlukan autentikasi
router.use(protect);

/**
 * @route GET /api/v1/dashboard/stats
 * @desc Mendapatkan statistik dashboard (total kelas, ebook, sertifikat)
 * @access Private
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @route GET /api/v1/dashboard/continue-learning
 * @desc Mendapatkan kelas yang sedang dipelajari
 * @access Private
 */
router.get('/continue-learning', dashboardController.getContinueLearning);

/**
 * @route GET /api/v1/dashboard/recommended
 * @desc Mendapatkan rekomendasi kelas
 * @access Private
 */
router.get('/recommended', dashboardController.getRecommendedCourses);

module.exports = router;
