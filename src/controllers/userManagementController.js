// File: src/controllers/userManagementController.js
const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const { User, UserEnrollment, LearningPath } = db;
const { Op } = require('sequelize');

// Inisialisasi Supabase Admin Client (menggunakan Service Role Key)
// PENTING: Jangan ekspos client ini ke frontend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// @desc    Melihat semua user (Admin)
// @route   GET /api/v1/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'nama_lengkap', 'role', 'status'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Update data user, misal nama_lengkap (Admin)
// @route   PUT /api/v1/admin/users/:id
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nama_lengkap } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    user.nama_lengkap = nama_lengkap || user.nama_lengkap;
    await user.save();
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Menonaktifkan user (Admin)
// @route   POST /api/v1/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  const { id } = req.params; // Ini ID MySQL kita (LT-XXXXXX)
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // 1. Nonaktifkan login di Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.supabase_auth_id,
      { ban_duration: 'inf' } // 'inf' = banned indefinitely
    );

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ message: 'Gagal menonaktifkan user di Supabase.' });
    }

    // 2. Ubah status di MySQL
    user.status = 'inactive';
    await user.save();

    return res.status(200).json({ message: 'User berhasil dinonaktifkan.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Memicu link reset password (Admin)
// @route   POST /api/v1/admin/users/:id/reset-password
const triggerPasswordReset = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Memanggil API Supabase Auth untuk mengirim email reset
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
      user.email,
      // Anda bisa tambahkan redirectTo jika frontend punya halaman reset khusus
      // { redirectTo: 'http://localhost:3001/update-password' }
    );

    if (error) {
      return res.status(500).json({ message: 'Gagal mengirim email reset.' });
    }

    return res.status(200).json({ message: 'Email reset password telah dikirim.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// @desc    Mendaftarkan user ke Learning Path manual (Admin)
// @route   POST /api/v1/admin/users/:id/enroll
const manualEnrollUser = async (req, res) => {
  const { id } = req.params; // User ID (LT-XXXXXX)
  const { learning_path_id } = req.body; // Learning Path ID (LP-XXXXXX)

  if (!learning_path_id) {
    return res.status(400).json({ message: 'learning_path_id wajib diisi.' });
  }

  try {
    // Pastikan user dan learning path ada
    const user = await User.findByPk(id);
    const learningPath = await LearningPath.findByPk(learning_path_id);

    if (!user || !learningPath) {
      return res.status(404).json({ message: 'User atau Learning Path tidak ditemukan.' });
    }

    // Daftarkan user
    const [enrollment, created] = await UserEnrollment.findOrCreate({
      where: { 
        user_id: user.id, 
        learning_path_id: learningPath.id 
      },
      defaults: {
        status: 'success',
        enrolled_at: new Date(),
        midtrans_transaction_id: 'MANUAL_BY_ADMIN'
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
  updateUser,
  deactivateUser,
  triggerPasswordReset,
  manualEnrollUser,
};