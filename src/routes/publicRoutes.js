// File: src/routes/publicRoutes.js
/**
 * @fileoverview Definisi rute untuk Katalog Publik (Public Read).
 * Rute ini dapat diakses oleh user yang BELUM terotentikasi (Tamu).
 * Rute diakses dengan prefix /api/v1.
 */
const express = require('express');
const router = express.Router();

// Impor controller untuk Katalog Publik
const {
  getPublicLearningPaths,
  getPublicLearningPathDetail,
  getPublicCourses,
  getPublicCourseDetail,
} = require('../controllers/publicCatalogController');

// --- Pemasangan Middleware ---
/**
 * Rute di bawah ini bersifat publik (Public Access) dan
 * TIDAK memerlukan middleware 'protect' atau otentikasi JWT.
 */

// --- Definisi Rute ---

/**
 * @method GET
 * @route /catalog/learning-paths
 * @description Mengambil daftar semua Learning Path yang tersedia (Katalog Utama).
 */
router.get('/catalog/learning-paths', getPublicLearningPaths);

/**
 * @method GET
 * @route /catalog/learning-paths/:id
 * @description Mengambil detail satu Learning Path, termasuk struktur kurikulum.
 */
router.get('/catalog/learning-paths/:id', getPublicLearningPathDetail);

/**
 * @method GET
 * @route /catalog/courses
 * @description Mengambil daftar semua Courses yang tersedia untuk katalog publik.
 */
router.get('/catalog/courses', getPublicCourses);

/**
 * @method GET
 * @route /catalog/courses/:id
 * @description Mengambil detail satu Course.
 */
router.get('/catalog/courses/:id', getPublicCourseDetail);

module.exports = router;