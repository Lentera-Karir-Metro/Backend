// File: src/controllers/authController.js
/**
 * @fileoverview Controller untuk menangani Autentikasi User.
 * Menggunakan JWT (JSON Web Token) dan Google OAuth.
 * Catatan: Supabase hanya digunakan untuk Storage (penyimpanan file), bukan untuk Autentikasi.
 */

const db = require('../../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/emailService');

// Access Token: Umur pendek (15 menit) untuk keamanan
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_lentera_karir', {
    expiresIn: '15m',
  });
};

// Refresh Token: Umur panjang (7 hari) untuk memperbarui sesi
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_lentera_karir', {
    expiresIn: '7d',
  });
};

const register = async (req, res) => {
  // Terima baik field 'username' maupun 'name'; fallback ke local-part email
  const { username: usernameRaw, name, email, password } = req.body;
  const derivedUsername = (usernameRaw && String(usernameRaw).trim())
    || (name && String(name).trim())
    || (email && String(email).split('@')[0]);
  const username = derivedUsername;

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Validasi minimum input
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, dan username wajib diisi.' });
    }

    const user = await User.create({
      username,
      email,
      password, // Akan di-hash oleh hook
      verification_token: verificationToken,
      is_verified: false,
      role: 'user',
      status: 'active'
    });

    // Kirim email verifikasi (SMTP/Gmail). Jika gagal, registrasi tetap sukses.
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.status(201).json({
        message: 'Registrasi berhasil! Email verifikasi telah dikirim ke ' + user.email,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      res.status(201).json({
        message: 'Registrasi berhasil, namun email verifikasi gagal dikirim. Silakan coba lagi beberapa saat.',
        user: { id: user.id, username: user.username, email: user.email }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ where: { verification_token: token } });

    if (!user) {
      return res.status(400).json({ message: 'Token verifikasi tidak valid atau kadaluarsa.' });
    }

    user.is_verified = true;
    user.verification_token = null;
    await user.save();

    res.status(200).json({
      message: 'Email berhasil diverifikasi. Silakan login.',
      email: user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ message: 'Email belum diverifikasi. Silakan cek email Anda.' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Opsional: Simpan refreshToken di database jika ingin fitur "Force Logout"
    // await user.update({ refresh_token: refreshToken });

    res.json({
      message: 'Login berhasil',
      token: accessToken, // Token utama (15 menit)
      refreshToken: refreshToken, // Token cadangan (7 hari)
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Untuk keamanan, jangan beri tahu jika email tidak ditemukan
      return res.status(200).json({ message: 'Jika email terdaftar, link reset password telah dikirim.' });
    }

    // Generate token reset password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 jam dari sekarang (Format Date Object)

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    try {
      await sendResetPasswordEmail(user.email, resetToken);
      res.status(200).json({ message: 'Jika email terdaftar, link reset password telah dikirim.' });
    } catch (emailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({ message: 'Gagal mengirim email. Silakan coba lagi.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  // Terima 'newPassword' ATAU 'password' (agar fleksibel)
  const { token, newPassword, password } = req.body;
  const passwordToSet = newPassword || password;

  if (!passwordToSet) {
    return res.status(400).json({ message: 'Password baru wajib diisi.' });
  }

  try {
    // Pastikan Op tersedia
    const Op = db.Sequelize.Op;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() } // Bandingkan dengan waktu sekarang
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    // Update password (hook beforeUpdate akan meng-hash password)
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    // Tampilkan pesan error asli untuk debugging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token diperlukan.' });
  }

  try {
    // Verifikasi Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_lentera_karir');

    // Cek apakah user masih ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan.' });
    }

    // Generate Access Token baru (15 menit)
    const newAccessToken = generateAccessToken(user.id);

    res.json({
      message: 'Token berhasil diperbarui',
      token: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(403).json({ message: 'Refresh Token tidak valid atau kadaluarsa.' });
  }
};

// Get current user data
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'status', 'is_verified']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  getCurrentUser
};

