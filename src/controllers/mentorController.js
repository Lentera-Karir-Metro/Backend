// File: src/controllers/mentorController.js
/**
 * @fileoverview Controller untuk mengelola Mentor data yang derived dari Course.
 */
const db = require('../../models');
const Course = db.Course;

/**
 * @function getMentors
 * @description Mendapatkan daftar unique mentors dari courses
 * @route GET /api/v1/admin/mentors
 */
const getMentors = async (req, res) => {
  try {
    const { search, status } = req.query;

    // Build where clause
    const where = {};
    if (search) {
      where[db.Sequelize.Op.or] = [
        { mentor_name: { [db.Sequelize.Op.like]: `%${search}%` } },
        { mentor_title: { [db.Sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    // Tambahkan filter agar hanya course yang memiliki mentor_name tidak null
    where.mentor_name = { [db.Sequelize.Op.ne]: null };

    const courses = await Course.findAll({
      where,
      attributes: ['id', 'mentor_name', 'mentor_title', 'mentor_photo_profile', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Group by mentor name to get unique mentors
    const mentorMap = new Map();
    courses.forEach(course => {
      if (course.mentor_name && !mentorMap.has(course.mentor_name)) {
        mentorMap.set(course.mentor_name, {
          id: course.id, // Using course id as mentor id for now
          name: course.mentor_name,
          title: course.mentor_title || '',
          photo: course.mentor_photo_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.mentor_name)}&background=random`,
          status: course.status === 'published' ? 'Active' : 'Inactive',
          createdAt: course.createdAt,
          courseCount: 1
        });
      } else if (course.mentor_name && mentorMap.has(course.mentor_name)) {
        const mentor = mentorMap.get(course.mentor_name);
        mentor.courseCount += 1;
      }
    });

    const mentors = Array.from(mentorMap.values());

    return res.status(200).json({
      success: true,
      data: mentors,
      pagination: {
        totalItems: mentors.length,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: mentors.length
      }
    });
  } catch (err) {
    console.error('Error fetching mentors:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error.', 
      error: err.message 
    });
  }
};

/**
 * @function getMentorById
 * @description Mendapatkan detail mentor dan courses yang diajar
 * @route GET /api/v1/admin/mentors/:id
 */
const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the course first to get mentor name
    const course = await Course.findByPk(id);
    if (!course || !course.mentor_name) {
      return res.status(404).json({ 
        success: false,
        message: 'Mentor tidak ditemukan.' 
      });
    }

    // Get all courses by this mentor
    const courses = await Course.findAll({
      where: { mentor_name: course.mentor_name },
      attributes: ['id', 'title', 'category', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const mentor = {
      id: course.id,
      name: course.mentor_name,
      title: course.mentor_title || '',
      photo: course.mentor_photo_profile || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.mentor_name)}&background=random`,
      status: course.status === 'published' ? 'Active' : 'Inactive',
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        status: c.status
      }))
    };

    return res.status(200).json({
      success: true,
      data: mentor
    });
  } catch (err) {
    console.error('Error fetching mentor:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error.', 
      error: err.message 
    });
  }
};

/**
 * @function updateMentor
 * @description Update mentor info di semua courses yang diajar
 * @route PUT /api/v1/admin/mentors/:id
 */
const updateMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, status } = req.body;

    // Find the course first to get current mentor name
    const course = await Course.findByPk(id);
    if (!course || !course.mentor_name) {
      return res.status(404).json({ 
        success: false,
        message: 'Mentor tidak ditemukan.' 
      });
    }

    const oldMentorName = course.mentor_name;

    // Update all courses with this mentor
    const updateData = {};
    if (name) updateData.mentor_name = name;
    if (title) updateData.mentor_title = title;
    if (status) updateData.status = status === 'Active' ? 'published' : 'draft';

    await Course.update(updateData, {
      where: { mentor_name: oldMentorName }
    });

    return res.status(200).json({
      success: true,
      message: 'Mentor berhasil diperbarui.'
    });
  } catch (err) {
    console.error('Error updating mentor:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error.', 
      error: err.message 
    });
  }
};

module.exports = {
  getMentors,
  getMentorById,
  updateMentor
};
