// File: src/controllers/mentorController.js
/**
 * @fileoverview Controller untuk mengelola entitas Mentor (CRUD).
 * Controller ini hanya diakses oleh Admin.
 */
const db = require('../../models');
const Mentor = db.Mentor;
const Course = db.Course;
const { Op } = require('sequelize');
const { uploadToSupabase, deleteFromSupabase } = require('../utils/uploadToSupabase');

/**
 * @function getAllMentors
 * @description Mengambil semua mentor dengan pagination
 * @route GET /api/v1/admin/mentors
 */
const getAllMentors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: mentors } = await Mentor.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: offset,
      include: [{
        model: Course,
        as: 'courses',
        attributes: ['id'],
      }]
    });

    // Add course count to each mentor
    const mentorsWithCount = mentors.map(mentor => ({
      ...mentor.toJSON(),
      courseCount: mentor.courses ? mentor.courses.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: mentorsWithCount,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mentor',
      error: error.message
    });
  }
};

/**
 * @function getMentorById
 * @description Mengambil detail mentor berdasarkan ID
 * @route GET /api/v1/admin/mentors/:id
 */
const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await Mentor.findByPk(id, {
      include: [{
        model: Course,
        as: 'courses',
        attributes: ['id', 'title', 'thumbnail_url', 'status'],
      }]
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: mentor
    });
  } catch (error) {
    console.error('Error fetching mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mentor',
      error: error.message
    });
  }
};

/**
 * @function createMentor
 * @description Membuat mentor baru
 * @route POST /api/v1/admin/mentors
 */
const createMentor = async (req, res) => {
  try {
    const { name, title, bio, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama mentor wajib diisi'
      });
    }

    let photo_url = null;

    // Handle photo upload if present
    if (req.file) {
      try {
        photo_url = await uploadToSupabase(req.file, 'mentors');
      } catch (uploadError) {
        console.error('Photo upload failed:', uploadError);
        // Continue without photo
      }
    }

    const newMentor = await Mentor.create({
      name: name.trim(),
      title: title || null,
      photo_url: photo_url,
      bio: bio || null,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Mentor berhasil ditambahkan',
      data: newMentor
    });
  } catch (error) {
    console.error('Error creating mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat mentor',
      error: error.message
    });
  }
};

/**
 * @function updateMentor
 * @description Memperbarui mentor berdasarkan ID
 * @route PUT /api/v1/admin/mentors/:id
 */
const updateMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, bio, status } = req.body;

    const mentor = await Mentor.findByPk(id);

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor tidak ditemukan'
      });
    }

    // Handle photo upload if present
    if (req.file) {
      // Delete old photo if exists
      if (mentor.photo_url) {
        await deleteFromSupabase(mentor.photo_url, 'mentors');
      }
      try {
        mentor.photo_url = await uploadToSupabase(req.file, 'mentors');
      } catch (uploadError) {
        console.error('Photo upload failed:', uploadError);
      }
    }

    // Update fields
    if (name) mentor.name = name.trim();
    if (title !== undefined) mentor.title = title;
    if (bio !== undefined) mentor.bio = bio;
    if (status) mentor.status = status;

    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Mentor berhasil diperbarui',
      data: mentor
    });
  } catch (error) {
    console.error('Error updating mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui mentor',
      error: error.message
    });
  }
};

/**
 * @function deleteMentor
 * @description Menghapus mentor berdasarkan ID
 * @route DELETE /api/v1/admin/mentors/:id
 */
const deleteMentor = async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await Mentor.findByPk(id, {
      include: [{
        model: Course,
        as: 'courses',
        attributes: ['id'],
      }]
    });

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor tidak ditemukan'
      });
    }

    // Check if mentor has courses
    if (mentor.courses && mentor.courses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Mentor tidak dapat dihapus karena masih memiliki ${mentor.courses.length} kelas`
      });
    }

    // Delete photo if exists
    if (mentor.photo_url) {
      await deleteFromSupabase(mentor.photo_url);
    }

    await mentor.destroy();

    res.status(200).json({
      success: true,
      message: 'Mentor berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus mentor',
      error: error.message
    });
  }
};

/**
 * @function getActiveMentors
 * @description Mengambil semua mentor yang aktif (untuk dropdown di frontend)
 * @route GET /api/v1/mentors (public)
 */
const getActiveMentors = async (req, res) => {
  try {
    const mentors = await Mentor.findAll({
      where: { status: 'active' },
      attributes: ['id', 'name', 'title', 'photo_url'],
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: mentors
    });
  } catch (error) {
    console.error('Error fetching active mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mentor',
      error: error.message
    });
  }
};

module.exports = {
  getAllMentors,
  getMentorById,
  createMentor,
  updateMentor,
  deleteMentor,
  getActiveMentors,
};
