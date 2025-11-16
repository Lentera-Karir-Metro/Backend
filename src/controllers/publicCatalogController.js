// File: src/controllers/publicCatalogController.js
const db = require('../../models');
const { LearningPath, Course, Module } = db;

// @desc    Mengambil semua Learning Path (Publik)
// @route   GET /api/v1/catalog/learning-paths
const getPublicLearningPaths = async (req, res) => {
  try {
    // Hanya ambil data yg perlu untuk katalog
    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Mengambil detail 1 Learning Path (Publik)
// @route   GET /api/v1/catalog/learning-paths/:id
const getPublicLearningPathDetail = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url'],
      include: {
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'description', 'sequence_order'],
        include: {
          model: Module,
          as: 'modules',
          attributes: ['id', 'title', 'module_type', 'sequence_order'],
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getPublicLearningPaths,
  getPublicLearningPathDetail,
};