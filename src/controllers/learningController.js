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
      `SELECT id, course_id, enrolled_at
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

    // Step 2: Get learning path IDs from enrolled courses
    const enrolledCourseIds = enrollments.map(e => e.course_id).filter(Boolean);
    console.log('Enrolled Course IDs:', enrolledCourseIds);

    // Find LPs that include those courses
    let learningPathIds = [];
    if (enrolledCourseIds.length) {
      const mappings = await db.LearningPathCourse.findAll({ where: { course_id: enrolledCourseIds }, attributes: ['learning_path_id'] });
      learningPathIds = [...new Set(mappings.map(m => m.learning_path_id))];
    }

    const combinedLpIds = learningPathIds;

    const learningPaths = await LearningPath.findAll({ where: { id: combinedLpIds }, attributes: ['id', 'title', 'description', 'createdAt'] });

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

    // Check if user has enrolled in any course from this learning path
    const enrollment = lpCourseIds.length ? await UserEnrollment.findOne({
      where: {
        user_id: userId,
        status: 'success',
        course_id: lpCourseIds
      }
    }) : null;
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
    console.log('[markModuleAsComplete] Request:', { userId, module_id });

    // 1. Cek Modul
    const module = await Module.findByPk(module_id, {
      include: { 
        model: Course, 
        as: 'course', // Gunakan alias yang didefinisikan di model
        attributes: ['id', 'mentor_name'] // Hapus sequence_order karena tidak ada di tabel Course
      }
    });
    
    if (!module) {
      console.log('[markModuleAsComplete] Module not found:', module_id);
      return res.status(404).json({ message: 'Modul tidak ditemukan.' });
    }

    console.log('[markModuleAsComplete] Module found:', { 
      id: module.id, 
      course_id: module.course_id 
    });

    // 2. Cek Enrollment
    const enrollment = await UserEnrollment.findOne({
      where: {
        user_id: userId,
        course_id: module.course_id,
        status: 'success'
      }
    });
    
    if (!enrollment) {
      console.log('[markModuleAsComplete] Enrollment not found:', { userId, course_id: module.course_id });
      return res.status(403).json({ message: 'Akses ditolak. Anda belum terdaftar di kelas ini.' });
    }

    console.log('[markModuleAsComplete] Enrollment found');

    // 3. Validasi Urutan (DISABLED - Allow any order)
    // Users can complete modules in any order

    // 4. Simpan Progress
    const [progress, created] = await UserModuleProgress.findOrCreate({
      where: { user_id: userId, module_id: module.id },
      defaults: { is_completed: true }
    });

    console.log('[markModuleAsComplete] Progress saved:', { created, progress: progress.id });

    console.log('[markModuleAsComplete] Progress saved:', { created, progress: progress.id });

    // 5. Check if Learning Path is 100% complete → Auto-generate certificate
    if (created) {
      await checkAndCreatePendingCertificate(userId, module.course_id);
    }

    console.log('[markModuleAsComplete] Success');
    return res.status(200).json({ 
      message: 'Modul selesai.',
      data: {
        module_id: module.id,
        is_completed: true,
        created: created
      }
    });

  } catch (err) {
    console.error('[markModuleAsComplete] Error:', err.message);
    console.error('[markModuleAsComplete] Stack:', err.stack);
    return res.status(500).json({ 
      message: 'Server error.', 
      error: err.message 
    });
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

    // Step 1: Query enrollments (only course_id, no learning_path_id)
    const enrollments = await db.sequelize.query(
      `SELECT course_id
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

    const enrolledCourseIds = enrollments.map(e => e.course_id).filter(Boolean);
    console.log('Enrolled Course IDs:', enrolledCourseIds);

    if (enrolledCourseIds.length === 0) {
      console.log('No course IDs found, returning empty array');
      return res.status(200).json({ success: true, data: [] });
    }

    // Step 2: Query ebooks yang sudah di-download (exist in UserModuleProgress)
    // Simplified query - langsung dari enrolled courses
    const ebooks = await db.sequelize.query(
      `SELECT DISTINCT
        m.id, 
        m.title, 
        m.ebook_url,
        c.id as course_id,
        c.title as course_title,
        c.thumbnail_url as course_thumbnail,
        m.sequence_order
       FROM Modules m
       JOIN Courses c ON m.course_id = c.id
       JOIN UserModuleProgresses ump ON ump.module_id = m.id AND ump.user_id = :userId
       WHERE c.id IN (:courseIds)
       AND m.ebook_url IS NOT NULL
       AND ump.is_completed = 1
       ORDER BY c.id, m.sequence_order ASC`,
      {
        replacements: { userId, courseIds: enrolledCourseIds },
        type: db.Sequelize.QueryTypes.SELECT
      }
    );

    console.log('Downloaded ebooks found:', ebooks.length);
    console.log('Ebook details:', JSON.stringify(ebooks, null, 2));
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

/**
 * @function getMyCourses
 * @description Mengambil daftar semua Courses yang telah di-enroll user dengan progress
 * @route GET /api/v1/learn/my-courses
 */
const getMyCourses = async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('=== GET MY COURSES START ===');
    console.log('User ID:', userId);

    // Get all enrollments with Course data
    const enrollments = await UserEnrollment.findAll({
      where: { user_id: userId, status: 'success' },
      include: {
        model: Course,
        as: 'Course',
        attributes: ['id', 'title', 'description', 'thumbnail_url', 'price', 'mentor_name']
      },
      order: [['enrolled_at', 'DESC']]
    });

    console.log('Enrollments found:', enrollments.length);

    if (enrollments.length === 0) {
      return res.status(200).json([]);
    }

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.Course;
        if (!course) return null;

        // Count total modules in course
        const totalModules = await Module.count({ where: { course_id: course.id } });

        // Count completed modules by user
        const completedModules = await UserModuleProgress.count({
          where: { user_id: userId },
          include: {
            model: Module,
            as: 'module',
            required: true,
            where: { course_id: course.id }
          }
        });

        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url,
          price: course.price || 0,
          rating: 4.5, // Default rating
          review_count: 0,
          category: 'Kelas',
          level: 'Beginner',
          progress_percent: progressPercent,
          total_modules: totalModules,
          completed_modules: completedModules
        };
      })
    );

    // Filter out null values
    const result = coursesWithProgress.filter(Boolean);
    console.log('Courses with progress:', result.length);
    console.log('=== GET MY COURSES SUCCESS ===');

    return res.status(200).json(result);
  } catch (err) {
    console.error('=== GET MY COURSES ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message
    });
  }
};

/**
 * @function getCourseContent
 * @description Mengambil konten Course lengkap untuk halaman learn (course-based).
 * @route GET /api/v1/learn/courses/:course_id
 */
const getCourseContent = async (req, res) => {
  const userId = req.user.id;
  const { course_id } = req.params;

  try {
    // 1. Validasi: User harus sudah beli course ini
    const enrollment = await UserEnrollment.findOne({
      where: {
        user_id: userId,
        course_id: course_id,
        status: 'success'
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

    // 3. Ambil Data Course dari DB
    const course = await Course.findByPk(course_id, {
      attributes: ['id', 'title', 'description', 'thumbnail_url', 'mentor_name', 'mentor_title', 'mentor_photo_profile'],
      include: {
        model: Module,
        as: 'modules',
        attributes: ['id', 'title', 'sequence_order', 'video_url', 'ebook_url', 'quiz_id'],
        order: [['sequence_order', 'ASC']]
      }
    });

    if (!course) return res.status(404).json({ message: 'Course tidak ditemukan.' });

    // 4. FORMAT DATA JSON untuk kompatibilitas dengan frontend LearningPathData
    const courseData = course.toJSON();

    // Create mentor object
    const mentor = {
      name: courseData.mentor_name || 'Tim Lentera Karir',
      job_title: courseData.mentor_title || 'Expert Instructor',
      avatar_url: courseData.mentor_photo_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(courseData.mentor_name || 'Mentor')}&background=random`
    };

    // Transform modules
    const transformedModules = await Promise.all((courseData.modules || []).map(async module => {
      // Derive type from available fields
      let type = 'quiz';
      if (module.video_url) {
        type = 'video';
      } else if (module.ebook_url) {
        type = 'ebook';
      } else if (module.quiz_id) {
        type = 'quiz';
      }

      // For quiz modules, check if user has passed
      let is_passed = null;
      if (type === 'quiz' && module.quiz_id) {
        const quizAttempt = await db.UserQuizAttempt.findOne({
          where: { 
            user_id: userId, 
            quiz_id: module.quiz_id,
            status: 'completed'
          },
          include: { model: db.Quiz, attributes: ['pass_threshold'] },
          order: [['score', 'DESC']] // Get best attempt
        });
        
        if (quizAttempt) {
          is_passed = quizAttempt.score >= quizAttempt.Quiz.pass_threshold;
        }
      }

      return {
        module_id: module.id,
        title: module.title,
        sequence_order: module.sequence_order,
        type: type,
        video_url: module.video_url,
        ebook_url: module.ebook_url,
        quiz_id: module.quiz_id,
        duration: 0,
        is_completed: completedModuleIds.has(module.id),
        is_passed: is_passed, // null for non-quiz, true/false for quiz
        is_locked: false // Will be calculated below
      };
    }));

    // Sort modules by sequence_order
    transformedModules.sort((a, b) => a.sequence_order - b.sequence_order);

    // Progressive unlock logic: Lock modules that come after incomplete modules
    // Ebooks are ALWAYS unlocked (optional) and don't affect the unlock sequence
    // Only videos and quizzes participate in sequential unlocking
    for (let i = 0; i < transformedModules.length; i++) {
      const currentModule = transformedModules[i];
      
      // Ebooks are always unlocked - they're optional
      if (currentModule.type === 'ebook') {
        currentModule.is_locked = false;
        continue;
      }
      
      if (i === 0) {
        // First module is always unlocked
        currentModule.is_locked = false;
      } else {
        // Find the previous non-ebook module to check completion
        let previousNonEbookModule = null;
        for (let j = i - 1; j >= 0; j--) {
          if (transformedModules[j].type !== 'ebook') {
            previousNonEbookModule = transformedModules[j];
            break;
          }
        }
        
        // Lock if previous non-ebook module is not completed
        // If no previous non-ebook module exists, unlock this module
        if (previousNonEbookModule) {
          currentModule.is_locked = !previousNonEbookModule.is_completed;
        } else {
          currentModule.is_locked = false;
        }
      }
    }

    // Calculate completed count
    const completedCount = transformedModules.filter(m => m.is_completed).length;
    const isCompleted = transformedModules.length > 0 && completedCount === transformedModules.length;

    // Format response to match LearningPathData structure expected by frontend
    const response = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      thumbnail_url: courseData.thumbnail_url,
      mentor: mentor,
      courses: [{
        course_id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        sequence_order: 1,
        is_locked: false,
        is_completed: isCompleted,
        modules: transformedModules
      }]
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error('Error getCourseContent:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
  getMyEbooks,
  getMyCourses,
  getCourseContent,
};

