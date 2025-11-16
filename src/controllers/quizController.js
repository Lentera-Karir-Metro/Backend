// File: src/controllers/quizController.js
const db = require('../../models');
const { Quiz, Question, Option, Module } = db;

// --- Controller untuk QUIZ ---

const createQuiz = async (req, res) => {
  const { title, pass_threshold } = req.body;
  try {
    const quiz = await Quiz.create({
      title,
      pass_threshold: pass_threshold || 0.75,
    });
    // Setelah Quiz dibuat, Admin bisa menautkannya ke Module
    // via endpoint updateModule (Langkah 22)
    return res.status(201).json(quiz);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getAllQuizzes = async (req, res) => {
  try {
    // Ambil daftar quiz (berguna untuk dropdown di frontend admin)
    const quizzes = await Quiz.findAll({
      attributes: ['id', 'title'],
      order: [['title', 'ASC']],
    });
    return res.status(200).json(quizzes);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getQuizById = async (req, res) => {
  try {
    // Ambil detail lengkap kuis, termasuk pertanyaan dan opsinya
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

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    // (Relasi di Module otomatis SET NULL karena definisi migrasi kita)
    await quiz.destroy();
    return res.status(200).json({ message: 'Quiz berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// --- Controller untuk QUESTION ---

const addQuestionToQuiz = async (req, res) => {
  const { quiz_id } = req.params;
  const { question_text } = req.body;
  try {
    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    const question = await Question.create({
      quiz_id: quiz_id,
      question_text,
    });
    return res.status(201).json(question);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

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
  } catch (err){
     return res.status(500).json({ message: 'Server error.', error: err.message });
} };
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

    const addOptionToQuestion = async (req, res) => {
      const { question_id } = req.params;
      const { option_text, is_correct } = req.body;
      try {
        const question = await Question.findByPk(question_id);
        if (!question) {
          return res.status(404).json({ message: 'Pertanyaan tidak ditemukan.' });
        }
        const option = await Option.create({
          question_id: question_id,
          option_text,
          is_correct: is_correct || false,
        });
        return res.status(201).json(option);
      } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
      }
    };

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