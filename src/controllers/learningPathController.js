// File: src/controllers/learningPathController.js
const db = require('../../models');
const LearningPath = db.LearningPath;
const Course = db.Course; 
const Module = db.Module; 

const createLearningPath = async (req, res) => {
  // Admin input rating & review_count manual di sini
  const { title, description, price, thumbnail_url, rating, review_count, category, discount_amount, level, mentor_name, mentor_title, mentor_avatar_url } = req.body;

  if (!title || !price) {
    return res.status(400).json({ message: 'Title dan Price wajib diisi.' });
  }

  try {
    const newLearningPath = await LearningPath.create({
      title,
      description: description || null,
      price: parseFloat(price),
      thumbnail_url: thumbnail_url || null,
      discount_amount: parseFloat(discount_amount) || 0,
      rating: parseFloat(rating) || 0.0, 
      review_count: parseInt(review_count) || 0,
      category: category || "General",
      level: level || "Beginner",
      mentor_name, mentor_title, mentor_avatar_url
    });
    return res.status(201).json(newLearningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getAllLearningPaths = async (req, res) => {
  try {
    const learningPaths = await LearningPath.findAll({
      order: [['createdAt', 'DESC']], 
    });
    return res.status(200).json(learningPaths);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getLearningPathById = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      include: {
        model: Course,
        as: 'courses',
        include: {
          model: db.Module,
          as: 'modules',
        },
      },
      order: [
        [{ model: Course, as: 'courses' }, 'sequence_order', 'ASC'],
        [{ model: Course, as: 'courses' }, { model: db.Module, as: 'modules' }, 'sequence_order', 'ASC']
      ]
    });

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const updateLearningPath = async (req, res) => {
  const { title, description, price, thumbnail_url, rating, review_count, category, discount_amount } = req.body;
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    learningPath.title = title || learningPath.title;
    learningPath.description = description || learningPath.description;
    learningPath.price = price !== undefined ? parseFloat(price) : learningPath.price; 
    learningPath.thumbnail_url = thumbnail_url || learningPath.thumbnail_url;
    
    // Update jika ada input baru
    if (rating !== undefined) learningPath.rating = parseFloat(rating);
    if (review_count !== undefined) learningPath.review_count = parseInt(review_count);
    if (category) learningPath.category = category;
    // Update diskon
    if (discount_amount !== undefined) learningPath.discount_amount = parseFloat(discount_amount);

    await learningPath.save();
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const deleteLearningPath = async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    await learningPath.destroy(); 
    return res.status(200).json({ message: 'Learning Path berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createLearningPath,
  getAllLearningPaths,
  getLearningPathById,
  updateLearningPath,
  deleteLearningPath,
};