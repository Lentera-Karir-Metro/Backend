// File: models/userquizanswer.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model UserQuizAnswer
   * Merepresentasikan jawaban parsial/final yang diberikan oleh pengguna
   * untuk satu pertanyaan dalam satu sesi pengerjaan kuis (UserQuizAttempt).
   *
   * Ini adalah inti dari fitur "resume kuis", yang memungkinkan progres
   * disimpan saat pengguna menekan "Selanjutnya" atau "Sebelumnya" di frontend.
   */
  class UserQuizAnswer extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Jawaban ini adalah bagian dari (belongsTo) satu Sesi Kuis (Attempt)
      UserQuizAnswer.belongsTo(models.UserQuizAttempt, { foreignKey: 'user_quiz_attempt_id' });
      // Jawaban ini merujuk pada (belongsTo) satu Pertanyaan (Question)
      UserQuizAnswer.belongsTo(models.Question, { foreignKey: 'question_id' });
      // Jawaban ini merujuk pada (belongsTo) satu Opsi (Option) yang dipilih
      UserQuizAnswer.belongsTo(models.Option, { foreignKey: 'selected_option_id' });
    }
  }

  /**
   * Inisialisasi model UserQuizAnswer dengan skema database.
   */
  UserQuizAnswer.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true, // Menggunakan ID standar
      primaryKey: true,
    },
    user_quiz_attempt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'UserQuizAttempts', key: 'id' }, // Relasi ke sesi kuis
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika sesi attempt dihapus, jawaban di dalamnya ikut terhapus
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Questions', key: 'id' }, // Relasi ke pertanyaan
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    selected_option_id: {
      type: DataTypes.INTEGER,
      allowNull: false, // Required untuk semua soal
      references: { model: 'Options', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  }, {
    sequelize,
    modelName: 'UserQuizAnswer',
    
    // --- Konfigurasi Timestamps ---
    // Kita secara eksplisit HANYA mengaktifkan 'updatedAt'.
    // 'createdAt' tidak diperlukan, karena kita hanya peduli kapan
    // jawaban terakhir disimpan/diubah (untuk fitur 'upsert' jawaban parsial).
    timestamps: true,
    updatedAt: true,
    createdAt: false, 
  });
  return UserQuizAnswer;
};