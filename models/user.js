// File: models/user.js
'use strict';
const { Model } = require('sequelize');
// Impor helper untuk membuat ID kustom (misal: LT-XXXXXX)
const { generateCustomId } = require('../src/utils/idGenerator'); 

module.exports = (sequelize, DataTypes) => {
  /**
   * Model User
   * Merepresentasikan data pengguna di dalam database *backend* kita (MySQL).
   * Data ini disinkronkan dengan Supabase Auth melalui 'supabase_auth_id'.
   */
  class User extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Seorang User dapat terdaftar (belongsToMany) di banyak LearningPath
      // melalui tabel 'UserEnrollment'
      User.belongsToMany(models.LearningPath, {
        through: models.UserEnrollment, // Menggunakan model UserEnrollment sebagai tabel perantara
        foreignKey: 'user_id',
        as: 'enrolledLearningPaths', // Alias untuk relasi
      });

      // Seorang User memiliki (hasMany) banyak Progres Modul
      User.hasMany(models.UserModuleProgress, {
        foreignKey: 'user_id',
        as: 'moduleProgresses', // Alias untuk relasi
      });

      // Seorang User memiliki (hasMany) banyak Upaya Pengerjaan Kuis
      User.hasMany(models.UserQuizAttempt, {
        foreignKey: 'user_id',
        as: 'quizAttempts', // Alias untuk relasi
      });

      // Seorang User memiliki (hasMany) banyak Sertifikat
      User.hasMany(models.Certificate, {
        foreignKey: 'user_id',
        as: 'certificates', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model User dengan skema database.
   */
  User.init({
    id: {
      type: DataTypes.STRING(16), // Sesuai spesifikasi VARCHAR(16)
      allowNull: false,
      primaryKey: true, 
      unique: true,
    },
    supabase_auth_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Kunci vital untuk sinkronisasi dengan Supabase Auth
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }, // Validasi format email
    },
    nama_lengkap: {
      type: DataTypes.STRING,
      allowNull: false, // Diambil dari 'username' Supabase saat sinkronisasi
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user', // Pendaftaran baru otomatis 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active', // Untuk fitur nonaktifkan user oleh admin
    },
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    
    // Definisikan 'hook' (fungsi) yang berjalan otomatis
    hooks: {
      /**
       * Hook 'beforeCreate' berjalan otomatis sebelum record baru disimpan ke DB.
       * Kita gunakan untuk men-generate ID kustom (LT-XXXXXX).
       * @param {User} user - Instance user yang akan dibuat
       */
      beforeCreate: (user, options) => {
        user.id = generateCustomId('LT'); // Prefix 'LT'
      },
    },
  });
  return User;
};