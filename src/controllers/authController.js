const { createClient } = require('@supabase/supabase-js');
const db = require('../../models');
const User = db.User;
const { generateCustomId } = require('../utils/idGenerator');

// Inisialisasi Supabase Client (menggunakan key ANON publik dari .env)
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

/**
 * @function syncUser
 * @description Endpoint untuk menyinkronkan data user dari Supabase Auth ke database MySQL lokal.
 * Proses ini memastikan setiap user yang login memiliki record di tabel 'Users' kita.
 * @route POST /api/v1/auth/sync
 *
 * @param {object} req - Objek request dari Express
 * @param {object} res - Objek response dari Express
 * @returns {object} Response JSON berisi data user yang sudah disinkronkan.
 */
const syncUser = async (req, res) => {
  // 1. Ambil JWT dari header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ada atau format salah.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verifikasi JWT ke Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }
    if (!supabaseUser) {
      return res.status(404).json({ message: 'User Supabase tidak ditemukan.' });
    }

    const supabaseAuthId = supabaseUser.id;

    // 3. Logika Sinkronisasi: Cari user di MySQL
    let user = await User.findOne({ 
      where: { supabase_auth_id: supabaseAuthId } 
    });

    // 4. Jika user TIDAK ADA di MySQL, buat record baru
    if (!user) {
      const namaLengkap = supabaseUser.user_metadata.nama_lengkap || 
                          supabaseUser.user_metadata.username || 
                          supabaseUser.email;

      user = await User.create({
        id: generateCustomId('LT'),
        supabase_auth_id: supabaseAuthId,
        email: supabaseUser.email,
        nama_lengkap: namaLengkap,
      });
    }

    // 5. Hasil: Kirim data user MySQL ke frontend
    return res.status(200).json({
      message: 'Sinkronisasi berhasil.',
      user: {
        id: user.id,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Error saat sync user:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { syncUser };
