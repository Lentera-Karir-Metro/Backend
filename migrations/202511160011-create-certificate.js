// File: migrations/202511160011-create-certificate.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'Certificates'.
   * Tabel ini menyimpan data sertifikat yang di-generate secara otomatis
   * ketika seorang pengguna berhasil menyelesaikan seluruh modul (100%)
   * dalam sebuah 'LearningPath'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Certificates', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: CERT-XXXXXX)
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' }, // Foreign Key ke tabel Users
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      learning_path_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'LearningPaths', key: 'id' }, // Foreign Key ke tabel LearningPaths
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW, // Tanggal sertifikat diterbitkan
      },
      total_hours: {
        type: Sequelize.INTEGER,
        allowNull: false, // Akumulasi (SUM) dari 'estimasi_waktu_menit' semua modul
      },
      certificate_url: {
        type: Sequelize.STRING,
        allowNull: true, // URL publik ke file/halaman sertifikat (jika ada PDF fisik)
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

    // Constraint: Mencegah user mendapatkan sertifikat ganda untuk course yang sama
    await queryInterface.addConstraint('Certificates', {
      fields: ['user_id', 'learning_path_id'],
      type: 'unique',
      name: 'user_learning_path_certificate_unique'
    });
  },

  /**
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'Certificates'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Certificates');
  }
};