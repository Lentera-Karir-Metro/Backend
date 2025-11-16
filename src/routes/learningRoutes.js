// File: src/routes/learningRoutes.js
const express = require('express');
const router = express.Router();
const {
  getMyDashboard,
  getLearningPathContent,
  markModuleAsComplete,
} = require('../controllers/learningController');

const {
  startOrResumeQuiz,
  savePartialAnswer,
  submitQuiz
} = require('../controllers/quizLearningController');

// Impor middleware 'protect'
const { protect } = require('../middlewares/authMiddleware');

// Semua rute di sini wajib login
router.use(protect);

// /api/v1/learn/dashboard
router.get('/learn/dashboard', getMyDashboard);

// /api/v1/learn/learning-paths/:lp_id
router.get('/learn/learning-paths/:lp_id', getLearningPathContent);

// /api/v1/learn/modules/:module_id/complete
router.post('/learn/modules/:module_id/complete', markModuleAsComplete);

// /api/v1/learn/quiz/:quiz_id/start
router.post('/learn/quiz/:quiz_id/start', startOrResumeQuiz);

// /api/v1/learn/attempts/:attempt_id/answer
router.post('/learn/attempts/:attempt_id/answer', savePartialAnswer);

// /api/v1/learn/attempts/:attempt_id/submit
router.post('/learn/attempts/:attempt_id/submit', submitQuiz);

module.exports = router;