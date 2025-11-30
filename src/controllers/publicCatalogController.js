// File: src/controllers/publicCatalogController.js
const db = require('../../models');
const { LearningPath, Course, Module } = db;

const getPublicLearningPaths = async (req, res) => {
  try {
    // Data rating & review_count akan otomatis terambil dari database
    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url', 'rating', 'review_count', 'category', 'discount_amount'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getPublicLearningPathDetail = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      // Ambil data lengkap termasuk rating & review_count
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url', 'rating', 'review_count', 'category', 'discount_amount'],
      include: {
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'description', 'sequence_order'],
        include: {
          model: Module,
          as: 'modules',
          attributes: ['id', 'title', 'module_type', 'sequence_order', 'estimasi_waktu_menit'],
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });

    if (!learningPath) return res.status(404).json({ message: 'Not found' });

    // Return data asli database
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getPublicLearningPaths, getPublicLearningPathDetail };