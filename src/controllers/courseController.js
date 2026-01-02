/**
 * @function assignCourseToLearningPath
 * @description Assign course yang sudah ada ke learning path tertentu.
 * @route POST /api/v1/admin/learning-paths/:lp_id/courses
 * @param {object} req - Objek request (params: lp_id, body: { course_id })
 * @param {object} res - Objek response
 * @returns {object} Mapping baru LearningPathCourse
 */
const assignCourseToLearningPath = async (req, res) => {
  const { lp_id } = req.params;
  const { course_id } = req.body;
  if (!course_id) {
    return res.status(400).json({ message: 'course_id wajib diisi.' });
  }
  try {
    // Cek learning path
    const learningPath = await LearningPath.findByPk(lp_id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    // Cek course
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }
    // Cek mapping sudah ada?
    const exist = await LearningPathCourse.findOne({ where: { learning_path_id: lp_id, course_id } });
    if (exist) {
      return res.status(409).json({ message: 'Course sudah ada di learning path ini.' });
    }
    // Tentukan sequence_order
    const lastMapping = await LearningPathCourse.findOne({ where: { learning_path_id: lp_id }, order: [['sequence_order', 'DESC']] });
    const nextOrder = lastMapping ? lastMapping.sequence_order + 1 : 1;
    // Buat mapping
    const newMappingId = `LPC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mapping = await LearningPathCourse.create({ id: newMappingId, learning_path_id: lp_id, course_id, sequence_order: nextOrder });
    return res.status(201).json({ message: 'Course berhasil di-assign ke learning path.', mapping });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
// File: src/controllers/courseController.js
/**
 * @fileoverview Controller untuk mengelola entitas Course (CRUD dan reordering).
 * Controller ini hanya diakses oleh Admin.
 */
const db = require('../../models');
const Course = db.Course;
const LearningPath = db.LearningPath;
const LearningPathCourse = db.LearningPathCourse;
// Impor sequelize untuk menjalankan transaksi database (diperlukan untuk reordering)
const { sequelize } = require('../../models');

/**
 * @function createCourse
 * @description Membuat Course baru secara standalone.
 * @route POST /api/v1/admin/courses
 *
 * @param {object} req - Objek request (body: { title, description })
 * @param {object} res - Objek response
 * @returns {object} Course yang baru dibuat.
 */
const { uploadToSupabase } = require('../utils/uploadToSupabase');

const createCourse = async (req, res) => {
  const {
    title,
    description,
    price,
    discount_amount,
    category,
    mentor_id,
    mentor_name,
    mentor_title,
    status
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // Handle File Uploads
  let thumbnail_url = req.body.thumbnail_url || null;
  let mentor_photo_profile = req.body.mentor_photo_profile || null;

  try {
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Jika ada file thumbnail yang diupload
      const thumbnailFile = req.files.find(f => f.fieldname === 'thumbnail');
      if (thumbnailFile) {
        console.log('Uploading thumbnail:', thumbnailFile.originalname);
        thumbnail_url = await uploadToSupabase(thumbnailFile, 'thumbnails', 'courses');
      }

      // Jika ada file mentor_photo yang diupload
      const mentorPhotoFile = req.files.find(f => f.fieldname === 'mentor_photo');
      if (mentorPhotoFile) {
        console.log('Uploading mentor photo:', mentorPhotoFile.originalname);
        mentor_photo_profile = await uploadToSupabase(mentorPhotoFile, 'mentors', 'courses');
      }
    }
  } catch (uploadErr) {
    console.error('Upload error:', uploadErr);
    return res.status(500).json({
      message: 'Failed to upload files.',
      error: uploadErr.message || 'Unknown upload error'
    });
  }

  try {
    const newCourse = await Course.create({
      title,
      description: description || null,
      price: price || 0,
      thumbnail_url,
      discount_amount: discount_amount || 0,
      category: category || 'All',
      mentor_id: mentor_id || null,
      mentor_name: mentor_name || null,
      mentor_title: mentor_title || null,
      mentor_photo_profile,
      status: status || 'published'
    });

    return res.status(201).json({
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateCourse
 * @description Memperbarui Course berdasarkan ID-nya.
 * @route PUT /api/v1/admin/courses/:id
 *
 * @param {object} req - Objek request (params: id, body: { title, description })
 * @param {object} res - Objek response
 * @returns {object} Course yang sudah diperbarui.
 */
const { deleteFromSupabase } = require('../utils/uploadToSupabase');

const updateCourse = async (req, res) => {
  const { title, description, price, discount_amount, category, mentor_id, mentor_name, mentor_title, status } = req.body;
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.price = price !== undefined ? price : course.price;
    course.discount_amount = discount_amount !== undefined ? discount_amount : course.discount_amount;
    course.category = category || course.category;
    course.mentor_id = mentor_id !== undefined ? mentor_id : course.mentor_id;
    course.mentor_name = mentor_name || course.mentor_name;
    course.mentor_title = mentor_title || course.mentor_title;
    course.status = status || course.status;

    // Handle File Uploads (Update)
    if (req.files) {
      // Thumbnail
      const thumbnailFile = req.files.find(f => f.fieldname === 'thumbnail');
      if (thumbnailFile) {
        if (course.thumbnail_url) await deleteFromSupabase(course.thumbnail_url, 'thumbnails');
        course.thumbnail_url = await uploadToSupabase(thumbnailFile, 'thumbnails', 'courses');
      }
      // Mentor Photo
      const mentorPhotoFile = req.files.find(f => f.fieldname === 'mentor_photo');
      if (mentorPhotoFile) {
        if (course.mentor_photo_profile) await deleteFromSupabase(course.mentor_photo_profile, 'mentors');
        course.mentor_photo_profile = await uploadToSupabase(mentorPhotoFile, 'mentors', 'courses');
      }
    }

    await course.save();
    return res.status(200).json(course);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteCourse
 * @description Menghapus Course berdasarkan ID-nya. Karena relasi CASCADE, 
 * semua Modul di dalamnya akan ikut terhapus.
 * @route DELETE /api/v1/admin/courses/:id
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    await course.destroy();
    return res.status(200).json({ message: 'Course berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function reorderCourses
 * @description Memperbarui sequence_order semua course di dalam satu Learning Path 
 * berdasarkan urutan yang diberikan oleh frontend (fitur drag-and-drop).
 * @route POST /api/v1/admin/learning-paths/:lp_id/reorder-courses
 *
 * @param {object} req - Objek request (params: lp_id, body: { course_ids: string[] })
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const reorderCourses = async (req, res) => {
  const { lp_id } = req.params;
  const { course_ids } = req.body; // Menerima array ID kustom Course

  if (!Array.isArray(course_ids) || course_ids.length === 0) {
    return res.status(400).json({ message: 'course_ids harus berupa array.' });
  }

  // Mulai transaksi database untuk memastikan integritas data
  const t = await sequelize.transaction();

  try {
    // Update sequence_order pada join table LearningPathCourses berdasarkan index array
    for (let i = 0; i < course_ids.length; i++) {
      const cid = course_ids[i];
      await LearningPathCourse.update(
        { sequence_order: i + 1 },
        { where: { learning_path_id: lp_id, course_id: cid }, transaction: t }
      );
    }

    await t.commit(); // Simpan perubahan
    return res.status(200).json({ message: 'Urutan course berhasil diperbarui.' });
  } catch (err) {
    await t.rollback(); // Batalkan perubahan jika ada error
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getCourseById
 * @description Mengambil detail course berdasarkan ID
 * @route GET /api/v1/admin/courses/:id
 */
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: db.Module,
          as: 'modules',
          attributes: ['id', 'title', 'sequence_order']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ message: 'Course tidak ditemukan.' });
    }

    return res.status(200).json(course);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function getAllCourses
 * @description Mengambil semua course, opsional filter by learning_path_id atau unassigned.
 * @route GET /api/v1/admin/courses
 */
const getAllCourses = async (req, res) => {
  try {
    const { learning_path_id, unassigned, search } = req.query;

    // Jika diminta filter berdasarkan learning_path_id, ambil courses berdasarkan join table
    if (learning_path_id) {
      // Ambil mapping untuk learning path ini dengan urutan
      const mappings = await LearningPathCourse.findAll({ where: { learning_path_id }, order: [['sequence_order', 'ASC']] });
      const courseIds = mappings.map(m => m.course_id);
      if (courseIds.length === 0) return res.status(200).json([]);

      const courses = await Course.findAll({
        where: { id: courseIds },
        attributes: ['id', 'title'],
        include: [
          {
            model: db.Module,
            as: 'modules',
            attributes: ['id']
          }
        ]
      });
      // Urutkan sesuai mapping order
      const ordered = courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);
      return res.status(200).json(ordered);
    }

    // Jika diminta hanya unassigned (tidak masuk ke learning path manapun)
    if (unassigned === 'true') {
      const mappings = await LearningPathCourse.findAll({ attributes: ['course_id'] });
      const mappedIds = mappings.map(m => m.course_id);
      const where = {};
      if (mappedIds.length > 0) where.id = { [db.Sequelize.Op.notIn]: mappedIds };
      if (search) where.title = { [db.Sequelize.Op.like]: `%${search}%` };
      const courses = await Course.findAll({
        where,
        attributes: ['id', 'title'],
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: db.Module,
            as: 'modules',
            attributes: ['id']
          }
        ]
      });
      return res.status(200).json(courses);
    }

    // Default: list all courses (no learning path filter)
    const where = {};
    if (search) where.title = { [db.Sequelize.Op.like]: `%${search}%` };
    const courses = await Course.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.Module,
          as: 'modules',
          attributes: ['id', 'title', 'sequence_order']
        }
      ]
    });
    return res.status(200).json(courses);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  reorderCourses,
  getAllCourses,
  getCourseById,
  assignCourseToLearningPath
};