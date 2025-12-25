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
} = require('../controllers/publicCatalogController');

// Impor controller untuk Articles
const {
  getAllArticles,
  getArticleById,
  getLatestArticles,
  getCategories,
  getArticlesByCategory
} = require('../controllers/articleController');

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
 * @route /articles
 * @description Mengambil semua artikel dengan pagination dan search (Public Access)
 */
router.get('/articles', getAllArticles);

/**
 * @method GET
 * @route /articles/latest
 * @description Mengambil artikel terbaru (Public Access)
 */
router.get('/articles/latest', getLatestArticles);

/**
 * @method GET
 * @route /articles/categories
 * @description Mengambil semua kategori artikel (Public Access)
 */
router.get('/articles/categories', getCategories);

/**
 * @method GET
 * @route /articles/category/:category
 * @description Mengambil artikel berdasarkan kategori (Public Access)
 */
router.get('/articles/category/:category', getArticlesByCategory);

/**
 * @method GET
 * @route /articles/:id
 * @description Mengambil detail artikel berdasarkan ID (Public Access)
 */
router.get('/articles/:id', getArticleById);

module.exports = router;