// File: seeders/202511160100-admin-seeder.js
'use strict';
const { generateCustomId } = require('../src/utils/idGenerator');

// ####################################################################
// ###           MASUKKAN SUPABASE UID ANDA DI BAWAH INI            ###
// ####################################################################

const ADMIN_SUPABASE_UID = "1ff603bd-c820-4251-a49c-f8437ec6f713";
const ADMIN_EMAIL = "admin@lenterakarir.com"; // Ganti jika email Anda beda
const ADMIN_NAME = "Admin Lentera Karir";

// ####################################################################

module.exports = {
  async up (queryInterface, Sequelize) {
    if (!ADMIN_SUPABASE_UID || ADMIN_SUPABASE_UID === "PASTE_UID_ANDA_DARI_SUPABASE_DI_SINI") {
      throw new Error("Harap masukkan ADMIN_SUPABASE_UID di file seeder/202511160100-admin-seeder.js");
    }

    // Menjalankan seed akan memaksa user di MySQL
    // menjadi 'admin' yang tertaut ke UID Supabase.

    // Kita gunakan 'upsert' (update or insert)
    // Jika user-nya sudah ada (misal sudah pernah sync), akan di-update jadi admin.
    // Jika belum, akan dibuatkan user baru dengan role admin.

    const adminUserId = generateCustomId('LT'); // Buat ID LT-XXXXXX

    await queryInterface.bulkInsert('Users', [
      {
        id: adminUserId,
        supabase_auth_id: ADMIN_SUPABASE_UID,
        email: ADMIN_EMAIL,
        nama_lengkap: ADMIN_NAME,
        role: 'admin', // <-- Ini adalah kuncinya
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {
      // Jika ada konflik (supabase_auth_id sudah ada), update role-nya
      updateOnDuplicate: ['role', 'updatedAt'] 
    });
  },

  async down (queryInterface, Sequelize) {
    // Hapus admin yang di-seed
    await queryInterface.bulkDelete('Users', {
      supabase_auth_id: ADMIN_SUPABASE_UID
    }, {});
  }
};