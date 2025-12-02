// File: src/controllers/learningController.js
/**
 * @fileoverview Controller "Palugada" untuk Ruang Belajar.
 * Menyediakan data super lengkap dari Database (bukan dummy lagi)
 * agar Frontend tidak perlu request berulang kali.
 */
const db = require('../../models');
const { 
  LearningPath, 
  Course, 
  Module, 
  UserEnrollment, 
  UserModuleProgress,
  Sequelize
} = db;
const { Op } = Sequelize;

/**
 * @function getMyDashboard
 * @description Mengambil daftar semua Learning Path milik user.
 * @route GET /api/v1/learn/dashboard
 */
const getMyDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('=== GET MY DASHBOARD START ===');
    console.log('User ID:', userId);
    
    // Step 1: Query enrollments dengan raw query untuk debugging
    const enrollments = await db.sequelize.query(
      `SELECT id, learning_path_id, enrolled_at 
       FROM UserEnrollments 
       WHERE user_id = :userId AND status = 'success'
       ORDER BY enrolled_at DESC`,
      {
        replacements: { userId },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Enrollments found:', enrollments.length);
    console.log('Enrollments:', JSON.stringify(enrollments, null, 2));

    if (enrollments.length === 0) {
      console.log('No enrollments found, returning empty array');
      return res.status(200).json([]);
    }

    // Step 2: Get learning path IDs
    const learningPathIds = enrollments.map(en => en.learning_path_id);
    console.log('Learning Path IDs:', learningPathIds);

    // Step 3: Query learning paths dengan raw query
    const learningPaths = await db.sequelize.query(
      `SELECT id, title, description, thumbnail_url, price, rating, 
              category, discount_amount, level, review_count
       FROM LearningPaths 
       WHERE id IN (:ids)`,
      {
        replacements: { ids: learningPathIds },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Learning Paths found:', learningPaths.length);
    console.log('Learning Paths:', JSON.stringify(learningPaths, null, 2));

    // Step 4: Add progress data
    const result = learningPaths.map(lp => ({
      ...lp,
      progress_percent: 0,
      total_modules: 12
    }));

    console.log('=== GET MY DASHBOARD SUCCESS ===');
    return res.status(200).json(result);
    
  } catch (err) {
    console.error('=== GET MY DASHBOARD ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      message: 'Server error.', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * @function getLearningPathContent
 * @description API Utama Ruang Belajar. 
 * Mengambil data REAL dari DB, menyusun objek Mentor, dan menghitung status Lock.
 * @route GET /api/v1/learn/learning-paths/:lp_id
 */
const getLearningPathContent = async (req, res) => {
  const userId = req.user.id;
  const { lp_id } = req.params;

  try {
    // 1. Validasi: User harus sudah beli
    const enrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: lp_id, status: 'success' }
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Akses ditolak. Anda belum terdaftar di kelas ini.' });
    }

    // 2. Ambil progress user
    const completedProgress = await UserModuleProgress.findAll({
      where: { user_id: userId },
      attributes: ['module_id']
    });
    const completedModuleIds = new Set(completedProgress.map(p => p.module_id));

    // 3. Ambil Data Lengkap dari DB
    const learningPath = await LearningPath.findByPk(lp_id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: Module,
          as: 'modules',
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });
    
    if (!learningPath) return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });

    // 4. FORMAT DATA JSON
    const lpData = learningPath.toJSON();

    // TRANSFORMASI DATA MENTOR (Kolom DB -> Objek UI)
    // Kita ubah kolom flat (mentor_name) menjadi object (mentor { name }) agar Frontend rapi
    lpData.mentor = {
        name: lpData.mentor_name || "Tim Lentera Karir",
        job_title: lpData.mentor_title || "Expert Instructor",
        avatar_url: lpData.mentor_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lpData.mentor_name || "Mentor")}&background=random`
    };

    // Hapus kolom flat agar response bersih (opsional)
    delete lpData.mentor_name;
    delete lpData.mentor_title;
    delete lpData.mentor_avatar_url;

    // 5. LOGIKA PENGUNCIAN (Lock System)
    let isPreviousCourseCompleted = true; 

    for (const course of lpData.courses) {
      let totalModules = course.modules.length;
      let completedModules = 0;
      let isPreviousModuleCompleted = true; 

      // Status Lock Course
      course.is_locked = !isPreviousCourseCompleted;

      for (const module of course.modules) {
        // Cek Completed
        module.is_completed = completedModuleIds.has(module.id);
        if (module.is_completed) completedModules++;
        
        // Cek Locked
        module.is_locked = course.is_locked || !isPreviousModuleCompleted; 
        
        isPreviousModuleCompleted = module.is_completed;
      }
      
      // Cek Course Completed
      course.is_completed = (totalModules > 0 && completedModules === totalModules);
      isPreviousCourseCompleted = course.is_completed;
    }

    return res.status(200).json(lpData);

  } catch (err) {
    console.error('Error saat ambil materi:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function markModuleAsComplete
 * @description Menandai modul sebagai selesai.
 * @route POST /api/v1/learn/modules/:module_id/complete
 */
const markModuleAsComplete = async (req, res) => {
  const userId = req.user.id;
  const { module_id } = req.params;

  try {
    // 1. Cek Modul
    const module = await Module.findByPk(module_id, {
      include: { model: Course, attributes: ['learning_path_id', 'sequence_order'] }
    });
    if (!module) return res.status(404).json({ message: 'Modul tidak ditemukan.' });

    // 2. Cek Enrollment
    const enrollment = await UserEnrollment.findOne({
      where: { 
        user_id: userId, 
        learning_path_id: module.Course.learning_path_id,
        status: 'success'
      }
    });
    if (!enrollment) return res.status(403).json({ message: 'Akses ditolak.' });

    // 3. Validasi Urutan (Anti-Cheat)
    if (module.sequence_order > 1) {
      const prevModule = await Module.findOne({
        where: { course_id: module.course_id, sequence_order: module.sequence_order - 1 }
      });
      if (prevModule) {
        const prevProgress = await UserModuleProgress.findOne({
          where: { user_id: userId, module_id: prevModule.id }
        });
        if (!prevProgress) return res.status(403).json({ message: 'Modul sebelumnya belum selesai.' });
      }
    }

    // 4. Simpan Progress
    await UserModuleProgress.findOrCreate({
      where: { user_id: userId, module_id: module.id },
      defaults: { is_completed: true }
    });
    
    return res.status(200).json({ message: 'Modul selesai.' });

  } catch (err) {
    console.error('Error saat update progress:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getMyEbooks
 * @description Mengambil semua ebook yang dimiliki user dari course yang telah dibeli
 * @route GET /api/v1/learn/ebooks
 */
const getMyEbooks = async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('=== GET MY EBOOKS START ===');
    console.log('User ID:', userId);

    // Step 1: Query enrollments dengan raw query
    const enrollments = await db.sequelize.query(
      `SELECT learning_path_id 
       FROM UserEnrollments 
       WHERE user_id = :userId AND status = 'success'`,
      {
        replacements: { userId },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Enrollments found:', enrollments.length);

    if (enrollments.length === 0) {
      console.log('No enrollments, returning empty array');
      return res.status(200).json({ success: true, data: [] });
    }

    const learningPathIds = enrollments.map(e => e.learning_path_id);
    console.log('Learning Path IDs:', learningPathIds);

    // Step 2: Query ebooks dengan JOIN (JOIN LearningPaths untuk thumbnail)
    const ebooks = await db.sequelize.query(
      `SELECT 
        m.id, 
        m.title, 
        m.ebook_url,
        c.title as course_title,
        lp.thumbnail_url as course_thumbnail
       FROM Modules m
       JOIN Courses c ON m.course_id = c.id
       JOIN LearningPaths lp ON c.learning_path_id = lp.id
       WHERE c.learning_path_id IN (:ids)
       AND m.module_type = 'ebook'
       ORDER BY c.id, m.sequence_order ASC`,
      {
        replacements: { ids: learningPathIds },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Ebooks found:', ebooks.length);
    console.log('=== GET MY EBOOKS SUCCESS ===');

    return res.status(200).json({ success: true, data: ebooks });
  } catch (err) {
    console.error('=== GET MY EBOOKS ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error.', 
      error: err.message 
    });
  }
};

module.exports = {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
  getMyEbooks,
};

