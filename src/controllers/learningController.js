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

    // 5. LOGIKA PENGUNCIAN (DISABLED - All modules unlocked)
    for (const course of lpData.courses) {
      let totalModules = course.modules.length;
      let completedModules = 0;

      // Status Lock Course - ALWAYS UNLOCKED
      course.is_locked = false;
      
      // Add course_id to match frontend expectations
      course.course_id = course.id;

      for (const module of course.modules) {
        // Cek Completed
        module.is_completed = completedModuleIds.has(module.id);
        if (module.is_completed) completedModules++;
        
        // Cek Locked - ALWAYS UNLOCKED
        module.is_locked = false;
        
        // TRANSFORM module fields to match frontend expectations
        module.module_id = module.id; // Frontend expects module_id instead of id
        module.type = module.module_type; // Frontend expects type instead of module_type
        module.duration = module.estimasi_waktu_menit || 0; // Frontend expects duration
      }
      
      // Cek Course Completed
      course.is_completed = (totalModules > 0 && completedModules === totalModules);
    }

    return res.status(200).json(lpData);

  } catch (err) {
    console.error('Error saat ambil materi:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function markModuleAsComplete
 * @description Menandai modul sebagai selesai. Auto-generate certificate jika progress 100%.
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

    // 3. Validasi Urutan (DISABLED - Allow any order)
    // Users can complete modules in any order

    // 4. Simpan Progress
    const [progress, created] = await UserModuleProgress.findOrCreate({
      where: { user_id: userId, module_id: module.id },
      defaults: { is_completed: true }
    });
    
    // 5. Check if Learning Path is 100% complete → Auto-generate certificate
    if (created) {
      await checkAndGenerateCertificate(userId, module.Course.learning_path_id);
    }
    
    return res.status(200).json({ message: 'Modul selesai.' });

  } catch (err) {
    console.error('Error saat update progress:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function checkAndGenerateCertificate
 * @description Check progress learning path, jika 100% auto-generate certificate
 * @param {string} userId - ID user
 * @param {string} learningPathId - ID learning path
 */
const checkAndGenerateCertificate = async (userId, learningPathId) => {
  try {
    const { Certificate } = db;
    
    // Check apakah sudah punya certificate untuk LP ini
    const existingCert = await Certificate.findOne({
      where: { user_id: userId, learning_path_id: learningPathId }
    });
    
    if (existingCert) {
      console.log('Certificate already exists for user:', userId, 'LP:', learningPathId);
      return;
    }

    // Hitung total modules di learning path ini
    const totalModules = await Module.count({
      include: {
        model: Course,
        as: 'course',
        where: { learning_path_id: learningPathId },
        attributes: []
      }
    });

    // Hitung completed modules
    const completedModules = await UserModuleProgress.count({
      where: { user_id: userId },
      include: {
        model: Module,
        as: 'module',
        required: true,
        include: {
          model: Course,
          as: 'course',
          where: { learning_path_id: learningPathId },
          attributes: []
        }
      }
    });

    console.log(`Progress check - Total: ${totalModules}, Completed: ${completedModules}`);

    // Jika 100% complete, generate certificate
    if (totalModules > 0 && completedModules >= totalModules) {
      // Hitung total hours dari semua modules
      const modules = await Module.findAll({
        include: {
          model: Course,
          as: 'course',
          where: { learning_path_id: learningPathId },
          attributes: []
        },
        attributes: ['duration']
      });

      const totalMinutes = modules.reduce((sum, m) => sum + (m.duration || 0), 0);
      const totalHours = Math.ceil(totalMinutes / 60);

      // Create certificate
      const certificate = await Certificate.create({
        user_id: userId,
        learning_path_id: learningPathId,
        issued_at: new Date(),
        total_hours: totalHours,
        certificate_url: null // Bisa di-generate nanti via admin/otomatis
      });

      console.log('✅ Certificate auto-generated:', certificate.id);
    }
  } catch (err) {
    console.error('Error checking/generating certificate:', err);
    // Don't throw - let module completion succeed even if cert generation fails
  }
};

/**
 * @function getMyEbooks
 * @description Mengambil ebook yang telah didownload user (exist in UserModuleProgress)
 * Hanya ebook yang sudah di-download (marked as completed) yang muncul di dashboard
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

    // Step 2: Query ebooks yang sudah di-download (exist in UserModuleProgress)
    // Hanya ebook yang user sudah klik download/complete yang muncul
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
       JOIN UserModuleProgresses ump ON ump.module_id = m.id AND ump.user_id = :userId
       WHERE c.learning_path_id IN (:ids)
       AND m.module_type = 'ebook'
       AND ump.is_completed = 1
       ORDER BY c.id, m.sequence_order ASC`,
      {
        replacements: { userId, ids: learningPathIds },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Downloaded ebooks found:', ebooks.length);
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

