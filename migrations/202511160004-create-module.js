// File: migrations/202511160004-create-module.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'Modules'.
   * 'Module' adalah unit pembelajaran terkecil (misal: 1 video, 1 ebook, atau 1 kuis).
   * (Hierarki: LearningPath -> Course -> Module)
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Modules', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: MD-XXXXXX)
      },
      course_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: {
          model: 'Courses', // Nama tabel induk
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika Course dihapus, Modul di dalamnya ikut terhapus
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false, // Judul Modul (misal: "Instalasi Video Player")
      },
      module_type: {
        type: Sequelize.ENUM('video', 'ebook', 'quiz'), // Tipe modul
        allowNull: false,
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0, // Urutan modul di dalam course, untuk logika penguncian
      },
      video_url: {
        type: Sequelize.STRING,
        allowNull: true, // Diisi jika module_type = 'video' (URL dari Supabase Storage)
      },
      ebook_url: {
        type: Sequelize.STRING,
        allowNull: true, // Diisi jika module_type = 'ebook' (URL dari Supabase Storage)
      },
      quiz_id: {
        type: Sequelize.STRING(16),
        allowNull: true,
        references: {
          model: 'Quizzes', // Terhubung ke tabel Quizzes (dibuat di migrasi 0003)
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Jika Kuis dihapus, jangan hapus Modul-nya
      },
      durasi_video_menit: {
        type: Sequelize.INTEGER,
        allowNull: true, // Durasi video (diisi admin)
      },
      estimasi_waktu_menit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0, // Estimasi pengerjaan (diisi admin)
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
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'Modules'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Modules');
  }
};