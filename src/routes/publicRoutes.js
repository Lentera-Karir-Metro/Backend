// File: src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPublicLearningPaths,
  getPublicLearningPathDetail,
} = require('../controllers/publicCatalogController');

// Rute ini tidak perlu 'protect'

// /api/v1/catalog/learning-paths
router.get('/catalog/learning-paths', getPublicLearningPaths);

// /api/v1/catalog/learning-paths/:id
router.get('/catalog/learning-paths/:id', getPublicLearningPathDetail);

module.exports = router;