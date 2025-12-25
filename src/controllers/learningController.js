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
const { generateCustomId } = require('../utils/idGenerator');
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
      `SELECT id, learning_path_id, course_id, enrolled_at
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

    // Step 3: Resolve LearningPath IDs from enrollments and enrolled courses
    // Collect direct LP ids from enrollments
    const directLpIds = enrollments.map(e => e.learning_path_id).filter(Boolean);
    // Collect course ids from enrollments
    const enrolledCourseIds = enrollments.map(e => e.course_id).filter(Boolean);

    // If there are enrolled courses, find LPs that include those courses
    let lpIdsFromCourses = [];
    if (enrolledCourseIds.length) {
      const mappings = await db.LearningPathCourse.findAll({ where: { course_id: enrolledCourseIds }, attributes: ['learning_path_id'] });
      lpIdsFromCourses = mappings.map(m => m.learning_path_id);
    }

    const combinedLpIds = Array.from(new Set([...directLpIds, ...lpIdsFromCourses, ...learningPathIds]));

    const learningPaths = await LearningPath.findAll({ where: { id: combinedLpIds }, attributes: ['id','title','description','createdAt'] });

    console.log('Learning Paths found:', learningPaths.length);
    console.log('Learning Paths:', JSON.stringify(learningPaths, null, 2));

    // Step 4: Calculate real progress for each learning path
    const result = await Promise.all(
      learningPaths.map(async (lp) => {
        // Count total modules in this learning path
        // Count modules that belong to courses mapped to this learning path
        const totalModules = await db.sequelize.query(
          `SELECT COUNT(*) as count
           FROM Modules m
           INNER JOIN Courses c ON m.course_id = c.id
           INNER JOIN LearningPathCourses lpc ON lpc.course_id = c.id
           WHERE lpc.learning_path_id = :lpId`,
          {
            replacements: { lpId: lp.id },
            type: db.Sequelize.QueryTypes.SELECT
          }
        );

        // Count completed modules by this user
        const completedModules = await db.sequelize.query(
          `SELECT COUNT(*) as count
           FROM UserModuleProgresses ump
           INNER JOIN Modules m ON ump.module_id = m.id
           INNER JOIN Courses c ON m.course_id = c.id
           INNER JOIN LearningPathCourses lpc ON lpc.course_id = c.id
           WHERE lpc.learning_path_id = :lpId AND ump.user_id = :userId`,
          {
            replacements: { lpId: lp.id, userId },
            type: db.Sequelize.QueryTypes.SELECT
          }
        );

        const total = totalModules[0]?.count || 0;
        const completed = completedModules[0]?.count || 0;
        const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          ...lp,
          progress_percent: progressPercent,
          total_modules: total,
          completed_modules: completed
        };
      })
    );

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
    // 1. Validasi: User harus sudah beli minimal satu course di learning path ini
    // Ambil course ids yang termasuk di learning path
    const lpMappings = await db.LearningPathCourse.findAll({ where: { learning_path_id: lp_id }, attributes: ['course_id'] });
    const lpCourseIds = lpMappings.map(m => m.course_id);

    const enrollment = await UserEnrollment.findOne({
      where: {
        user_id: userId,
        status: 'success',
        [db.Sequelize.Op.or]: [
          { learning_path_id: lp_id },
          lpCourseIds.length ? { course_id: lpCourseIds } : null
        ].filter(Boolean)
      }
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
        through: { attributes: ['sequence_order'] },
        include: {
          model: Module,
          as: 'modules',
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'LearningPathCourse', 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });

    if (!learningPath) return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });

    // 4. FORMAT DATA JSON
    const lpData = learningPath.toJSON();

    // TRANSFORMASI DATA MENTOR: derive from first course's mentor fields if available
    if (lpData.courses && lpData.courses.length > 0) {
      const firstCourse = lpData.courses[0];
      lpData.mentor = {
        name: firstCourse.mentor_name || 'Tim Lentera Karir',
        job_title: firstCourse.mentor_title || 'Expert Instructor',
        avatar_url: firstCourse.mentor_photo_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstCourse.mentor_name || 'Mentor')}&background=random`
      };
    } else {
      lpData.mentor = { name: 'Tim Lentera Karir', job_title: 'Expert Instructor', avatar_url: `https://ui-avatars.com/api/?name=Mentor&background=random` };
    }

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
        // derive type from available fields (model no longer has `module_type`)
        if (module.video_url) {
          module.type = 'video';
        } else if (module.ebook_url) {
          module.type = 'ebook';
        } else if (module.quiz_id) {
          module.type = 'quiz';
        } else {
          module.type = 'quiz';
        }
        // duration/estimasi tidak disimpan anymore — default to 0
        module.duration = 0;
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
      include: { model: Course, attributes: ['id', 'mentor_name', 'sequence_order'] }
    });
    if (!module) return res.status(404).json({ message: 'Modul tidak ditemukan.' });

    // 2. Cek Enrollment
    const enrollment = await UserEnrollment.findOne({
      where: {
        user_id: userId,
        course_id: module.course_id,
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
      await checkAndCreatePendingCertificate(userId, module.course_id);
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
const checkAndCreatePendingCertificate = async (userId, courseId) => {
  try {
    const { Certificate } = db;

    // Jika sudah ada certificate (pending atau generated), skip
    const existingCert = await Certificate.findOne({ where: { user_id: userId, course_id: courseId } });
    if (existingCert) return;

    // Hitung total modules di course ini
    const totalModules = await Module.count({ where: { course_id: courseId } });

    // Hitung completed modules user untuk course ini
    const completedModules = await UserModuleProgress.count({
      where: { user_id: userId },
      include: { model: Module, as: 'module', required: true, where: { course_id: courseId } }
    });

    if (totalModules === 0) return;

    const progressPercent = Math.round((completedModules / totalModules) * 100);
    if (progressPercent >= 100) {
      const certId = generateCustomId('CERT');
      await Certificate.create({
        id: certId,
        user_id: userId,
        course_id: courseId,
        recipient_name: null,
        course_title: null,
        instructor_name: null,
        issued_at: new Date(),
        total_hours: 0,
        certificate_url: null,
        status: 'pending'
      });
      console.log('Created pending certificate for user', userId, 'course', courseId);
    }
  } catch (err) {
    console.error('Error in checkAndCreatePendingCertificate:', err.message);
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

    // Step 1: Query enrollments dengan raw query (ambil juga course_id)
    const enrollments = await db.sequelize.query(
      `SELECT learning_path_id, course_id
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

    // Resolve LP ids from enrollments and course mappings
    const directLpIds = enrollments.map(e => e.learning_path_id).filter(Boolean);
    const enrolledCourseIds = enrollments.map(e => e.course_id).filter(Boolean);
    let lpIdsFromCourses = [];
    if (enrolledCourseIds.length) {
      const mappings = await db.LearningPathCourse.findAll({ where: { course_id: enrolledCourseIds }, attributes: ['learning_path_id'] });
      lpIdsFromCourses = mappings.map(m => m.learning_path_id);
    }
    const learningPathIds = Array.from(new Set([...directLpIds, ...lpIdsFromCourses]));
    console.log('Learning Path IDs:', learningPathIds);

    // Step 2: Query ebooks yang sudah di-download (exist in UserModuleProgress)
    // Hanya ebook yang user sudah klik download/complete yang muncul
    const ebooks = await db.sequelize.query(
      `SELECT 
        m.id, 
        m.title, 
        m.ebook_url,
        c.title as course_title,
        c.thumbnail_url as course_thumbnail
       FROM Modules m
       JOIN Courses c ON m.course_id = c.id
       JOIN LearningPathCourses lpc ON lpc.course_id = c.id
       JOIN UserModuleProgresses ump ON ump.module_id = m.id AND ump.user_id = :userId
      WHERE lpc.learning_path_id IN (:ids)
      AND m.ebook_url IS NOT NULL
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

