// File: migrations/202511160000-create-user.js
'use strict';

/**
 * @typedef {import('sequelize').QueryInterface} QueryInterface
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = {
  /**
   * Fungsi 'up' dieksekusi ketika migrasi dijalankan.
   * Fungsi ini bertanggung jawab untuk membuat tabel 'Users'
   * beserta semua kolom dan constraint-nya.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16), // ID Kustom (misal: LT-XXXXXX)
      },
      supabase_auth_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Kunci unik untuk sinkronisasi dengan Supabase Auth
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false, // Diambil dari 'username' saat sinkronisasi
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user', // Semua pendaftaran baru otomatis 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active', // Untuk fitur nonaktifkan user oleh admin
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
   * Fungsi ini bertanggung jawab untuk menghapus tabel 'Users'.
   *
   * @param {QueryInterface} queryInterface - Interface Query Sequelize
   * @param {Sequelize} Sequelize - Pustaka Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};