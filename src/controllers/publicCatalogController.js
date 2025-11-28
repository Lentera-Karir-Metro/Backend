// File: src/controllers/publicCatalogController.js
const db = require('../../models');
const { LearningPath, Course, Module } = db;

const getPublicLearningPaths = async (req, res) => {
  try {
    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'description', 'price', 'thumbnail_url'],
      order: [['createdAt', 'DESC']],
    });

    // --- INJECT DUMMY DATA (SOLUSI) ---
    const enrichedData = learningPaths.map(lp => {
        const data = lp.toJSON();
        data.rating = 4.8;            // Data Dummy
        data.total_students = 120 + Math.floor(Math.random() * 100); // Random angka biar beda
        data.category = "Teknologi";  // Data Dummy
        return data;
    });

    return res.status(200).json(enrichedData);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getPublicLearningPathDetail = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      // ... (include Courses & Modules sama seperti sebelumnya) ...
      include: {
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'description', 'sequence_order'],
        include: {
          model: Module,
          as: 'modules',
          attributes: ['id', 'title', 'module_type', 'sequence_order', 'estimasi_waktu_menit'], // Tambah estimasi waktu
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });

    if (!learningPath) return res.status(404).json({ message: 'Not found' });

    // --- INJECT DUMMY DATA UNTUK DETAIL KELAS ---
    const data = learningPath.toJSON();
    data.rating = 4.9;
    data.total_students = 340;
    data.level = "Beginner";
    data.mentor = {
        name: "Ayu Putri",
        role: "Senior Product Manager",
        avatar_url: "https://ui-avatars.com/api/?name=Ayu+Putri&background=random"
    };

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getPublicLearningPaths, getPublicLearningPathDetail };