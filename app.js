// File: app.js
/**
 * @fileoverview Titik masuk utama (Entry Point) untuk aplikasi backend Lentera Karir.
 * Bertanggung jawab untuk inisialisasi server Express, koneksi database, dan pemasangan semua routes.
 */

// 1. Impor package
require('dotenv').config(); // Memuat variabel lingkungan dari file .env
const express = require('express'); // Framework server utama
const cors = require('cors'); // Middleware untuk mengizinkan akses lintas domain (frontend)
const db = require('./models'); // Memuat koneksi database Sequelize dan semua model

// 2. Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000; // Menggunakan port dari .env atau default 3000

// 3. Pasang Middleware Global
app.use(cors()); // Memasang CORS
app.use(express.json({ limit: '1000mb' })); // Memungkinkan parsing request body dalam format JSON dengan limit 1GB
app.use(express.urlencoded({ limit: '1000mb', extended: true })); // Support form-urlencoded dengan limit 1GB

// 4. Test Route (Untuk pengecekan status server)
app.get('/api/v1/test', (req, res) => {
  res.status(200).json({
    message: 'API Backend Lentera Karir Berhasil!'
  });
});

// 4b. Debug Route (Untuk mengecek status Midtrans & Environment)
// HANYA AKTIF DI MODE DEVELOPMENT
app.get('/api/v1/debug/config', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY ? '✓ Set' : '✗ Not Set';
  const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY ? '✓ Set' : '✗ Not Set';
  const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION || 'false';
  const dbName = process.env.DB_NAME || 'unknown';

  return res.status(200).json({
    message: 'Debug Info',
    midtrans: {
      serverKey: midtransServerKey,
      clientKey: midtransClientKey,
      isProduction: midtransIsProduction
    },
    database: {
      name: dbName
    },
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// 5. Pasang Routes (Semua route menggunakan prefix umum /api/v1)

// --- A. Otentikasi ---
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/v1/auth', authRoutes); // POST /api/v1/auth/sync

// --- B. Rute ADMIN (Hanya dapat diakses oleh Admin) ---
const learningPathRoutes = require('./src/routes/learningPathRoutes');
app.use('/api/v1/admin/learning-paths', learningPathRoutes); // CRUD LP

const courseModuleRoutes = require('./src/routes/courseModuleRoutes');
app.use('/api/v1/admin', courseModuleRoutes); // CRUD Course/Module & Reordering

const quizRoutes = require('./src/routes/quizRoutes');
app.use('/api/v1/admin', quizRoutes); // CRUD Quiz Engine

const userManagementRoutes = require('./src/routes/userManagementRoutes');
app.use('/api/v1/admin', userManagementRoutes); // Manajemen User (Deaktivasi, Enroll Manual)

const adminDashboardRoutes = require('./src/routes/adminDashboardRoutes');
app.use('/api/v1/admin/dashboard', adminDashboardRoutes); // Admin Dashboard Stats

const reportsRoutes = require('./src/routes/reportsRoutes');
app.use('/api/v1/admin/reports', reportsRoutes); // Reports & Analytics

const batchOperationsRoutes = require('./src/routes/batchOperationsRoutes');
app.use('/api/v1/admin/batch', batchOperationsRoutes); // Batch Operations

const mentorRoutes = require('./src/routes/mentorRoutes');
app.use('/api/v1/admin', mentorRoutes); // Mentor Management

const categoryRoutes = require('./src/routes/categoryRoutes');
app.use('/api/v1/admin/categories', categoryRoutes); // Category Management

// --- C. Rute Otomatisasi (Webhooks) ---
const webhookRoutes = require('./src/routes/webhookRoutes');
app.use('/api/v1', webhookRoutes); // Webhook Midtrans & Supabase (Tidak Terproteksi)

// --- D. Rute User & Publik ---
const publicRoutes = require('./src/routes/publicRoutes');
app.use('/api/v1', publicRoutes); // Katalog Publik (Tidak Terproteksi)

const paymentRoutes = require('./src/routes/paymentRoutes');
app.use('/api/v1', paymentRoutes); // Checkout Pembayaran (Wajib Login)

const learningRoutes = require('./src/routes/learningRoutes');
app.use('/api/v1', learningRoutes); // Progres Belajar & Kuis (Wajib Login)

const dashboardRoutes = require('./src/routes/dashboardRoutes');
app.use('/api/v1/dashboard', dashboardRoutes); // Dashboard User (Wajib Login)

const certificateRoutes = require('./src/routes/certificateRoutes');
app.use('/api/v1/certificates', certificateRoutes); // Certificate User (Wajib Login)

const userCertificateRoutes = require('./src/routes/userCertificateRoutes');
app.use('/api/v1/user-certificates', userCertificateRoutes); // User Certificate Generation (Wajib Login)



// 6. Jalankan Server & Tes Koneksi Database
/**
 * @description Menghidupkan server dan menguji koneksi ke database MySQL.
 * @listens {PORT}
 */
app.listen(PORT, async () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);

  try {
    // Memastikan koneksi database valid sebelum menerima request
    await db.sequelize.authenticate();
    console.log('Koneksi ke database MySQL (database_lentera_karir) BERHASIL.');
  } catch (error) {
    console.error('Koneksi ke database GAGAL:', error);
  }
});