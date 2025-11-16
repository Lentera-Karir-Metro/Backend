// File: src/controllers/learningController.js
/**
 * @fileoverview Controller untuk mengelola fungsionalitas belajar bagi pengguna (progres, penguncian, dashboard).
 * Controller ini hanya diakses oleh User yang sudah login (melalui middleware protect).
 */
const db = require('../../models');
const { 
  LearningPath, 
  Course, 
  Module, 
  UserEnrollment, 
  UserModuleProgress 
} = db;
const { Op } = require('sequelize'); // Diperlukan untuk query kompleks (misal: Op.in)

/**
 * @function getMyDashboard
 * @description Mengambil daftar semua Learning Path yang telah berhasil didaftarkan (dibeli) oleh user.
 * @route GET /api/v1/learn/dashboard
 *
 * @param {object} req - Objek request (req.user.id disediakan oleh middleware protect)
 * @param {object} res - Objek response
 * @returns {object} Array LearningPath yang di-enroll.
 */
const getMyDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    // Ambil semua enrollment yang sukses
    const enrollments = await UserEnrollment.findAll({
      where: { user_id: userId, status: 'success' },
      include: {
        model: LearningPath,
        attributes: ['id', 'title', 'description', 'thumbnail_url']
      },
      order: [['enrolled_at', 'DESC']]
    });

    // Ekstrak data LearningPath dari objek enrollment
    const learningPaths = enrollments.map(en => en.LearningPath);

    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getLearningPathContent
 * @description Mengambil seluruh struktur konten (Course/Module) dari Learning Path tertentu,
 * disertai status progres dan penguncian (lock status).
 * @route GET /api/v1/learn/learning-paths/:lp_id
 *
 * @param {object} req - Objek request (params: lp_id, req.user.id)
 * @param {object} res - Objek response
 * @returns {object} Struktur Learning Path lengkap dengan status is_locked dan is_completed.
 */
const getLearningPathContent = async (req, res) => {
  const userId = req.user.id;
  const { lp_id } = req.params;

  try {
    // 1. Cek apakah user terdaftar (wajib)
    const enrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: lp_id, status: 'success' }
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Akses ditolak. Anda belum terdaftar di learning path ini.' });
    }

    // 2. Ambil semua progres modul yg telah diselesaikan user (untuk lookup cepat)
    const completedProgress = await UserModuleProgress.findAll({
      where: { user_id: userId },
      attributes: ['module_id']
    });
    const completedModuleIds = new Set(completedProgress.map(p => p.module_id));

    // 3. Ambil struktur Learning Path, Course, dan Module
    const learningPath = await LearningPath.findByPk(lp_id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: Module,
          as: 'modules',
          // Sembunyikan URL konten untuk mencegah akses langsung tanpa validasi
          attributes: { exclude: ['video_url', 'ebook_url'] } 
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

    // 4. LOGIKA PENGUNCIAN (Kritis)
    const lpData = learningPath.toJSON();
    // Diasumsikan course pertama selalu terbuka
    let isPreviousCourseCompleted = true; 

    for (const course of lpData.courses) {
      let totalModules = course.modules.length;
      let completedModules = 0;
      // Diasumsikan modul pertama selalu terbuka
      let isPreviousModuleCompleted = true; 

      // Cek kunci Course: Course B terkunci sampai Course A selesai 100%
      course.is_locked = !isPreviousCourseCompleted;

      for (const module of course.modules) {
        // Cek status selesai dari user progress
        module.is_completed = completedModuleIds.has(module.id);
        if (module.is_completed) {
          completedModules++;
        }
        
        // Cek kunci Modul: Modul 2 terkunci sampai Modul 1 selesai
        // Modul terkunci jika: (Course-nya terkunci) ATAU (Modul sebelumnya belum selesai)
        module.is_locked = course.is_locked || !isPreviousModuleCompleted; 
        
        // Siapkan status completion untuk iterasi modul berikutnya
        isPreviousModuleCompleted = module.is_completed;
      }
      
      // Hitung apakah course saat ini selesai
      course.is_completed = (totalModules > 0 && completedModules === totalModules);
      
      // Siapkan status completion course saat ini untuk iterasi course berikutnya
      isPreviousCourseCompleted = course.is_completed;
    }

    return res.status(200).json(lpData);

  } catch (err) {
    console.error('Error saat mengambil konten LP:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function markModuleAsComplete
 * @description Memvalidasi akses, lalu menandai modul sebagai selesai di database.
 * Ini adalah validasi sisi Backend untuk tombol "Tandai Selesai".
 * @route POST /api/v1/learn/modules/:module_id/complete
 *
 * @param {object} req - Objek request (params: module_id, req.user.id)
 * @param {object} res - Objek response
 * @returns {object} Status completion.
 */
const markModuleAsComplete = async (req, res) => {
  const userId = req.user.id;
  const { module_id } = req.params;

  try {
    // 1. Cek eksistensi modul dan ambil data Course terkait
    const module = await Module.findByPk(module_id, {
      include: { model: Course, attributes: ['learning_path_id', 'sequence_order'] }
    });
    if (!module) {
      return res.status(404).json({ message: 'Modul tidak ditemukan.' });
    }

    // 2. Cek enrollment
    const enrollment = await UserEnrollment.findOne({
      where: { 
        user_id: userId, 
        learning_path_id: module.Course.learning_path_id,
        status: 'success'
      }
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Akses ditolak (tidak terdaftar).' });
    }

    // 3. VALIDASI PENGUNCIAN BACKEND
    
    // 3a. Cek modul sebelumnya (jika sequence_order > 1)
    if (module.sequence_order > 1) {
      const prevModule = await Module.findOne({
        where: {
          course_id: module.course_id,
          sequence_order: module.sequence_order - 1
        }
      });
      // Jika modul sebelumnya ada, cek progresnya
      if (prevModule) {
        const prevProgress = await UserModuleProgress.findOne({
          where: { user_id: userId, module_id: prevModule.id }
        });
        if (!prevProgress) {
          return res.status(403).json({ message: 'Modul sebelumnya belum selesai.' });
        }
      }
    }

    // 3b. Cek course sebelumnya (jika ini modul pertama (sequence_order=1) di course > 1)
    if (module.sequence_order === 1 && module.Course.sequence_order > 1) {
      const prevCourse = await Course.findOne({
        where: {
          learning_path_id: module.Course.learning_path_id,
          sequence_order: module.Course.sequence_order - 1
        },
        include: { model: Module, attributes: ['id'] }
      });
      
      if (prevCourse) {
        const prevCourseModuleIds = prevCourse.modules.map(m => m.id);
        const prevProgressCount = await UserModuleProgress.count({
          where: { user_id: userId, module_id: { [Op.in]: prevCourseModuleIds } }
        });
        // Course sebelumnya selesai jika jumlah progres sama dengan jumlah modul
        if (prevProgressCount < prevCourseModuleIds.length) {
          return res.status(403).json({ message: 'Course sebelumnya belum selesai.' });
        }
      }
    }

    // 4. Jika semua lolos, tandai selesai
    const [progress, created] = await UserModuleProgress.findOrCreate({
      where: { user_id: userId, module_id: module.id },
      defaults: { is_completed: true }
    });
    
    if (!created) {
      return res.status(200).json({ message: 'Modul sudah ditandai selesai.' });
    }

    return res.status(201).json({ message: 'Modul berhasil ditandai selesai.' });

  } catch (err) {
    console.error('Error saat menandai modul selesai:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
};