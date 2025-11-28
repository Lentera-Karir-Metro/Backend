// File: src/controllers/learningController.js
/**
 * @fileoverview Controller "Palugada" untuk Ruang Belajar.
 * Menyediakan data super lengkap (termasuk URL konten & data dummy UI)
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

// Menggunakan operator dari Sequelize
const Op = Sequelize.Op;

/**
 * @function getMyDashboard
 * @description Mengambil daftar semua Learning Path milik user.
 * Termasuk data dummy (progress, rating) untuk kebutuhan tampilan Card UI.
 * @route GET /api/v1/learn/dashboard
 */
const getMyDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    const enrollments = await UserEnrollment.findAll({
      where: { user_id: userId, status: 'success' },
      include: {
        model: LearningPath,
        attributes: ['id', 'title', 'description', 'thumbnail_url', 'price']
      },
      order: [['enrolled_at', 'DESC']]
    });

    // Transformasi data: Inject data tambahan agar dashboard terlihat penuh sesuai desain
    const learningPaths = enrollments.map(en => {
        const lp = en.LearningPath.toJSON();
        
        // Data Dummy untuk UI Dashboard
        lp.progress_percent = 0; // Nanti bisa dikembangkan logic hitung persen asli
        lp.category = "Technology"; 
        lp.rating = 4.8; 
        lp.total_modules = 12; // Angka dummy
        
        return lp;
    });

    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getLearningPathContent
 * @description API Utama Ruang Belajar. 
 * Mengirim struktur materi + URL Konten (Video/PDF) + Status Lock + Data UI (Mentor).
 * @route GET /api/v1/learn/learning-paths/:lp_id
 */
const getLearningPathContent = async (req, res) => {
  const userId = req.user.id;
  const { lp_id } = req.params;

  try {
    // 1. Validasi: User harus sudah beli (Enrollment Success)
    const enrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: lp_id, status: 'success' }
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Akses ditolak. Anda belum terdaftar di kelas ini.' });
    }

    // 2. Ambil progress user (modul apa saja yang sudah selesai)
    const completedProgress = await UserModuleProgress.findAll({
      where: { user_id: userId },
      attributes: ['module_id']
    });
    const completedModuleIds = new Set(completedProgress.map(p => p.module_id));

    // 3. Ambil Data Lengkap (TERMASUK VIDEO_URL & EBOOK_URL)
    // Kita TIDAK melakukan exclude agar Frontend bisa memutar kontennya.
    const learningPath = await LearningPath.findByPk(lp_id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: Module,
          as: 'modules',
          // attributes: [] <-- Dikosongkan agar semua kolom (termasuk url) terambil
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });
    
    if (!learningPath) return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });

    // 4. MODIFIKASI JSON (Inject Data UI & Hitung Logika Lock)
    const lpData = learningPath.toJSON();

    // --- INJECT DATA DUMMY (Agar sesuai Desain UI Frontend) ---
    // Karena database kita belum punya tabel Mentor/Rating, kita hardcode sementara.
    lpData.mentor = {
        name: "Ayu Putri",
        job_title: "Co-Founder @bijaktechno, Lecturer",
        avatar_url: "https://ui-avatars.com/api/?name=Ayu+Putri&background=random" // Gambar placeholder
    };
    lpData.rating = 4.8;
    lpData.total_students = 256;
    lpData.category = "Digital Marketing";
    lpData.level = "Beginner";
    // ---------------------------------------------------------

    // 5. LOGIKA PENGUNCIAN (Lock System)
    let isPreviousCourseCompleted = true; 

    for (const course of lpData.courses) {
      let totalModules = course.modules.length;
      let completedModules = 0;
      let isPreviousModuleCompleted = true; 

      // Status Lock Course (Bab)
      course.is_locked = !isPreviousCourseCompleted;

      for (const module of course.modules) {
        // Cek apakah modul ini sudah selesai
        module.is_completed = completedModuleIds.has(module.id);
        if (module.is_completed) completedModules++;
        
        // Cek apakah modul ini terkunci
        // Syarat Terbuka: (Bab tidak terkunci) DAN (Modul sebelumnya sudah selesai ATAU ini modul pertama)
        module.is_locked = course.is_locked || !isPreviousModuleCompleted; 
        
        // Siapkan status untuk iterasi berikutnya
        isPreviousModuleCompleted = module.is_completed;
      }
      
      // Cek apakah satu bab sudah selesai semua
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
 * @description Menandai modul sebagai selesai. Membuka kunci modul berikutnya.
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

    // 3. Validasi Urutan (Anti-Cheat Sederhana)
    // Cek apakah modul sebelumnya sudah selesai
    if (module.sequence_order > 1) {
      const prevModule = await Module.findOne({
        where: { course_id: module.course_id, sequence_order: module.sequence_order - 1 }
      });
      if (prevModule) {
        const prevProgress = await UserModuleProgress.findOne({
          where: { user_id: userId, module_id: prevModule.id }
        });
        if (!prevProgress) return res.status(403).json({ message: 'Modul sebelumnya belum selesai. Harap kerjakan berurutan.' });
      }
    }

    // 4. Simpan Progress
    const [progress, created] = await UserModuleProgress.findOrCreate({
      where: { user_id: userId, module_id: module.id },
      defaults: { is_completed: true }
    });
    
    return res.status(200).json({ message: 'Modul berhasil diselesaikan.' });

  } catch (err) {
    console.error('Error saat update progress:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
};