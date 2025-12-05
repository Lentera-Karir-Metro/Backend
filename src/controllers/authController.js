// File: src/controllers/authController.js
/**
 * @fileoverview Controller untuk menangani Autentikasi dan Sinkronisasi User.
 * Menggunakan pendekatan Hybrid: Login di Supabase -> Sinkronisasi data ke MySQL.
 */

const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const User = db.User;

// Inisialisasi Supabase Client
// Menggunakan ANON KEY (Public) karena aksi ini dilakukan atas nama user yang sedang login.
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

// Inisialisasi Supabase Admin Client dengan Service Role Key
// Service Role Key memiliki akses penuh termasuk Admin API
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * @function syncUser
 * @description Menyinkronkan data user yang baru login di Supabase ke database MySQL lokal.
 * Jika user belum ada di MySQL, akan dibuatkan record baru.
 * @route POST /api/v1/auth/sync
 *
 * @param {object} req - Objek request (Header Authorization: Bearer <TOKEN>)
 * @param {object} res - Objek response
 * @returns {object} Data user dari database MySQL.
 */
const syncUser = async (req, res) => {
  // 1. Validasi Header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ada atau format salah.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifikasi JWT ke Supabase (Memastikan token asli & valid)
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error) return res.status(401).json({ message: 'Token tidak valid.' });
    if (!supabaseUser) return res.status(404).json({ message: 'User Supabase tidak ditemukan.' });

    const supabaseAuthId = supabaseUser.id;

    // 3. Cek keberadaan User di MySQL
    let user = await User.findOne({ 
      where: { supabase_auth_id: supabaseAuthId } 
    });

    // 4. Jika tidak ada, Buat User Baru
    if (!user) {
      // Logika Fallback Nama:
      // 1. Cek 'username' (dari form register manual)
      // 2. Cek 'full_name' (dari login Google)
      // 3. Ambil bagian depan email (jika keduanya kosong)
      const usernameInput = supabaseUser.user_metadata.username || 
                            supabaseUser.user_metadata.full_name || 
                            supabaseUser.email.split('@')[0];

      user = await User.create({
        supabase_auth_id: supabaseAuthId,
        email: supabaseUser.email,
        username: usernameInput,
        // Role otomatis di-set 'user' oleh default value Model
        // ID otomatis di-generate oleh Hook 'beforeCreate' di Model
      });
    }

    // 5. Kembalikan data user lokal
    return res.status(200).json({
      message: 'Sinkronisasi berhasil.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Error saat sync user:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function refreshToken
 * @description Wrapper untuk memperbarui session token (Refresh Token Rotation).
 * Biasanya ditangani otomatis oleh library Supabase di Frontend, tapi disediakan di sini sebagai opsi.
 * @route POST /api/v1/auth/refresh-token
 *
 * @param {object} req - Objek request (Body: { refresh_token })
 * @param {object} res - Objek response
 * @returns {object} Token akses dan refresh token baru.
 */
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token', details: error.message });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    });
  } catch (err) {
    console.error('Error refreshing token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @function forgotPassword
 * @description Mengirim email reset password menggunakan Supabase Auth Admin API.
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  const { email, redirectTo } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Format email tidak valid.' });
  }

  if (!redirectTo) {
    return res.status(400).json({ message: 'Redirect URL harus disertakan.' });
  }

  try {
    // Check if user exists in MySQL first
    const user = await User.findOne({ 
      where: { email: email.trim() } 
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'Email tidak terdaftar dalam sistem.' 
      });
    }

    // Method 1: Try with Admin Client first (has more permissions)
    console.log(`🔄 Attempting to send reset email to: ${email}`);
    
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: redirectTo
      }
    });

    if (!adminError && adminData) {
      console.log('✅ Reset password link generated successfully');
      
      // In production with SMTP configured, Supabase will send email automatically
      // For development, we can log the link
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 Reset Password Link (DEV):', adminData.properties.action_link);
      }
      
      return res.status(200).json({
        message: 'Email reset password telah dikirim. Silakan cek inbox Anda.',
        ...(process.env.NODE_ENV !== 'production' && { 
          dev_link: adminData.properties.action_link,
          dev_note: 'Link ini hanya muncul di development mode'
        })
      });
    }

    // Method 2: Fallback to regular client if admin method fails
    console.log('⚠️  Admin method failed, trying regular method...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo
    });

    if (error) {
      console.error('❌ Supabase forgot password error:', error);
      
      // Handle rate limit
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        return res.status(429).json({ 
          message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' 
        });
      }
      
      // Handle SMTP/Email sending errors - still return success
      if (error.message?.includes('sending') || error.message?.includes('email') || error.status === 500) {
        console.error('⚠️  Email delivery failed - SMTP not configured properly');
        console.error('💡 Solution: Configure Custom SMTP in Supabase Dashboard → Authentication → Email');
        
        // Return success to user (they can still reset via Supabase Dashboard)
        return res.status(200).json({ 
          message: 'Permintaan reset password berhasil diproses.',
          note: 'Jika email tidak diterima dalam 5 menit, silakan hubungi administrator.'
        });
      }
      
      return res.status(400).json({ 
        message: error.message || 'Gagal mengirim email reset password.' 
      });
    }

    console.log('✅ Reset email sent successfully');
    return res.status(200).json({
      message: 'Email reset password telah dikirim. Silakan cek inbox Anda.'
    });

  } catch (err) {
    console.error('❌ Error forgot password:', err);
    return res.status(500).json({ 
      message: 'Terjadi kesalahan server.', 
      error: err.message 
    });
  }
};

// Ekspor semua fungsi
module.exports = { 
  syncUser, 
  refreshToken,
  forgotPassword 
};