// File: src/controllers/publicCatalogController.js
/**
 * @fileoverview Controller untuk mengelola tampilan katalog Learning Path (Public Read).
 * Endpoint ini dapat diakses oleh user yang belum login atau user yang ingin melihat katalog.
 */
const db = require('../../models');
const { LearningPath, Course, Module } = db;

/**
 * @function getPublicLearningPaths
 * @description Mengambil daftar semua Learning Path yang tersedia, hanya menampilkan atribut publik.
 * @route GET /api/v1/catalog/learning-paths
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 * @returns {object} Array Learning Path.
 */
const getPublicLearningPaths = async (req, res) => {
  try {
    // Hanya ambil data yang diperlukan untuk ditampilkan di katalog/landing page
    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getPublicLearningPathDetail
 * @description Mengambil detail lengkap 1 Learning Path, termasuk struktur Course dan Module.
 * Endpoint ini HANYA menampilkan struktur kurikulum, bukan konten URL video/ebook.
 * @route GET /api/v1/catalog/learning-paths/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Detail Learning Path beserta kurikulumnya.
 */
const getPublicLearningPathDetail = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url'],
      // Ambil struktur Course dan Module di dalamnya
      include: {
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'description', 'sequence_order'],
        include: {
          model: Module,
          as: 'modules',
          // Ambil atribut Module, tapi SANGAT PENTING untuk tidak menampilkan URL konten (video/ebook)
          attributes: ['id', 'title', 'module_type', 'sequence_order'],
        },
      },
      order: [
        // Urutkan Course dan Module berdasarkan sequence_order
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