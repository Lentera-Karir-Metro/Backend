// File: migrations/202511160010-create-user-quiz-answer.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'UserQuizAnswers'.
   * Tabel ini menyimpan jawaban parsial pengguna selama sesi kuis (attempt).
   * Ini adalah inti dari fitur "resume kuis", yang menyimpan progres
   * saat pengguna menekan tombol "Selanjutnya" atau "Sebelumnya".
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserQuizAnswers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER // Menggunakan ID integer standar
      },
      user_quiz_attempt_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'UserQuizAttempts', key: 'id' }, // Foreign Key ke sesi kuis
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika sesi attempt dihapus, jawaban di dalamnya ikut terhapus
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Questions', key: 'id' }, // Foreign Key ke pertanyaan
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      selected_option_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Options', key: 'id' }, // Foreign Key ke opsi yang dipilih pengguna
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Tidak ada 'createdAt', karena kita hanya peduli kapan jawaban terakhir diubah
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Constraint: User hanya bisa menjawab 1x per pertanyaan per sesi kuis
    await queryInterface.addConstraint('UserQuizAnswers', {
      fields: ['user_quiz_attempt_id', 'question_id'],
      type: 'unique',
      name: 'user_attempt_question_unique_constraint'
    });
  },

  /**
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'UserQuizAnswers'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserQuizAnswers');
  }
};