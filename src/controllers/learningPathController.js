// File: src/controllers/learningPathController.js
const db = require('../../models');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/uploadToSupabase');
const LearningPath = db.LearningPath;
const Course = db.Course;
const Module = db.Module;
const LearningPathCourse = db.LearningPathCourse;

const createLearningPath = async (req, res) => {
  // Sekarang: LearningPath wajib punya minimal 1 course
  const { title, description, course_ids } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title wajib diisi.' });
  }
  // course_ids bisa array atau string (form-data)
  let courseIds = course_ids;
  if (typeof courseIds === 'string') {
    try { courseIds = JSON.parse(courseIds); } catch (e) { courseIds = []; }
  }
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return res.status(400).json({ message: 'Learning path wajib memiliki minimal 1 course.' });
  }

  const t = await db.sequelize.transaction();
  try {
    // Handle thumbnail upload jika ada
    let thumbnailUrl = null;
    if (req.file) {
      thumbnailUrl = await uploadToSupabase(req.file, 'thumbnails', 'learning-paths');
    }

    // Buat learning path
    const newLearningPath = await LearningPath.create({
      title,
      description: description || null,
      thumbnail: thumbnailUrl,
    }, { transaction: t });

    // Validasi semua course_id
    const courses = await Course.findAll({ where: { id: courseIds } });
    if (courses.length !== courseIds.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Beberapa course_id tidak valid.' });
    }

    // Mapping ke LearningPathCourse
    for (let i = 0; i < courseIds.length; i++) {
      const cid = courseIds[i];
      const newId = `LPC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      await LearningPathCourse.create({ id: newId, learning_path_id: newLearningPath.id, course_id: cid, sequence_order: i + 1 }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json(newLearningPath);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const getAllLearningPaths = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter by Search (Title)
    if (search) {
      whereClause.title = { [db.Sequelize.Op.like]: `%${search}%` };
    }

    // Note: LearningPath model simplified (title, description). Additional filters removed.

    const { count, rows } = await LearningPath.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'courses',
          attributes: ['id','title','thumbnail_url','price','category','status'],
          include: [
            {
              model: Module,
              as: 'modules',
              attributes: ['id']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // Important for correct count with includes
    });

    // Calculate total modules and total courses for each LP
    const data = rows.map(lp => {
      let totalModules = 0;
      let totalCourses = 0;
      
      if (lp.courses) {
        totalCourses = lp.courses.length;
        lp.courses.forEach(course => {
          if (course.modules) {
            totalModules += course.modules.length;
          }
        });
      }
      
      return {
        ...lp.toJSON(),
        total_modules: totalModules,
        total_courses: totalCourses
      };
    });

    return res.status(200).json({
      success: true,
      data: data,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
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
      }
    });

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    // Urutkan courses berdasarkan sequence_order pada join table (LearningPathCourse)
    if (learningPath && learningPath.courses) {
      learningPath.courses = learningPath.courses.sort((a, b) => {
        const aSeq = (a.LearningPathCourse && a.LearningPathCourse.sequence_order) || 0;
        const bSeq = (b.LearningPathCourse && b.LearningPathCourse.sequence_order) || 0;
        return aSeq - bSeq;
      });
      // Urutkan modules per course by sequence_order if available
      learningPath.courses.forEach(c => {
        if (c.modules && c.modules.length > 0) {
          c.modules = c.modules.sort((m1, m2) => (m1.sequence_order || 0) - (m2.sequence_order || 0));
        }
      });
    }
    return res.status(200).json(learningPath);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const updateLearningPath = async (req, res) => {
  const { title, description, courses } = req.body;
  const t = await db.sequelize.transaction();
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, { transaction: t });
    if (!learningPath) {
      await t.rollback();
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    // Handle thumbnail upload jika ada
    let thumbnailUrl = learningPath.thumbnail;
    if (req.file) {
      // Hapus thumbnail lama jika ada
      if (learningPath.thumbnail) {
        await deleteFromSupabase(learningPath.thumbnail);
      }
      thumbnailUrl = await uploadToSupabase(req.file, 'thumbnails', 'learning-paths');
    }

    learningPath.title = title || learningPath.title;
    learningPath.description = description || learningPath.description;
    learningPath.thumbnail = thumbnailUrl;
    await learningPath.save({ transaction: t });

    // Handle Courses Reordering/Assignment (Sync) via LearningPathCourses
    // Jika courses dikirim (bisa berupa JSON string jika FormData), update urutan dan relasi
    let courseIds = courses;
    if (typeof courses === 'string') {
      try { courseIds = JSON.parse(courses); } catch (e) { courseIds = []; }
    }

    if (courseIds && Array.isArray(courseIds)) {
      // Ambil mapping saat ini
      const currentMappings = await LearningPathCourse.findAll({ where: { learning_path_id: learningPath.id }, transaction: t });
      const currentCourseIds = currentMappings.map(m => m.course_id);

      // Tentukan yang dihapus dan ditambahkan
      const coursesToRemove = currentCourseIds.filter(id => !courseIds.includes(id));
      const coursesToAdd = courseIds.filter(id => !currentCourseIds.includes(id));

      // Hapus mapping yang tidak ada lagi
      if (coursesToRemove.length > 0) {
        await LearningPathCourse.destroy({ where: { learning_path_id: learningPath.id, course_id: coursesToRemove }, transaction: t });
      }

      // Insert atau update urutan untuk setiap course di daftar baru
      for (let i = 0; i < courseIds.length; i++) {
        const cid = courseIds[i];
        // Jika sudah ada mapping, update sequence
        const existing = currentMappings.find(m => m.course_id === cid);
        if (existing) {
          await LearningPathCourse.update({ sequence_order: i + 1 }, { where: { id: existing.id }, transaction: t });
        } else {
          // Create mapping (generate id)
          const newId = `LPC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          await LearningPathCourse.create({ id: newId, learning_path_id: learningPath.id, course_id: cid, sequence_order: i + 1 }, { transaction: t });
        }
      }
    }

    await t.commit();
    return res.status(200).json(learningPath);
  } catch (err) {
    await t.rollback();
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