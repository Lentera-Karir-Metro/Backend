// File: src/middlewares/authMiddleware.js
const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const User = db.User;

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

/**
 * Middleware untuk memverifikasi token Supabase DAN
 * mengambil data user dari MySQL kita.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ada atau format salah (Unauthorized).' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verifikasi token ke Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }

    // 2. Cari user di database MySQL kita berdasarkan supabase_auth_id
    const user = await User.findOne({ 
      where: { supabase_auth_id: supabaseUser.id } 
    });

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan di database lokal.' });
    }

    // 3. Simpan data user kita (dari MySQL) di request
    // agar bisa dipakai oleh controller selanjutnya.
    req.user = user; 
    next();

  } catch (err) {
    return res.status(500).json({ message: 'Server error saat otentikasi.', error: err.message });
  }
};

/**
 * Middleware untuk mengecek apakah user adalah admin.
 * HARUS dijalankan SETELAH middleware protect().
 */
const isAdmin = (req, res, next) => {
  // req.user diambil dari middleware protect()
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