// File: src/controllers/userManagementController.js
/**
 * @fileoverview Controller untuk mengelola manajemen user (Admin).
 * Endpoint ini menangani CRUD user, nonaktifkan, reset password, dan pendaftaran manual.
 * Membutuhkan Service Role Key Supabase untuk fungsi-fungsi sensitif.
 */
const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const { User, UserEnrollment, LearningPath } = db;
const { generateCustomId } = require('../utils/idGenerator');
const { Op } = require('sequelize');

// Inisialisasi Supabase Admin Client (menggunakan Service Role Key)
// Klien ini memiliki privilege tinggi untuk memodifikasi user lain di Supabase Auth.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    // Ambil data penting saja (hindari mengembalikan supabase_auth_id)
    const users = await User.findAll({
      attributes: ['id', 'email', 'username', 'role', 'status'],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function updateUser
 * @description Memperbarui data user (misal: username untuk sertifikat).
 * @route PUT /api/v1/admin/users/:id
 *
 * @param {object} req - Objek request (params: id, body: { username })
 * @param {object} res - Objek response
 * @returns {object} User yang sudah diperbarui.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    user.username = username || user.username;
    await user.save();
    return res.status(200).json(user);
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

    // 1. Nonaktifkan/ban login di Supabase Auth (wajib)
    // Menggunakan 'inf' (indefinite) untuk ban permanen
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.supabase_auth_id,
      { ban_duration: 'inf' } 
    );

    if (error) {
      console.error('Supabase error:', error.message);
      return res.status(500).json({ message: 'Gagal menonaktifkan user di Supabase.' });
    }

    // 2. Ubah status di MySQL menjadi 'inactive'
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

    // Memanggil API Supabase Auth untuk mengirim email reset
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(
      user.email,
      // Opsi untuk redirectTo dapat ditambahkan di sini
    );

    if (error) {
      return res.status(500).json({ message: 'Gagal mengirim email reset.' });
    }

    return res.status(200).json({ message: 'Email reset password telah dikirim.' });
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

    // 2. Daftarkan user menggunakan findOrCreate (pastikan id ter-generate)
    const [enrollment, created] = await UserEnrollment.findOrCreate({
      where: { 
        user_id: user.id, 
        learning_path_id: learningPath.id 
      },
      defaults: {
        id: generateCustomId('EN'),
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
  updateUser,
  deactivateUser,
  triggerPasswordReset,
  manualEnrollUser,
};