// File: src/controllers/articleController.js
const { Article } = require('../../models');
const { Op } = require('sequelize');

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
