// File: src/controllers/authController.js
const { createClient } = require('@supabase/supabase-js');
const db = require('../../models'); // Panggil model dari root
const User = db.User;

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

const syncUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak ada.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Format token salah.' });
  }

  try {
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ message: 'Token tidak valid.' });
    }
    if (!supabaseUser) {
       return res.status(404).json({ message: 'User Supabase tidak ditemukan.' });
    }

    const supabaseAuthId = supabaseUser.id;

    let user = await User.findOne({ 
      where: { supabase_auth_id: supabaseAuthId } 
    });

    if (!user) {
      const namaLengkap = supabaseUser.user_metadata.nama_lengkap || 
                          supabaseUser.user_metadata.username || 
                          supabaseUser.email;

      user = await User.create({
        supabase_auth_id: supabaseAuthId,
        email: supabaseUser.email,
        nama_lengkap: namaLengkap,
      });
    }

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
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { syncUser };