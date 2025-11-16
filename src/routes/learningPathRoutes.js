// File: src/routes/learningPathRoutes.js
const express = require('express');
const router = express.Router();

// Impor controller
const {
  createLearningPath,
  getAllLearningPaths,
  getLearningPathById,
  updateLearningPath,
  deleteLearningPath,
} = require('../controllers/learningPathController');

// Impor middleware
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua rute di file ini dengan middleware protect dan isAdmin
// Semua request ke /api/v1/admin/learning-paths/... 
// HARUS menyertakan token admin yang valid.
router.use(protect);
router.use(isAdmin);

// Definisikan rute
router.route('/')
  .post(createLearningPath)
  .get(getAllLearningPaths);

router.route('/:id')
  .get(getLearningPathById)
  .put(updateLearningPath)
  .delete(deleteLearningPath);

module.exports = router;