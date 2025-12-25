// File: src/middlewares/authMiddleware.js
/**
 * @fileoverview Middleware Otentikasi dan Otorisasi.
 * Memverifikasi JWT (JSON Web Token) Lokal dan memvalidasi role dari database MySQL.
 */
const jwt = require('jsonwebtoken');
const db = require('../../models');
const User = db.User;

/**
 * @function protect
 * @description Middleware otentikasi utama. Memverifikasi JWT Lokal, 
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
    // 1. Verifikasi token Lokal (JWT)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_lentera_karir');

    // 2. Cari user di database MySQL kita berdasarkan ID dari token
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan di database lokal.' });
    }

    // 3. Attach user ke request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ message: 'Token tidak valid.' });
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