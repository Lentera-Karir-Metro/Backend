// File: src/controllers/quizLearningController.js
/**
 * @fileoverview Controller untuk mengelola fungsionalitas pengerjaan kuis bagi pengguna (User).
 * Meliputi memulai sesi, menyimpan jawaban parsial (resume), dan penilaian (grading).
 */
const db = require('../../models');
const { 
  Quiz, 
  Question, 
  Option, 
  UserQuizAttempt, 
  UserQuizAnswer,
  Module,
  Course,
  UserEnrollment
} = db;
const { Op } = require('sequelize');

/**
 * @function validateQuizAccess
 * @description Helper untuk memverifikasi apakah user terdaftar di Learning Path yang terkait dengan kuis.
 * @param {string} userId - ID kustom user (LT-XXXXXX)
 * @param {string} quizId - ID kustom kuis (QZ-XXXXXX)
 * @returns {Promise<object>} { error: string | null, status: number }
 */
const validateQuizAccess = async (userId, quizId) => {
  // Cari modul yang terkait dengan kuis ini
  const module = await Module.findOne({ 
    where: { quiz_id: quizId },
    include: { model: Course, as: 'course', attributes: ['learning_path_id'] }
  });

  if (!module) {
    return { error: 'Kuis tidak terkait dengan modul manapun.', status: 404 };
  }

  // Cek apakah user terdaftar (enrollment sukses) di Learning Path terkait
  const enrollment = await UserEnrollment.findOne({
    where: {
      user_id: userId,
      learning_path_id: module.course.learning_path_id,
      status: 'success'
    }
  });

  if (!enrollment) {
    return { error: 'Akses ditolak. Anda tidak terdaftar di learning path kuis ini.', status: 403 };
  }

  // (Validasi penguncian (lock) konten dilakukan di controller learningController, 
  // tapi validasi enrollment di sini adalah layer keamanan kedua).

  return { error: null, status: 200 };
};


/**
 * @function startOrResumeQuiz
 * @description Mencari sesi kuis yang sedang berjalan (resume) atau membuat sesi baru (retake).
 * @route POST /api/v1/learn/quiz/:quiz_id/start
 *
 * @param {object} req - Objek request (params: quiz_id)
 * @param {object} res - Objek response
 * @returns {object} Detail kuis, attempt_id, dan jawaban parsial yang tersimpan.
 */
const startOrResumeQuiz = async (req, res) => {
  const userId = req.user.id;
  const { quiz_id } = req.params;

  try {
    // 1. Validasi akses
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

    // 3. Jika tidak ada, buat sesi baru (termasuk untuk retake tanpa batas)
    if (!attempt) {
      attempt = await UserQuizAttempt.create({
        user_id: userId,
        quiz_id: quiz_id,
        status: 'in_progress'
      });
    }

    // 4. Ambil semua soal dan opsi (kirim semua sekaligus)
    // PENTING: attribute is_correct JANGAN disertakan di sini
    const quizData = await Quiz.findByPk(quiz_id, {
      attributes: ['id', 'title', 'pass_threshold'],
      include: {
        model: Question,
        as: 'questions',
        attributes: ['id', 'question_text'],
        include: {
          model: Option,
          as: 'options',
          attributes: ['id', 'option_text'], // Secure: sembunyikan is_correct
        },
        order: [['createdAt', 'ASC']]
      }
    });

    // 5. Ambil jawaban parsial yg sudah tersimpan
    const answers = await UserQuizAnswer.findAll({
      where: { user_quiz_attempt_id: attempt.id },
      attributes: ['question_id', 'selected_option_id']
    });

    // 6. Format jawaban agar mudah dibaca frontend
    const partialAnswers = answers.reduce((acc, ans) => {
      acc[ans.question_id] = ans.selected_option_id;
      return acc;
    }, {});

    // 7. Cek best score dari attempts sebelumnya yang sudah completed
    const bestAttempt = await UserQuizAttempt.findOne({
      where: {
        user_id: userId,
        quiz_id: quiz_id,
        status: 'completed'
      },
      order: [['score', 'DESC']], // Urutkan dari score tertinggi
      attributes: ['score', 'completed_at']
    });

    return res.status(200).json({
      attempt_id: attempt.id,
      quiz: quizData,
      partial_answers: partialAnswers, // Data jawaban tersimpan (resume)
      best_score: bestAttempt ? bestAttempt.score : null,
      best_score_date: bestAttempt ? bestAttempt.completed_at : null,
      has_passed: bestAttempt && bestAttempt.score >= quizData.pass_threshold
    });

  } catch (err) {
    console.error('[Quiz Start Error]', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function savePartialAnswer
 * @description Menyimpan jawaban parsial pengguna ke database.
 * Dipanggil saat user klik "Selanjutnya" atau "Sebelumnya" (fitur Resume).
 * @route POST /api/v1/learn/attempts/:attempt_id/answer
 *
 * @param {object} req - Objek request (params: attempt_id, body: { question_id, selected_option_id })
 * @param {object} res - Objek response
 * @returns {object} Status penyimpanan.
 */
const savePartialAnswer = async (req, res) => {
  const userId = req.user.id;
  const { attempt_id } = req.params;
  const { question_id, selected_option_id } = req.body;

  if (!question_id || !selected_option_id) {
    return res.status(400).json({ message: 'question_id dan selected_option_id wajib diisi.' });
  }

  try {
    // 1. Validasi attempt (hanya bisa diubah oleh pemilik dan harus 'in_progress')
    const attempt = await UserQuizAttempt.findByPk(attempt_id);
    if (!attempt || attempt.user_id !== userId || attempt.status !== 'in_progress') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // 2. Simpan atau Update jawaban (Upsert)
    // Jawaban lama untuk pertanyaan yang sama akan ditimpa
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

/**
 * @function submitQuiz
 * @description Menilai kuis, menghitung skor, dan memperbarui status UserQuizAttempt.
 * @route POST /api/v1/learn/attempts/:attempt_id/submit
 *
 * @param {object} req - Objek request (params: attempt_id)
 * @param {object} res - Objek response
 * @returns {object} Hasil penilaian (score, is_passed).
 */
const submitQuiz = async (req, res) => {
  const userId = req.user.id;
  const { attempt_id } = req.params;

  try {
    // 1. Validasi attempt (harus 'in_progress')
    const attempt = await UserQuizAttempt.findOne({
      where: { id: attempt_id, user_id: userId, status: 'in_progress' },
      include: { model: Quiz } // Ambil data kuis-nya (untuk pass_threshold)
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Sesi kuis tidak ditemukan atau sudah disubmit.' });
    }

    // 2. Ambil semua jawaban user & semua jawaban benar dari database
    const userAnswers = await UserQuizAnswer.findAll({
      where: { user_quiz_attempt_id: attempt.id }
    });

    const correctOptions = await Option.findAll({
      where: { is_correct: true },
      include: {
        model: Question,
        as: 'question',
        attributes: ['id'],
        where: { quiz_id: attempt.quiz_id }
      }
    });

    // 3. Buat Peta (Map) jawaban benar untuk proses penilaian cepat
    const correctMap = correctOptions.reduce((acc, opt) => {
      acc[opt.question_id] = opt.id;
      return acc;
    }, {});

    const totalQuestions = Object.keys(correctMap).length;

    // 4. Hitung skor
    let correctCount = 0;
    for (const answer of userAnswers) {
      // Cek apakah option_id yang dipilih user sama dengan option_id yang benar
      if (correctMap[answer.question_id] === answer.selected_option_id) {
        correctCount++;
      }
    }

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) : 0;
    const passThreshold = attempt.Quiz.pass_threshold;
    const isPassed = score >= passThreshold; //

    // 5. Update status attempt di database
    attempt.status = 'completed';
    attempt.score = score;
    attempt.completed_at = new Date();
    await attempt.save();

    // 6. Jika lulus kuis (atau pernah lulus sebelumnya), tandai modul kuis selesai (Progres)
    const module = await Module.findOne({ where: { quiz_id: attempt.quiz_id }});
    if (module) {
      // Cek apakah pernah lulus (termasuk attempt yang sekarang)
      const hasEverPassed = await UserQuizAttempt.findOne({
        where: {
          user_id: userId,
          quiz_id: attempt.quiz_id,
          status: 'completed',
          score: { [Op.gte]: passThreshold }
        }
      });

      if (hasEverPassed) {
        // Buat record di UserModuleProgress jika belum ada
        await db.UserModuleProgress.findOrCreate({
          where: { user_id: userId, module_id: module.id }
        });
      }
    }

    // 7. Cek apakah ini score terbaik
    const allCompletedAttempts = await UserQuizAttempt.findAll({
      where: {
        user_id: userId,
        quiz_id: attempt.quiz_id,
        status: 'completed'
      },
      order: [['score', 'DESC']]
    });

    const isNewBest = allCompletedAttempts.length > 0 && allCompletedAttempts[0].id === attempt.id;

    // 8. Kirim hasil
    return res.status(200).json({
      message: 'Kuis berhasil disubmit.',
      score: score,
      total_questions: totalQuestions,
      correct_count: correctCount,
      is_passed: isPassed,
      pass_threshold: passThreshold,
      is_new_best: isNewBest,
      best_score: allCompletedAttempts.length > 0 ? allCompletedAttempts[0].score : score
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