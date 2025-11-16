// File: migrations/202511160009-create-user-quiz-attempt.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'UserQuizAttempts'.
   * Tabel ini mencatat setiap "sesi" atau "upaya" pengerjaan kuis oleh pengguna.
   * Sebuah record baru dibuat setiap kali pengguna memulai kuis,
   * memungkinkan fitur 'retake' (mengulang).
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserQuizAttempts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER // Menggunakan ID integer standar
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' }, // Foreign Key ke tabel Users
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quiz_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Quizzes', key: 'id' }, // Foreign Key ke tabel Quizzes
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed'), // Status pengerjaan
        allowNull: false,
        defaultValue: 'in_progress', // Default 'in_progress' saat kuis dimulai
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: true, // Skor akhir, diisi saat status 'completed'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW, // Waktu kuis dimulai
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true, // Waktu kuis disubmit dan selesai
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  /**
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'UserQuizAttempts'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserQuizAttempts');
  }
};