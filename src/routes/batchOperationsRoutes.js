// File: src/routes/batchOperationsRoutes.js
/**
 * @fileoverview Batch Operations Routes - Routes untuk operasi bulk admin
 * Semua route dilindungi dengan middleware admin-only
 */
const express = require('express');
const router = express.Router();
const {
  deleteMultipleUsers,
  deactivateMultipleUsers,
  deleteMultipleCourses,
  deleteMultipleLearningPaths,
  deleteMultipleModules,
  updateMultipleLearningPathStatus
} = require('../controllers/batchOperationsController');

const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua routes
router.use(protect);
router.use(isAdmin);

/**
 * @route POST /api/v1/admin/batch/users/delete
 * @description Menghapus multiple users
 * @body {array} ids - Array of user IDs
 * @access Private/Admin
 */
router.post('/users/delete', deleteMultipleUsers);

/**
 * @route POST /api/v1/admin/batch/users/deactivate
 * @description Menonaktifkan multiple users
 * @body {array} ids - Array of user IDs
 * @access Private/Admin
 */
router.post('/users/deactivate', deactivateMultipleUsers);

/**
 * @route POST /api/v1/admin/batch/courses/delete
 * @description Menghapus multiple courses
 * @body {array} ids - Array of course IDs
 * @access Private/Admin
 */
router.post('/courses/delete', deleteMultipleCourses);

/**
 * @route POST /api/v1/admin/batch/learning-paths/delete
 * @description Menghapus multiple learning paths
 * @body {array} ids - Array of learning path IDs
 * @access Private/Admin
 */
router.post('/learning-paths/delete', deleteMultipleLearningPaths);

/**
 * @route POST /api/v1/admin/batch/modules/delete
 * @description Menghapus multiple modules
 * @body {array} ids - Array of module IDs
 * @access Private/Admin
 */
router.post('/modules/delete', deleteMultipleModules);

/**
 * @route POST /api/v1/admin/batch/learning-paths/update-status
 * @description Mengubah status multiple learning paths
 * @body {array} ids - Array of learning path IDs, {string} status
 * @access Private/Admin
 */
router.post('/learning-paths/update-status', updateMultipleLearningPathStatus);

module.exports = router;
