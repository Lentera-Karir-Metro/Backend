const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase Client menggunakan variabel lingkungan
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;