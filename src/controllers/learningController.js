// File: src/controllers/learningController.js
const db = require('../../models');
const { 
  LearningPath, 
  Course, 
  Module, 
  UserEnrollment, 
  UserModuleProgress 
} = db;
const { Op } = require('sequelize');

// @desc    Mengambil dashboard user (daftar learning path yg terdaftar)
// @route   GET /api/v1/learn/dashboard
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

    // Format ulang data agar rapi
    const learningPaths = enrollments.map(en => en.LearningPath);

    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Mengambil konten Learning Path (Validasi enrollment & progres)
// @route   GET /api/v1/learn/learning-paths/:lp_id
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

    // 2. Ambil semua progres modul yg telah diselesaikan user
    const completedProgress = await UserModuleProgress.findAll({
      where: { user_id: userId },
      attributes: ['module_id']
    });
    // Buat Set (HashSet) agar pencarian cepat (O(1))
    const completedModuleIds = new Set(completedProgress.map(p => p.module_id));

    // 3. Ambil struktur Learning Path, Course, dan Module
    const learningPath = await LearningPath.findByPk(lp_id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: Module,
          as: 'modules',
          attributes: { exclude: ['video_url', 'ebook_url'] } // Sembunyikan URL konten
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
    // Kita proses data JSON-nya untuk menambahkan status 'is_completed' dan 'is_locked'
    const lpData = learningPath.toJSON();
    let isPreviousCourseCompleted = true; // Course pertama selalu terbuka

    for (const course of lpData.courses) {
      let totalModules = course.modules.length;
      let completedModules = 0;
      let isPreviousModuleCompleted = true; // Modul pertama selalu terbuka

      // Cek kunci Course: apakah course sebelumnya selesai?
      course.is_locked = !isPreviousCourseCompleted; //

      for (const module of course.modules) {
        module.is_completed = completedModuleIds.has(module.id);
        if (module.is_completed) {
          completedModules++;
        }

        // Cek kunci Modul: apakah course-nya terkunci ATAU modul sebelumnya blm selesai?
        module.is_locked = course.is_locked || !isPreviousModuleCompleted; //

        // Siapkan untuk iterasi modul berikutnya
        isPreviousModuleCompleted = module.is_completed;
      }

      course.is_completed = (totalModules > 0 && completedModules === totalModules);
      // Siapkan untuk iterasi course berikutnya
      isPreviousCourseCompleted = course.is_completed;
    }

    return res.status(200).json(lpData);

  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Menandai modul sebagai selesai (TOMBOL "TANDAI SELESAI")
// @route   POST /api/v1/learn/modules/:module_id/complete
const markModuleAsComplete = async (req, res) => {
  const userId = req.user.id;
  const { module_id } = req.params;

  try {
    // 1. Cek apakah modul ada
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

    // 3. Cek Logika Penguncian (Validasi Backend)
    // (Kita harus cek ulang logika penguncian di sini agar user tidak curang)

    // 3a. Cek modul sebelumnya (jika ada)
    if (module.sequence_order > 1) {
      const prevModule = await Module.findOne({
        where: {
          course_id: module.course_id,
          sequence_order: module.sequence_order - 1
        }
      });
      if (prevModule) {
        const prevProgress = await UserModuleProgress.findOne({
          where: { user_id: userId, module_id: prevModule.id }
        });
        if (!prevProgress) {
          return res.status(403).json({ message: 'Modul sebelumnya belum selesai.' });
        }
      }
    }

    // 3b. Cek course sebelumnya (jika ini modul pertama di course > 1)
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
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
};