// File: src/controllers/publicCatalogController.js
const db = require('../../models');
const { LearningPath, Course, Module, LearningPathCourse, Sequelize } = db;

// GET /api/v1/catalog/learning-paths
// Mengembalikan daftar LearningPath beserta course_count (dinamis).
const getPublicLearningPaths = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 1) Ambil halaman LearningPath terlebih dahulu (paged)
    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'description', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    // 2) Ambil counts untuk LP yang ada pada page ini (two-query pattern)
    const lpIds = learningPaths.map(lp => lp.id);
    let countsMap = {};
    if (lpIds.length) {
      const counts = await LearningPathCourse.findAll({
        attributes: ['learning_path_id', [Sequelize.fn('COUNT', Sequelize.col('course_id')), 'cnt']],
        where: { learning_path_id: lpIds },
        group: ['learning_path_id'],
      });
      countsMap = counts.reduce((m, r) => { m[r.learning_path_id] = parseInt(r.get('cnt'), 10); return m; }, {});
    }

    // 3) Gabungkan count ke tiap LearningPath dan return
    const result = learningPaths.map(lp => {
      const obj = lp.toJSON();
      obj.course_count = countsMap[lp.id] || 0;
      return obj;
    });

    return res.status(200).json({ data: result, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getPublicLearningPathDetail = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'createdAt'],
      include: {
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'description', 'price', 'thumbnail_url', 'discount_amount', 'category', 'mentor_name', 'mentor_title', 'mentor_photo_profile', 'status'],
        through: { attributes: ['sequence_order'] },
        include: {
          model: Module,
          as: 'modules',
          // `module_type` and `estimasi_waktu_menit` sudah dihapus dari model.
          // Ambil URL fields sehingga caller bisa menurunkan tipe/durasi dari data yang tersedia.
          attributes: ['id', 'title', 'sequence_order', 'video_url', 'ebook_url', 'quiz_id'],
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'LearningPathCourse', 'sequence_order', 'ASC'],
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