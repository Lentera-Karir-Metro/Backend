// File: src/routes/quizRoutes.js
/**
 * @fileoverview Definisi rute untuk manajemen CRUD Quiz Engine (Quiz, Question, Option).
 * Semua rute dalam file ini dilindungi dan hanya dapat diakses oleh Admin.
 * Rute diakses dengan prefix /api/v1/admin.
 */
const express = require('express');
const router = express.Router();

// Impor controller yang menangani logika CRUD Kuis (total 11 fungsi)
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestionToQuiz,
  updateQuestion,
  deleteQuestion,
  addOptionToQuestion,
  updateOption,
  deleteOption,
} = require('../controllers/quizController');

// Impor middleware otorisasi
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// --- Pemasangan Middleware Global ---
/**
 * Lindungi SEMUA rute yang didefinisikan di bawah ini.
 * Setiap request HARUS memiliki token yang valid (protect) 
 * dan role-nya harus 'admin' (isAdmin).
 */
router.use(protect);
router.use(isAdmin);

// --- Rute untuk QUIZ (MASTER) ---

/**
 * @route /courses/:course_id/quizzes
 * @description Membuat Quiz baru di dalam Course tertentu.
 */
router.post('/courses/:course_id/quizzes', createQuiz);

/**
 * @route /quizzes
 * @description Rute untuk membuat dan mengambil daftar semua Quiz.
 */
router.route('/quizzes')
  .post(createQuiz)    // POST /api/v1/admin/quizzes (Create Quiz)
  .get(getAllQuizzes); // GET /api/v1/admin/quizzes (Read All Quiz)

/**
 * @route /quizzes/:id
 * @description Rute untuk operasi spesifik 1 Quiz.
 */
router.route('/quizzes/:id')
  .get(getQuizById)    // GET /api/v1/admin/quizzes/:id (Read One & Full Structure)
  .put(updateQuiz)     // PUT /api/v1/admin/quizzes/:id (Update)
  .delete(deleteQuiz);  // DELETE /api/v1/admin/quizzes/:id (Delete)

// --- Rute untuk QUESTION ---

/**
 * @method POST
 * @route /quizzes/:quiz_id/questions
 * @description Menambahkan Pertanyaan baru ke Quiz tertentu.
 */
router.post('/quizzes/:quiz_id/questions', addQuestionToQuiz);

/**
 * @route /questions/:id
 * @description Rute untuk operasi spesifik 1 Pertanyaan.
 */
router.route('/questions/:id')
  .put(updateQuestion)   // PUT /api/v1/admin/questions/:id (Update)
  .delete(deleteQuestion); // DELETE /api/v1/admin/questions/:id (Delete)

// --- Rute untuk OPTION ---

/**
 * @method POST
 * @route /questions/:question_id/options
 * @description Menambahkan Opsi jawaban baru ke Pertanyaan tertentu.
 */
router.post('/questions/:question_id/options', addOptionToQuestion);

/**
 * @route /options/:id
 * @description Rute untuk operasi spesifik 1 Opsi jawaban.
 */
router.route('/options/:id')
  .put(updateOption)   // PUT /api/v1/admin/options/:id (Update Teks atau is_correct)
  .delete(deleteOption); // DELETE /api/v1/admin/options/:id (Delete)

module.exports = router;