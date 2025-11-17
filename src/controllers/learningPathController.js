/**
 * @fileoverview Controller untuk mengelola CRUD (Create, Read, Update, Delete) entitas LearningPath.
 * Controller ini diakses khusus oleh Admin.
 */
const db = require('../../models');
const LearningPath = db.LearningPath;
const Course = db.Course; 
const Module = db.Module;
const { generateCustomId } = require('../utils/idGenerator');

/**
 * @function createLearningPath
 * @description Membuat Learning Path baru.
 * @route POST /api/v1/admin/learning-paths
 *
 * @param {object} req - Objek request (body: { title, description, price, thumbnail_url })
 * @param {object} res - Objek response
 * @returns {object} Learning Path yang baru dibuat.
 */
const createLearningPath = async (req, res) => {
  const { title, description, price, thumbnail_url } = req.body;

  // Validasi input wajib (Title dan Price)
  if (!title || !price) {
    return res.status(400).json({ message: 'Title dan Price wajib diisi.' });
  }

  try {
    const newLearningPath = await LearningPath.create({
      id: generateCustomId('LP'), // Generate ID custom (LP-XXXXXX)
      title,
      description: description || null,
      price: parseFloat(price),
      thumbnail_url: thumbnail_url || null,
    });
    return res.status(201).json(newLearningPath);
  } catch (err) {
    console.error('Error saat membuat Learning Path:', err.message);
    return res.status(500).json({ message: 'Server error saat membuat Learning Path.', error: err.message });
  }
};

/**
 * @function getAllLearningPaths
 * @description Mengambil semua Learning Path yang ada (untuk daftar di panel admin).
 * @route GET /api/v1/admin/learning-paths
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 * @returns {object} Array Learning Path.
 */
const getAllLearningPaths = async (req, res) => {
  try {
    const learningPaths = await LearningPath.findAll({
      order: [['createdAt', 'DESC']], 
    });
    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getLearningPathById
 * @description Mengambil detail lengkap 1 Learning Path, termasuk Course dan Module di dalamnya.
 * @route GET /api/v1/admin/learning-paths/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Detail Learning Path yang diminta.
 */
const getLearningPathById = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: db.Module,
          as: 'modules',
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: db.Module, as: 'modules' }, 'sequence_order', 'ASC']
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

/**
 * @function updateLearningPath
 * @description Memperbarui data Learning Path (misal: harga, deskripsi).
 * @route PUT /api/v1/admin/learning-paths/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, price, ... })
 * @param {object} res - Objek response
 * @returns {object} Learning Path yang sudah diperbarui.
 */
const updateLearningPath = async (req, res) => {
  const { title, description, price, thumbnail_url } = req.body;
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    learningPath.title = title || learningPath.title;
    learningPath.description = description || learningPath.description;
    learningPath.price = price !== undefined ? parseFloat(price) : learningPath.price; 
    learningPath.thumbnail_url = thumbnail_url || learningPath.thumbnail_url;

    await learningPath.save();
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteLearningPath
 * @description Menghapus Learning Path berdasarkan ID.
 * @route DELETE /api/v1/admin/learning-paths/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteLearningPath = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    await learningPath.destroy(); 
    return res.status(200).json({ message: 'Learning Path berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createLearningPath,
  getAllLearningPaths,
  getLearningPathById,
  updateLearningPath,
  deleteLearningPath,
};
