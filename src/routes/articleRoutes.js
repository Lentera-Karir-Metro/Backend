// File: src/routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { uploadSingle, validateFile } = require('../middlewares/uploadMiddleware');

// Public routes (no authentication required)
router.get('/', articleController.getAllArticles);
router.get('/latest', articleController.getLatestArticles);
router.get('/categories', articleController.getCategories);
router.get('/category/:category', articleController.getArticlesByCategory);
router.get('/:id', articleController.getArticleById);

// Admin routes (protected, admin only)
// GET - List all articles for admin (with pagination, search, filter)
router.get(
  '/admin/articles',
  protect,
  isAdmin,
  articleController.getAllArticlesForAdmin
);

// POST - Create article with optional thumbnail
router.post(
  '/admin/articles',
  protect,
  isAdmin,
  uploadSingle.single('thumbnail'),
  validateFile,
  articleController.createArticle
);

// PUT - Update article with optional thumbnail
router.put(
  '/admin/articles/:id',
  protect,
  isAdmin,
  uploadSingle.single('thumbnail'),
  validateFile,
  articleController.updateArticle
);

// DELETE - Delete article
router.delete(
  '/admin/articles/:id',
  protect,
  isAdmin,
  articleController.deleteArticle
);

module.exports = router;
