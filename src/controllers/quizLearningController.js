// File: src/controllers/quizLearningController.js
const db = require('../../models');
const { 
  Quiz, 
  Question, 
  Option, 
  UserQuizAttempt, 
  UserQuizAnswer,
  Module,
  UserEnrollment
} = db;
const { Op } = require('sequelize');

// Helper untuk validasi akses kuis
const validateQuizAccess = async (userId, quizId) => {
  const module = await Module.findOne({ 
    where: { quiz_id: quizId },
    include: { model: db.Course, attributes: ['learning_path_id'] }
  });

  if (!module) {
    return { error: 'Kuis tidak terkait dengan modul manapun.', status: 404 };
  }

  const enrollment = await UserEnrollment.findOne({
    where: {
      user_id: userId,
      learning_path_id: module.Course.learning_path_id,
      status: 'success'
    }
  });

  if (!enrollment) {
    return { error: 'Akses ditolak. Anda tidak terdaftar di learning path kuis ini.', status: 403 };
  }

  // (Kita bisa tambahkan validasi penguncian modul/course di sini jika perlu)

  return { error: null, status: 200 };
};


// @desc    Memulai atau melanjutkan kuis
// @route   POST /api/v1/learn/quiz/:quiz_id/start
const startOrResumeQuiz = async (req, res) => {
  const userId = req.user.id;
  const { quiz_id } = req.params;

  try {
    // 1. Validasi apakah user boleh akses kuis ini
    const access = await validateQuizAccess(userId, quiz_id);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    // 2. Cari sesi kuis yg 'in_progress' (fitur resume)
    let attempt = await UserQuizAttempt.findOne({
      where: {
        user_id: userId,
        quiz_id: quiz_id,
        status: 'in_progress'
      }
    });

    // 3. Jika tidak ada, buat sesi baru (termasuk untuk retake)
    if (!attempt) {
      attempt = await UserQuizAttempt.create({
        user_id: userId,
        quiz_id: quiz_id,
        status: 'in_progress'
      });
    }

    // 4. Ambil semua soal dan opsi (kirim semua sekaligus)
    const quizData = await Quiz.findByPk(quiz_id, {
      attributes: ['id', 'title'],
      include: {
        model: Question,
        as: 'questions',
        attributes: ['id', 'question_text'],
        include: {
          model: Option,
          as: 'options',
          attributes: ['id', 'option_text'], // JANGAN sertakan 'is_correct'
        },
        order: [['createdAt', 'ASC']]
      }
    });

    // 5. Ambil jawaban parsial yg sudah tersimpan
    const answers = await UserQuizAnswer.findAll({
      where: { user_quiz_attempt_id: attempt.id },
      attributes: ['question_id', 'selected_option_id']
    });

    // Format jawaban agar mudah dibaca frontend (e.g., { "question_id": "option_id" })
    const partialAnswers = answers.reduce((acc, ans) => {
      acc[ans.question_id] = ans.selected_option_id;
      return acc;
    }, {});

    return res.status(200).json({
      attempt_id: attempt.id,
      quiz: quizData,
      partial_answers: partialAnswers
    });

  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Menyimpan jawaban parsial (Fitur Resume)
// @route   POST /api/v1/learn/attempts/:attempt_id/answer
const savePartialAnswer = async (req, res) => {
  const userId = req.user.id;
  const { attempt_id } = req.params;
  const { question_id, selected_option_id } = req.body;

  if (!question_id || !selected_option_id) {
    return res.status(400).json({ message: 'question_id dan selected_option_id wajib diisi.' });
  }

  try {
    // 1. Validasi attempt
    const attempt = await UserQuizAttempt.findByPk(attempt_id);
    if (!attempt) {
      return res.status(404).json({ message: 'Sesi kuis tidak ditemukan.' });
    }
    if (attempt.user_id !== userId || attempt.status !== 'in_progress') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // 2. Simpan atau Update jawaban (Upsert)
    await UserQuizAnswer.upsert({
      user_quiz_attempt_id: attempt_id,
      question_id: question_id,
      selected_option_id: selected_option_id
    });

    return res.status(200).json({ message: 'Jawaban berhasil disimpan.' });

  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Submit kuis untuk penilaian
// @route   POST /api/v1/learn/attempts/:attempt_id/submit
const submitQuiz = async (req, res) => {
  const userId = req.user.id;
  const { attempt_id } = req.params;

  try {
    // 1. Validasi attempt
    const attempt = await UserQuizAttempt.findOne({
      where: { id: attempt_id, user_id: userId, status: 'in_progress' },
      include: { model: Quiz } // Ambil data kuis-nya
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Sesi kuis tidak ditemukan atau sudah disubmit.' });
    }

    // 2. Ambil semua jawaban user untuk sesi ini
    const userAnswers = await UserQuizAnswer.findAll({
      where: { user_quiz_attempt_id: attempt.id }
    });

    // 3. Ambil semua jawaban yg benar dari database
    const correctAnswers = await Option.findAll({
      where: { is_correct: true },
      include: {
        model: Question,
        attributes: ['id'],
        where: { quiz_id: attempt.quiz_id }
      }
    });

    // Buat Peta (Map) jawaban benar agar mudah dicek
    // { question_id: correct_option_id }
    const correctMap = correctAnswers.reduce((acc, ans) => {
      acc[ans.question_id] = ans.id;
      return acc;
    }, {});

    const totalQuestions = Object.keys(correctMap).length;

    // 4. Hitung skor
    let correctCount = 0;
    for (const answer of userAnswers) {
      if (correctMap[answer.question_id] === answer.selected_option_id) {
        correctCount++;
      }
    }

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) : 0;
    const passThreshold = attempt.Quiz.pass_threshold;
    const isPassed = score >= passThreshold;

    // 5. Update status attempt di database
    attempt.status = 'completed';
    attempt.score = score;
    attempt.completed_at = new Date();
    await attempt.save();

    // (Opsional: Jika lulus kuis, otomatis tandai modul kuis selesai)
    if (isPassed) {
      const module = await Module.findOne({ where: { quiz_id: attempt.quiz_id }});
      if (module) {
        await db.UserModuleProgress.findOrCreate({
          where: { user_id: userId, module_id: module.id }
        });
      }
    }

    // 6. Kirim hasil
    return res.status(200).json({
      message: 'Kuis berhasil disubmit.',
      score: score,
      total_questions: totalQuestions,
      correct_count: correctCount,
      is_passed: isPassed,
      pass_threshold: passThreshold
    });

  } catch (err) { 
    return res.status(500).json({ message: 'Server error.', error: err.message }); 
    } 
};

module.exports = {
      startOrResumeQuiz,
      savePartialAnswer,
      submitQuiz
    };