// File: src/controllers/dashboardController.js
/**
 * @fileoverview Dashboard Controller - Menangani statistik dan overview dashboard user
 */
const db = require('../../models');
const { 
  UserEnrollment, 
  Certificate,
  LearningPath,
  Course,
  Module,
  UserModuleProgress,
  Sequelize
} = db;
const { Op } = Sequelize;

/**
 * @function getDashboardStats
 * @description Mengambil statistik dashboard user (jumlah kelas, ebook, sertifikat)
 * @route GET /api/v1/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Count jumlah kelas (enrollment yang success)
    const totalKelas = await UserEnrollment.count({
      where: { user_id: userId, status: 'success' }
    });

    // Count jumlah sertifikat yang sudah didapat
    const totalSertifikat = await Certificate.count({
      where: { user_id: userId }
    });

    // Count ebook yang sudah di-download (exist in UserModuleProgress)
    // Hanya ebook yang user sudah klik download yang dihitung
    const totalEbook = await UserModuleProgress.count({
      where: { user_id: userId },
      include: {
        model: Module,
        as: 'module',
        where: { module_type: 'ebook' },
        required: true,
        attributes: []
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalKelas,
        totalEbook,
        totalSertifikat
      }
    });
  } catch (err) {
    console.error('Error getDashboardStats:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data statistik dashboard', 
      error: err.message 
    });
  }
};

/**
 * @function getContinueLearning
 * @description Mengambil kelas yang sedang dipelajari (progress belum 100%)
 * @route GET /api/v1/dashboard/continue-learning
 */
exports.getContinueLearning = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Ambil semua enrollment user yang success
    const enrollments = await UserEnrollment.findAll({
      where: { user_id: userId, status: 'success' },
      include: {
        model: LearningPath,
        as: 'LearningPath', // Gunakan alias yang sesuai dengan model
        attributes: ['id', 'title', 'description', 'thumbnail_url']
      },
      order: [['enrolled_at', 'DESC']]
    });

    if (enrollments.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Belum ada kelas yang diikuti'
      });
    }

    // Hitung progress untuk setiap learning path
    const learningPathsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lpId = enrollment.learning_path_id;
        
        // Hitung total modul dalam learning path ini
        const totalModules = await Module.count({
          include: {
            model: Course,
            as: 'course',
            where: { learning_path_id: lpId },
            attributes: []
          }
        });

        // Hitung modul yang sudah diselesaikan
        const completedModules = await UserModuleProgress.count({
          where: { user_id: userId },
          include: {
            model: Module,
            as: 'module',
            required: true,
            include: {
              model: Course,
              as: 'course',
              where: { learning_path_id: lpId },
              attributes: []
            }
          }
        });

        const progressPercent = totalModules > 0 
          ? Math.round((completedModules / totalModules) * 100) 
          : 0;

        return {
          ...enrollment.LearningPath.toJSON(),
          progress_percent: progressPercent,
          total_modules: totalModules,
          completed_modules: completedModules
        };
      })
    );

    // Filter hanya yang progress-nya belum 100% (masih dalam proses belajar)
    const inProgressLearning = learningPathsWithProgress.filter(
      lp => lp.progress_percent > 0 && lp.progress_percent < 100
    );

    // Jika tidak ada yang in progress, ambil yang pertama kali enrolled
    const continueData = inProgressLearning.length > 0 
      ? inProgressLearning[0] 
      : learningPathsWithProgress[0];

    return res.status(200).json({
      success: true,
      data: continueData
    });
  } catch (err) {
    console.error('Error getContinueLearning:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data continue learning', 
      error: err.message 
    });
  }
};

/**
 * @function getRecommendedCourses
 * @description Mengambil rekomendasi kelas berdasarkan kategori yang user ikuti
 * @route GET /api/v1/dashboard/recommended
 */
exports.getRecommendedCourses = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Ambil kategori dari learning path yang sudah user ikuti
    const userEnrollments = await UserEnrollment.findAll({
      where: { user_id: userId, status: 'success' },
      include: {
        model: LearningPath,
        attributes: ['category']
      },
      attributes: []
    });

    const userCategories = [...new Set(
      userEnrollments.map(e => e.LearningPath.category).filter(Boolean)
    )];

    // Ambil learning path yang belum diikuti user
    const enrolledLpIds = userEnrollments.map(e => e.learning_path_id);
    
    let whereClause = {
      id: { [Op.notIn]: enrolledLpIds }
    };

    // Jika user punya kategori favorit, prioritaskan itu
    if (userCategories.length > 0) {
      whereClause.category = { [Op.in]: userCategories };
    }

    const recommendedCourses = await LearningPath.findAll({
      where: whereClause,
      attributes: [
        'id', 'title', 'description', 'thumbnail_url', 
        'price', 'rating', 'category', 'level', 'total_students'
      ],
      limit: 6,
      order: [
        ['rating', 'DESC'],
        ['total_students', 'DESC']
      ]
    });

    // Jika tidak ada rekomendasi berdasarkan kategori, ambil yang paling populer
    if (recommendedCourses.length === 0) {
      const popularCourses = await LearningPath.findAll({
        where: {
          id: { [Op.notIn]: enrolledLpIds }
        },
        attributes: [
          'id', 'title', 'description', 'thumbnail_url', 
          'price', 'rating', 'category', 'level', 'total_students'
        ],
        limit: 6,
        order: [
          ['rating', 'DESC'],
          ['total_students', 'DESC']
        ]
      });

      return res.status(200).json({
        success: true,
        data: popularCourses
      });
    }

    return res.status(200).json({
      success: true,
      data: recommendedCourses
    });
  } catch (err) {
    console.error('Error getRecommendedCourses:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data rekomendasi kelas', 
      error: err.message 
    });
  }
};
