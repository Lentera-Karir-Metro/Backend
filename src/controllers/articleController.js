// File: src/controllers/articleController.js
const { Article } = require('../../models');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/uploadToSupabase');
const { Op, Sequelize } = require('sequelize');

/**
 * @function getAllArticlesForAdmin
 * @description Mengambil semua articles untuk admin panel (dengan pagination, search, filter)
 * @route GET /api/v1/admin/articles
 * @query {number} page - Halaman (default: 1)
 * @query {number} limit - Jumlah per halaman (default: 10)
 * @query {string} search - Cari berdasarkan title atau content
 * @query {string} category - Filter berdasarkan category
 * @query {string} sort - Sort field (default: createdAt)
 * @query {string} order - ASC atau DESC (default: DESC)
 */
exports.getAllArticlesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', sort = 'createdAt', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    // Validate sort and order
    const validSortFields = ['id', 'title', 'author', 'category', 'createdAt', 'updatedAt'];
    const validOrder = ['ASC', 'DESC'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const orderDir = validOrder.includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';

    const { count, rows } = await Article.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortField, orderDir]],
      attributes: ['id', 'title', 'content', 'author', 'category', 'thumbnail_url', 'createdAt', 'updatedAt']
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getAllArticlesForAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar articles',
      error: error.message
    });
  }
};

// Create article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, author, category } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, dan author wajib diisi'
      });
    }

    let thumbnailUrl = null;

    // Upload thumbnail ke Supabase jika ada file
    if (req.file) {
      try {
        thumbnailUrl = await uploadToSupabase(req.file, 'thumbnails', 'articles');
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: 'Gagal upload thumbnail.',
          error: uploadErr.message
        });
      }
    }

    const article = await Article.create({
      title,
      content,
      author,
      category: category || 'General',
      thumbnail_url: thumbnailUrl
    });

    res.status(201).json({
      success: true,
      message: 'Article berhasil dibuat',
      data: article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat article',
      error: error.message
    });
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, category } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article tidak ditemukan'
      });
    }

    // Update data dasar
    if (title) article.title = title;
    if (content) article.content = content;
    if (author) article.author = author;
    if (category) article.category = category;

    // Handle thumbnail upload
    if (req.file) {
      try {
        // Hapus thumbnail lama
        if (article.thumbnail_url) {
          await deleteFromSupabase(article.thumbnail_url, 'thumbnails');
        }
        // Upload yang baru
        article.thumbnail_url = await uploadToSupabase(req.file, 'thumbnails', 'articles');
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: 'Gagal upload thumbnail.',
          error: uploadErr.message
        });
      }
    }

    await article.save();

    res.status(200).json({
      success: true,
      message: 'Article berhasil diupdate',
      data: article
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal update article',
      error: error.message
    });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article tidak ditemukan'
      });
    }

    // Hapus thumbnail dari Supabase
    if (article.thumbnail_url) {
      await deleteFromSupabase(article.thumbnail_url, 'thumbnails');
    }

    await article.destroy();

    res.status(200).json({
      success: true,
      message: 'Article berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus article',
      error: error.message
    });
  }
};

// Get all articles with pagination and search
exports.getAllArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await Article.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'thumbnail_url', 'author', 'category', 'createdAt', 'updatedAt']
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message
    });
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { sequelize } = require('../../models');
    const categories = await Article.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: categories.map(c => c.category).filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get latest articles
exports.getLatestArticles = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const articles = await Article.findAll({
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'thumbnail_url', 'author', 'category', 'createdAt']
    });

    res.status(200).json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest articles',
      error: error.message
    });
  }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Article.findAndCountAll({
      where: { category },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'thumbnail_url', 'author', 'category', 'createdAt']
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles by category',
      error: error.message
    });
  }
};
