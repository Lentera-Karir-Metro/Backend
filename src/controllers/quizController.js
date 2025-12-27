// File: src/controllers/quizController.js
/**
 * @fileoverview Controller untuk mengelola CRUD (Create, Read, Update, Delete) Quiz Engine.
 * Meliputi Quiz (Master), Question, dan Option. Controller ini diakses khusus oleh Admin.
 */
const db = require('../../models');
const { Quiz, Question, Option } = db;
const { generateCustomId } = require('../utils/idGenerator');

// --- Controller untuk QUIZ (MASTER) ---

/**
 * @function createQuiz
 * @description Membuat entitas Quiz baru.
 * @route POST /api/v1/admin/quizzes
 *
 * @param {object} req - Objek request (body: { title, pass_threshold })
 * @param {object} res - Objek response
 * @returns {object} Quiz yang baru dibuat.
 */
const createQuiz = async (req, res) => {
  const { 
    title, 
    pass_threshold, 
    description, 
    duration_minutes, 
    max_attempts, 
    sequence_order, 
    course_id: bodyCourseId,
    questions // Array of questions with options
  } = req.body;
  
  const { course_id: paramCourseId } = req.params; // Ambil course_id dari URL jika ada

  // Prioritaskan course_id dari URL (params), jika tidak ada ambil dari Body
  const finalCourseId = paramCourseId || bodyCourseId || null;

  // Validate course exists if course_id is provided
  if (finalCourseId) {
    const Course = db.Course;
    const course = await Course.findByPk(finalCourseId);
    if (!course) {
      return res.status(404).json({ 
        message: 'Course tidak ditemukan.',
        courseId: finalCourseId
      });
    }
  }

  const transaction = await db.sequelize.transaction();

  try {
    // 1. Create Quiz Header
    const quiz = await Quiz.create({
      // ID (QZ-XXXXXX) otomatis dibuat oleh Hook di model Quiz
      title,
      pass_threshold: pass_threshold || 0.75,
      course_id: finalCourseId,
      description,
      duration_minutes: duration_minutes || 0,
      max_attempts: max_attempts !== undefined ? max_attempts : 0, // 0 = Unlimited
      sequence_order: sequence_order || 1
    }, { transaction });

    // 2. Process Nested Questions (if any)
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (const qData of questions) {
        const question = await Question.create({
          quiz_id: quiz.id,
          question_text: qData.question_text,
          question_type: qData.question_type || 'multiple_choice'
        }, { transaction });

        // 3. Process Nested Options (if any)
        if (qData.options && Array.isArray(qData.options) && qData.options.length > 0) {
          const optionsData = qData.options.map(opt => ({
            question_id: question.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct || false
          }));
          
          await Option.bulkCreate(optionsData, { transaction });
        }
      }
    }

    await transaction.commit();

    // Fetch full data to return
    const fullQuiz = await Quiz.findByPk(quiz.id, {
      include: {
        model: Question,
        as: 'questions',
        include: {
          model: Option,
          as: 'options'
        }
      }
    });

    return res.status(201).json(fullQuiz);
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating quiz:', err);
    return res.status(500).json({ 
      message: 'Server error saat membuat quiz.', 
      error: err.message,
      details: err.errors ? err.errors.map(e => e.message) : undefined
    });
  }
};

/**
 * @function getAllQuizzes
 * @description Mengambil daftar semua Quiz (hanya ID dan Title). Berguna untuk dropdown penautan Modul.
 * @route GET /api/v1/admin/quizzes
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 * @returns {object} Array Quiz.
 */
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      attributes: ['id', 'title'],
      order: [['title', 'ASC']],
    });
    return res.status(200).json(quizzes);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getQuizById
 * @description Mengambil detail lengkap 1 Quiz, termasuk semua Pertanyaan dan Opsi.
 * @route GET /api/v1/admin/quizzes/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Detail Quiz lengkap.
 */
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: {
        model: Question,
        as: 'questions',
        include: {
          model: Option,
          as: 'options',
          order: [['createdAt', 'ASC']],
        },
        order: [['createdAt', 'ASC']],
      },
    });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    return res.status(200).json(quiz);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateQuiz
 * @description Memperbarui data Quiz (Title atau Threshold).
 * @route PUT /api/v1/admin/quizzes/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, pass_threshold })
 * @param {object} res - Objek response
 * @returns {object} Quiz yang sudah diperbarui.
 */
const updateQuiz = async (req, res) => {
  const { title, pass_threshold } = req.body;
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    quiz.title = title || quiz.title;
    quiz.pass_threshold = pass_threshold || quiz.pass_threshold;
    await quiz.save();
    return res.status(200).json(quiz);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteQuiz
 * @description Menghapus Quiz berdasarkan ID.
 * @route DELETE /api/v1/admin/quizzes/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    await quiz.destroy();
    return res.status(200).json({ message: 'Quiz berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// --- Controller untuk QUESTION ---

/**
 * @function addQuestionToQuiz
 * @description Menambahkan Pertanyaan baru ke Quiz yang sudah ada.
 * @route POST /api/v1/admin/quizzes/:quiz_id/questions
 *
 * @param {object} req - Objek request (params: quiz_id, body: { question_text })
 * @param {object} res - Objek response
 * @returns {object} Question yang baru dibuat.
 */
const addQuestionToQuiz = async (req, res) => {
  const { quiz_id } = req.params;
  const { question_text } = req.body;
  try {
    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }

    // create: model Question akan generate id via beforeCreate hook
    const question = await Question.create({
      quiz_id: quiz_id,
      question_text,
    });

    return res.status(201).json(question);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateQuestion
 * @description Memperbarui teks Pertanyaan.
 * @route PUT /api/v1/admin/questions/:id
 *
 * @param {object} req - Objek request (params: id, body: { question_text })
 * @param {object} res - Objek response
 * @returns {object} Question yang sudah diperbarui.
 */
const updateQuestion = async (req, res) => {
  const { question_text } = req.body;
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
    }
    question.question_text = question_text || question.question_text;
    await question.save();
    return res.status(200).json(question);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteQuestion
 * @description Menghapus Pertanyaan.
 * @route DELETE /api/v1/admin/questions/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
    }
    await question.destroy();
    return res.status(200).json({ message: 'Pertanyaan berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// --- Controller untuk OPTION ---

/**
 * @function addOptionToQuestion
 * @description Menambahkan Opsi jawaban ke Pertanyaan.
 * @route POST /api/v1/admin/questions/:question_id/options
 *
 * @param {object} req - Objek request (params: question_id, body: { option_text, is_correct })
 * @param {object} res - Objek response
 * @returns {object} Option yang baru dibuat.
 */
const addOptionToQuestion = async (req, res) => {
  const { question_id } = req.params;
  const { option_text, is_correct } = req.body;
  try {
    const question = await Question.findByPk(question_id);
    if (!question) {
      return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
    }

    // create: model Option akan generate id via beforeCreate hook
    const option = await Option.create({
      question_id: question_id,
      option_text,
      is_correct: !!is_correct,
    });

    return res.status(201).json(option);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateOption
 * @description Memperbarui Opsi jawaban (teks atau status benar/salah).
 * @route PUT /api/v1/admin/options/:id
 *
 * @param {object} req - Objek request (params: id, body: { option_text, is_correct })
 * @param {object} res - Objek response
 * @returns {object} Option yang sudah diperbarui.
 */
const updateOption = async (req, res) => {
  const { option_text, is_correct } = req.body;
  try {
    const option = await Option.findByPk(req.params.id);
    if (!option) {
      return res.status(404).json({ message: 'Opsi tidak ditemukan.' });
    }
    option.option_text = option_text || option.option_text;
    option.is_correct = is_correct !== undefined ? is_correct : option.is_correct; 
    await option.save();
    return res.status(200).json(option);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteOption
 * @description Menghapus Opsi jawaban.
 * @route DELETE /api/v1/admin/options/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteOption = async (req, res) => {
  try {
    const option = await Option.findByPk(req.params.id);
    if (!option) {
      return res.status(404).json({ message: 'Opsi tidak ditemukan.' });
    }
    await option.destroy();
    return res.status(200).json({ message: 'Opsi berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
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
};
