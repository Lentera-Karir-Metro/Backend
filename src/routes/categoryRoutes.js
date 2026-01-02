// File: src/routes/categoryRoutes.js
/**
 * @fileoverview Routes untuk mengelola Category.
 * Semua routes memerlukan autentikasi admin.
 */
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

/**
 * @route GET /api/v1/admin/categories
 * @description Mengambil semua kategori dengan pagination
 * @access Admin only
 */
router.get('/', protect, isAdmin, categoryController.getAllCategories);

/**
 * @route GET /api/v1/admin/categories/:id
 * @description Mengambil detail kategori berdasarkan ID
 * @access Admin only
 */
router.get('/:id', protect, isAdmin, categoryController.getCategoryById);

/**
 * @route POST /api/v1/admin/categories
 * @description Membuat kategori baru
 * @access Admin only
 */
router.post('/', protect, isAdmin, categoryController.createCategory);

/**
 * @route PUT /api/v1/admin/categories/:id
 * @description Memperbarui kategori
 * @access Admin only
 */
router.put('/:id', protect, isAdmin, categoryController.updateCategory);

/**
 * @route DELETE /api/v1/admin/categories/:id
 * @description Menghapus kategori
 * @access Admin only
 */
router.delete('/:id', protect, isAdmin, categoryController.deleteCategory);

module.exports = router;
