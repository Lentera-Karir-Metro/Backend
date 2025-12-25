// File: migrations/202511160007-create-user-enrollment.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'UserEnrollments'.
   * Tabel ini adalah *junction table* (tabel penghubung) yang krusial,
   * mencatat 'bukti pembelian' atau pendaftaran seorang 'User' ke sebuah 'LearningPath'.
   *
   * Record di sini akan dibuat oleh webhook Midtrans atau
   * secara manual oleh admin.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserEnrollments', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: EN-XXXXXX)
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' }, // Foreign Key ke tabel Users
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika User dihapus, data enrollment-nya ikut terhapus
      },
      learning_path_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'LearningPaths', key: 'id' }, // Foreign Key ke tabel LearningPaths
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Jika LearningPath dihapus, data enrollment-nya ikut terhapus
      },
      midtrans_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true, // ID transaksi dari Midtrans. Nullable untuk pendaftaran manual oleh admin.
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'), // Status pembayaran
        allowNull: false,
        defaultValue: 'pending',
      },
      enrolled_at: {
        type: Sequelize.DATE,
        allowNull: true, // Diisi dengan timestamp saat status menjadi 'success'
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

    // Tambahkan constraint UNIQUE agar user tidak bisa enroll 2x di path yg sama
    await queryInterface.addConstraint('UserEnrollments', {
      fields: ['user_id', 'learning_path_id'],
      type: 'unique',
      name: 'user_learning_path_unique_constraint'
    });
  },

  /**
   * Fungsi 'down' dieksekusi ketika migrasi dibatalkan (rollback).
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'UserEnrollments'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserEnrollments');
  }
};