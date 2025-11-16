// File: src/routes/learningPathRoutes.js
/**
 * @fileoverview Definisi rute untuk manajemen CRUD entitas LearningPath.
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 * Rute diakses dengan prefix /api/v1/admin/learning-paths.
 */
const express = require('express');
const router = express.Router();

// Impor semua fungsi controller untuk Learning Path
const {
  createLearningPath,
  getAllLearningPaths,
  getLearningPathById,
  updateLearningPath,
  deleteLearningPath,
} = require('../controllers/learningPathController');

// Impor middleware otorisasi dan otentikasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// --- Pemasangan Middleware Global ---
/**
 * Lindungi SEMUA rute yang didefinisikan di bawah ini.
 * Setiap request HARUS memiliki token yang valid (protect) 
 * dan role-nya harus 'admin' (isAdmin).
 */
router.use(protect);
router.use(isAdmin);

// --- Definisi Rute ---

/**
 * @route /
 * @description Rute utama untuk membuat dan mengambil semua Learning Path.
 */
router.route('/')
  .post(createLearningPath) // POST /api/v1/admin/learning-paths (Create)
  .get(getAllLearningPaths);  // GET /api/v1/admin/learning-paths (Read All)

/**
 * @route /:id
 * @description Rute untuk operasi spesifik 1 Learning Path.
 */
router.route('/:id')
  .get(getLearningPathById)    // GET /api/v1/admin/learning-paths/:id (Read One & Kurikulum)
  .put(updateLearningPath)     // PUT /api/v1/admin/learning-paths/:id (Update)
  .delete(deleteLearningPath);  // DELETE /api/v1/admin/learning-paths/:id (Delete)

module.exports = router;