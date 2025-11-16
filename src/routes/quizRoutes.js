// File: src/routes/quizRoutes.js
const express = require('express');
const router = express.Router();

// Impor controller
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

// Impor middleware
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// Lindungi semua rute di file ini dengan middleware admin
router.use(protect);
router.use(isAdmin);

// --- Rute untuk QUIZ ---
// /api/v1/admin/quizzes
router.route('/quizzes')
  .post(createQuiz)
  .get(getAllQuizzes);

// /api/v1/admin/quizzes/:id
router.route('/quizzes/:id')
  .get(getQuizById)
  .put(updateQuiz)
  .delete(deleteQuiz);

// --- Rute untuk QUESTION ---
// /api/v1/admin/quizzes/:quiz_id/questions
router.post('/quizzes/:quiz_id/questions', addQuestionToQuiz);

// /api/v1/admin/questions/:id
router.route('/questions/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

// --- Rute untuk OPTION ---
// /api/v1/admin/questions/:question_id/options
router.post('/questions/:question_id/options', addOptionToQuestion);

// /api/v1/admin/options/:id
router.route('/options/:id')
  .put(updateOption)
  .delete(deleteOption);

module.exports = router;