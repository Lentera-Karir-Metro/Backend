// File: src/controllers/categoryController.js
/**
 * @fileoverview Controller untuk mengelola entitas Category (CRUD).
 * Controller ini hanya diakses oleh Admin.
 */
const db = require('../../models');
const Category = db.Category;
const Course = db.Course;
const { Op } = require('sequelize');

/**
 * @function getAllCategories
 * @description Mengambil semua kategori
 * @route GET /api/v1/admin/categories
 */
const getAllCategories = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        const whereClause = {};

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: categories } = await Category.findAndCountAll({
            where: whereClause,
            order: [['name', 'ASC']],
            limit: parseInt(limit),
            offset: offset,
            include: [{
                model: Course,
                as: 'courses',
                attributes: ['id'],
            }]
        });

        // Add course count to each category
        const categoriesWithCount = categories.map(cat => ({
            ...cat.toJSON(),
            courseCount: cat.courses ? cat.courses.length : 0,
        }));

        res.status(200).json({
            success: true,
            data: categoriesWithCount,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / parseInt(limit)),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kategori',
            error: error.message
        });
    }
};

/**
 * @function getCategoryById
 * @description Mengambil detail kategori berdasarkan ID
 * @route GET /api/v1/admin/categories/:id
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id, {
            include: [{
                model: Course,
                as: 'courses',
                attributes: ['id', 'title', 'thumbnail_url', 'status'],
            }]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kategori',
            error: error.message
        });
    }
};

/**
 * @function createCategory
 * @description Membuat kategori baru
 * @route POST /api/v1/admin/categories
 */
const createCategory = async (req, res) => {
    try {
        const { name, description, icon, color, status } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Nama kategori wajib diisi'
            });
        }

        // Check if category name already exists
        const existingCategory = await Category.findOne({
            where: { name: name.trim() }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Nama kategori sudah digunakan'
            });
        }

        const newCategory = await Category.create({
            name: name.trim(),
            description: description || null,
            icon: icon || 'folder',
            color: color || '#6B21FF',
            status: status || 'active',
        });

        res.status(201).json({
            success: true,
            message: 'Kategori berhasil dibuat',
            data: newCategory
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat kategori',
            error: error.message
        });
    }
};

/**
 * @function updateCategory
 * @description Memperbarui kategori berdasarkan ID
 * @route PUT /api/v1/admin/categories/:id
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, color, status } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        // Check if new name conflicts with existing category
        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({
                where: {
                    name: name.trim(),
                    id: { [Op.ne]: id }
                }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama kategori sudah digunakan'
                });
            }
        }

        // Update fields
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description;
        if (icon) category.icon = icon;
        if (color) category.color = color;
        if (status) category.status = status;

        await category.save();

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil diperbarui',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui kategori',
            error: error.message
        });
    }
};

/**
 * @function deleteCategory
 * @description Menghapus kategori berdasarkan ID
 * @route DELETE /api/v1/admin/categories/:id
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id, {
            include: [{
                model: Course,
                as: 'courses',
                attributes: ['id'],
            }]
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }

        // Check if category has courses
        if (category.courses && category.courses.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Kategori tidak dapat dihapus karena masih memiliki ${category.courses.length} kelas`
            });
        }

        await category.destroy();

        res.status(200).json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kategori',
            error: error.message
        });
    }
};

/**
 * @function getActiveCategories
 * @description Mengambil semua kategori yang aktif (untuk dropdown di frontend)
 * @route GET /api/v1/categories (public)
 */
const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'icon', 'color'],
            order: [['name', 'ASC']],
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching active categories:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kategori',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories,
};
