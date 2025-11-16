// File: src/controllers/learningPathController.js
const db = require('../../models');
const LearningPath = db.LearningPath;
const Course = db.Course; // Kita perlukan untuk mengambil data detail

// @desc    Membuat Learning Path baru (Admin)
// @route   POST /api/v1/admin/learning-paths
const createLearningPath = async (req, res) => {
  const { title, description, price, thumbnail_url } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: 'Title dan Price wajib diisi.' });
  }

  try {
    const newLearningPath = await LearningPath.create({
      title,
      description: description || null,
      price: parseFloat(price),
      thumbnail_url: thumbnail_url || null,
    });
    return res.status(201).json(newLearningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error saat membuat Learning Path.', error: err.message });
  }
};

// @desc    Mengambil semua Learning Path (Admin)
// @route   GET /api/v1/admin/learning-paths
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

// @desc    Mengambil detail 1 Learning Path (Admin)
// @route   GET /api/v1/admin/learning-paths/:id
const getLearningPathById = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      // 'include' mengambil data relasi (Course dan Modul)
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: db.Module, // Ambil juga modulnya
          as: 'modules',
        },
      },
      order: [
        // Urutkan course dan modul
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

// @desc    Update Learning Path (Admin)
// @route   PUT /api/v1/admin/learning-paths/:id
const updateLearningPath = async (req, res) => {
  const { title, description, price, thumbnail_url } = req.body;
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    // Update data
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

// @desc    Hapus Learning Path (Admin)
// @route   DELETE /api/v1/admin/learning-paths/:id
const deleteLearningPath = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    await learningPath.destroy(); // Hapus dari database
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