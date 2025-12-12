// File: src/controllers/authController.js
/**
 * @fileoverview Controller untuk menangani Autentikasi dan Sinkronisasi User.
 * Menggunakan pendekatan Hybrid: Login di Supabase -> Sinkronisasi data ke MySQL.
 */

const db = require('../../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_lentera_karir', {
    expiresIn: '30d',
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

    res.status(200).json({ message: 'Email berhasil diverifikasi. Silakan login.' });
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

    if (!user.password) {
       return res.status(400).json({ message: 'Akun ini terdaftar menggunakan Google. Silakan login dengan Google.' });
    }

    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    if (!user.is_verified) {
      return res.status(401).json({ message: 'Email belum diverifikasi. Silakan cek email Anda.' });
    }

    res.json({
      message: 'Login berhasil',
      token: generateToken(user.id),
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

const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    let googleUser;
    
    // Check if it's a JWT (ID Token) - usually has 3 parts separated by dots
    if (token.split('.').length === 3) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        googleUser = {
            email: payload.email,
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture
        };
    } else {
        // Assume Access Token (from useGoogleLogin)
        // Fetch user info from Google UserInfo endpoint
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user info from Google');
        }
        
        const data = await response.json();
        googleUser = {
            email: data.email,
            name: data.name,
            googleId: data.sub,
            picture: data.picture
        };
    }

    const { email, name, googleId, picture } = googleUser;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.is_verified) {
        user.is_verified = true;
        await user.save();
      }
      if (!user.supabase_auth_id) {
          user.supabase_auth_id = googleId;
          await user.save();
      }
    } else {
      user = await User.create({
        username: name,
        email,
        password: null,
        is_verified: true,
        supabase_auth_id: googleId,
        role: 'user',
        status: 'active'
      });
    }

    res.json({
      message: 'Login Google berhasil',
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ message: 'Google login failed' });
  }
};

const forgotPassword = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

const refreshToken = async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
};

module.exports = {
  register,
  verifyEmail,
  login,
  googleLogin,
  forgotPassword,
  refreshToken
};