// File: src/routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Public routes (no authentication required)
router.get('/', articleController.getAllArticles);
router.get('/latest', articleController.getLatestArticles);
router.get('/categories', articleController.getCategories);
router.get('/category/:category', articleController.getArticlesByCategory);
router.get('/:id', articleController.getArticleById);

module.exports = router;
