// File: src/middlewares/authMiddleware.js
/**
 * @fileoverview Middleware Otentikasi dan Otorisasi.
 * Menerapkan arsitektur Hybrid Auth: memverifikasi token dari Supabase 
 * dan memvalidasi role dari database MySQL lokal.
 */
const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const User = db.User;

// Inisialisasi Supabase Client (menggunakan key ANON publik dari .env)
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

/**
 * @function protect
 * @description Middleware otentikasi utama. Memverifikasi JWT Supabase, 
 * lalu mengambil data user dari MySQL. User data dilekatkan ke req.user.
 * @param {object} req - Objek request (diharapkan membawa header Authorization: Bearer JWT)
 * @param {object} res - Objek response
 * @param {function} next - Fungsi next() untuk melanjutkan ke controller
 * @returns {void | Response} Melanjutkan ke next() jika sukses, atau 401 jika gagal.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Validasi format token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ada atau format salah (Unauthorized).' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verifikasi token ke Supabase (Otentikasi)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }

    // 2. Cari user di database MySQL kita berdasarkan supabase_auth_id (Otorisasi & Data Lokal)
    // Ini adalah langkah penting dalam Hybrid Auth
    const user = await User.findOne({ 
      where: { supabase_auth_id: supabaseUser.id } 
    });

    if (!user) {
      // User ada di Supabase tapi belum tersinkronisasi/dihapus dari lokal
      return res.status(401).json({ message: 'User tidak ditemukan di database lokal.' });
    }

    // 3. Simpan data user MySQL di req.user untuk digunakan oleh controller selanjutnya.
    req.user = user; 
    next();

  } catch (err) {
    console.error('Error saat menjalankan middleware protect:', err.message);
    return res.status(500).json({ message: 'Server error saat otentikasi.', error: err.message });
  }
};

/**
 * @function isAdmin
 * @description Middleware otorisasi. Memastikan user yang terotentikasi memiliki role 'admin'.
 * HARUS dijalankan SETELAH middleware protect().
 * @param {object} req - Objek request (diharapkan memiliki req.user dari middleware protect)
 * @param {object} res - Objek response
 * @param {function} next - Fungsi next() untuk melanjutkan ke controller
 * @returns {void | Response} Melanjutkan ke next() jika Admin, atau 403 jika Akses Ditolak.
 */
const isAdmin = (req, res, next) => {
  // Cek role dari data user MySQL yang sudah dilekatkan oleh protect()
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk Admin.' });
  }
};

module.exports = {
  protect,
  isAdmin,
};