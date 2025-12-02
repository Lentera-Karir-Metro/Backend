// File: src/routes/learningRoutes.js
/**
 * @fileoverview Definisi rute untuk fungsionalitas Belajar (Learning Experience) pengguna.
 * Meliputi progres, penguncian konten, dan pengerjaan kuis.
 * Semua rute dalam file ini wajib login.
 * Rute diakses dengan prefix /api/v1.
 */
const express = require('express');
const router = express.Router();

// Impor controller untuk Progres, Dashboard, dan Penguncian
const {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
  getMyEbooks,
} = require('../controllers/learningController');

// Impor controller untuk Logika Kuis (Start, Save, Submit)
const {
  startOrResumeQuiz,
  savePartialAnswer,
  submitQuiz
} = require('../controllers/quizLearningController');

// Impor middleware otentikasi
const { protect } = require('../middlewares/authMiddleware');

// --- Pemasangan Middleware Global ---
/**
 * Lindungi SEMUA rute di file ini.
 * User wajib login untuk mengakses fitur belajar.
 */
router.use(protect);

// --- Rute Belajar & Progres ---

/**
 * @method GET
 * @route /learn/dashboard
 * @description Mengambil daftar Learning Path yang sudah dibeli/di-enroll oleh user.
 */
router.get('/learn/dashboard', getMyDashboard);

/**
 * @method GET
 * @route /learn/ebooks
 * @description Mengambil semua ebook yang dimiliki user dari course yang telah dibeli.
 */
router.get('/learn/ebooks', getMyEbooks);

/**
 * @method GET
 * @route /learn/learning-paths/:lp_id
 * @description Mengambil konten Learning Path secara lengkap, disertai status progres dan penguncian.
 */
router.get('/learn/learning-paths/:lp_id', getLearningPathContent);

/**
 * @method POST
 * @route /learn/modules/:module_id/complete
 * @description Menandai modul sebagai selesai di database (Tombol "Tandai Selesai").
 */
router.post('/learn/modules/:module_id/complete', markModuleAsComplete);

// --- Rute Kuis (Quiz) ---

/**
 * @method POST
 * @route /learn/quiz/:quiz_id/start
 * @description Memulai sesi kuis baru atau melanjutkan sesi yang sedang berjalan (Resume).
 */
router.post('/learn/quiz/:quiz_id/start', startOrResumeQuiz);

/**
 * @method POST
 * @route /learn/attempts/:attempt_id/answer
 * @description Menyimpan jawaban parsial (setiap kali user menekan Next/Previous).
 */
router.post('/learn/attempts/:attempt_id/answer', savePartialAnswer);

/**
 * @method POST
 * @route /learn/attempts/:attempt_id/submit
 * @description Menyubmit kuis dan memicu penilaian (grading) di backend.
 */
router.post('/learn/attempts/:attempt_id/submit', submitQuiz);

module.exports = router;