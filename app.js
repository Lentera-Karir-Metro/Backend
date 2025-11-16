// File: app.js

// 1. Impor package
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Merujuk ke models/index.js

// 2. Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Pasang Middleware
app.use(cors()); 
app.use(express.json()); 

// 4. Test Route
app.get('/api/v1/test', (req, res) => {
  res.status(200).json({ 
    message: 'API Backend Lentera Karir Berhasil!' 
  });
});

// 5. Pasang Routes 
    const authRoutes = require('./src/routes/authRoutes');
    app.use('/api/v1/auth', authRoutes);

    const learningPathRoutes = require('./src/routes/learningPathRoutes');
    app.use('/api/v1/admin/learning-paths', learningPathRoutes);

    const courseModuleRoutes = require('./src/routes/courseModuleRoutes');
    app.use('/api/v1/admin', courseModuleRoutes); 
    
    const quizRoutes = require('./src/routes/quizRoutes');
    app.use('/api/v1/admin', quizRoutes);

    const userManagementRoutes = require('./src/routes/userManagementRoutes');
    app.use('/api/v1/admin', userManagementRoutes);

    const webhookRoutes = require('./src/routes/webhookRoutes');
    app.use('/api/v1', webhookRoutes);

    const publicRoutes = require('./src/routes/publicRoutes');
    app.use('/api/v1', publicRoutes); 

    const paymentRoutes = require('./src/routes/paymentRoutes');
    app.use('/api/v1', paymentRoutes);

    const learningRoutes = require('./src/routes/learningRoutes');
    app.use('/api/v1', learningRoutes);

// 6. Jalankan Server & Tes Koneksi Database
app.listen(PORT, async () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  
  try {
    await db.sequelize.authenticate();
    console.log('Koneksi ke database MySQL (database_lentera_karir) BERHASIL.');
  } catch (error) {
    console.error('Koneksi ke database GAGAL:', error);
  }
});