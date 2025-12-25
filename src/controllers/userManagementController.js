// File: src/controllers/userManagementController.js
/**
 * @fileoverview Controller untuk mengelola manajemen user (Admin).
 * Endpoint ini menangani CRUD user, nonaktifkan, reset password, dan pendaftaran manual.
 * Membutuhkan Service Role Key Supabase untuk fungsi-fungsi sensitif (Ban, Reset Password).
 */
const db = require('../../models');
const { User, UserEnrollment, LearningPath } = db;
const { generateCustomId } = require('../utils/idGenerator');
const { Op } = require('sequelize');
const { sendResetPasswordEmail } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * @function getAllUsers
 * @description Mengambil daftar semua user (untuk panel Admin).
 * @route GET /api/v1/admin/users
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 * @returns {object} Array user.
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter by Search (Name or Email)
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by Status
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'email', 'username', 'role', 'status', 'createdAt'], // Added createdAt
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: rows,
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

/**
 * @function createUser
 * @description Membuat user baru (Admin Panel).
 * @route POST /api/v1/admin/users
 */
const createUser = async (req, res) => {
  const { email, password, username, role } = req.body;

  try {
    // 1. Create user in MySQL
    const newUser = await User.create({
      id: generateCustomId('USR'),
      email,
      password, // Hook will hash this
      username: username || email.split('@')[0],
      role: role || 'user',
      status: 'active',
      is_verified: true // Admin created users are verified
    });

    return res.status(201).json({
      success: true,
      message: 'User berhasil dibuat.',
      data: newUser
    });
  } catch (err) {
    console.error('Error createUser:', err);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateUser
 * @description Memperbarui data user (username, status).
 * @route PUT /api/v1/admin/users/:id
 *
 * @param {object} req - Objek request (params: id, body: { username, status })
 * @param {object} res - Objek response
 * @returns {object} User yang sudah diperbarui.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, status } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Update fields
    if (username) user.username = username;
    
    // Handle Status Change (Active/Inactive)
    if (status && status !== user.status) {
      user.status = status;
    }

    await user.save();
    return res.status(200).json({
      success: true,
      message: 'User berhasil diperbarui.',
      data: user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deleteUser
 * @description Menghapus user secara permanen (Hard Delete).
 * @route DELETE /api/v1/admin/users/:id
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // 1. Delete from MySQL
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User berhasil dihapus permanen.'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function deactivateUser
 * @description Menonaktifkan user secara permanen dari login.
 * Memerlukan sinkronisasi dua arah: Supabase Auth dan MySQL.
 * @route POST /api/v1/admin/users/:id/deactivate
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const deactivateUser = async (req, res) => {
  const { id } = req.params; // ID MySQL kita (LT-XXXXXX)
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // 1. Ubah status di MySQL menjadi 'inactive'
    user.status = 'inactive';
    await user.save();

    return res.status(200).json({ message: 'User berhasil dinonaktifkan.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function triggerPasswordReset
 * @description Memicu pengiriman link reset password ke email user.
 * Dilakukan melalui API Supabase Auth.
 * @route POST /api/v1/admin/users/:id/reset-password
 *
 * @param {object} req - Objek request (params: id)
 * @param {object} res - Objek response
 * @returns {object} Pesan sukses.
 */
const triggerPasswordReset = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Generate token reset password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    try {
      await sendResetPasswordEmail(user.email, resetToken);
      return res.status(200).json({ message: 'Email reset password telah dikirim.' });
    } catch (emailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({ message: 'Gagal mengirim email reset.' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function manualEnrollUser
 * @description Mendaftarkan user ke Learning Path secara manual (tanpa melalui pembayaran).
 * @route POST /api/v1/admin/users/:id/enroll
 *
 * @param {object} req - Objek request (params: id, body: { learning_path_id })
 * @param {object} res - Objek response
 * @returns {object} Enrollment record yang baru dibuat.
 */
const manualEnrollUser = async (req, res) => {
  const { id } = req.params; // User ID (LT-XXXXXX)
  const { learning_path_id } = req.body; // Learning Path ID (LP-XXXXXX)

  if (!learning_path_id) {
    return res.status(400).json({ message: 'learning_path_id wajib diisi.' });
  }

  try {
    // 1. Pastikan user dan learning path ada
    const user = await User.findByPk(id);
    const learningPath = await LearningPath.findByPk(learning_path_id);

    if (!user || !learningPath) {
      return res.status(404).json({ message: 'User atau Learning Path tidak ditemukan.' });
    }

    // 2. Daftarkan user menggunakan findOrCreate
    const [enrollment, created] = await UserEnrollment.findOrCreate({
      where: { 
        user_id: user.id, 
        learning_path_id: learningPath.id 
      },
      defaults: {
        // ID (EN-XXXXXX) otomatis di-generate oleh Hook di Model
        status: 'success', // Langsung set status sukses
        enrolled_at: new Date(),
        midtrans_transaction_id: 'MANUAL_BY_ADMIN' // Penanda bahwa ini bukan transaksi Midtrans
      }
    });

    if (!created) {
      return res.status(409).json({ message: 'User sudah terdaftar di learning path ini.' });
    }

    return res.status(201).json({ message: 'User berhasil didaftarkan.', enrollment });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  triggerPasswordReset,
  manualEnrollUser,
  getUserEnrollments,
};

/**
 * @function getUserEnrollments
 * @description Mengambil semua enrollment user beserta detail learning path
 * @route GET /api/v1/admin/users/:id/enrollments
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 * @returns {object} Array enrollment dengan detail learning path
 */
async function getUserEnrollments(req, res) {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User tidak ditemukan.' 
      });
    }

    // Get all enrollments for the user
    const enrollments = await UserEnrollment.findAll({
      where: { 
        user_id: id,
        status: 'success' // Only get successful enrollments
      },
      include: [{
        model: LearningPath,
        as: 'LearningPath',
        attributes: ['id', 'title', 'category', 'description', 'price']
      }],
      order: [['enrolled_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (err) {
    console.error('Error getting user enrollments:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error.', 
      error: err.message 
    });
  }
}