// File: models/userquizattempt.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model UserQuizAttempt
   * Merepresentasikan setiap "sesi" atau "upaya" pengerjaan kuis oleh pengguna.
   * Ini adalah tabel utama untuk melacak status kuis (sedang dikerjakan/selesai), skor akhir, 
   * dan memungkinkan fitur 'retake' (mengulang kuis berkali-kali).
   */
  class UserQuizAttempt extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Sesi ini dimiliki oleh (belongsTo) satu User
      UserQuizAttempt.belongsTo(models.User, { foreignKey: 'user_id' });
      // Sesi ini merujuk pada (belongsTo) satu Quiz Master
      UserQuizAttempt.belongsTo(models.Quiz, { foreignKey: 'quiz_id' });

      // Satu sesi attempt memiliki (hasMany) banyak jawaban parsial (UserQuizAnswer)
      UserQuizAttempt.hasMany(models.UserQuizAnswer, {
        foreignKey: 'user_quiz_attempt_id',
        as: 'answers', // Alias untuk relasi
      });
    }
  }

  /**
   * Inisialisasi model UserQuizAttempt dengan skema database.
   */
  UserQuizAttempt.init({
    id: { // Menggunakan ID integer standar (AUTO_INCREMENT)
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    quiz_id: {
      type: DataTypes.STRING(16),
      allowNull: false,
      references: { model: 'Quizzes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'), // Status sesi kuis
      allowNull: false,
      defaultValue: 'in_progress', // Default: siap untuk dikerjakan/dilanjutkan
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true, // Skor akhir, baru diisi saat status diubah menjadi 'completed'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Waktu sesi kuis dimulai
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true, // Waktu kuis disubmit
    },
  }, {
    sequelize,
    modelName: 'UserQuizAttempt',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    // Tidak ada hook 'beforeCreate' karena ID sudah auto-increment
  });
  return UserQuizAttempt;
};