// File: seeders/202511160100-admin-seeder.js
'use strict';
const { generateCustomId } = require('../src/utils/idGenerator');
const bcrypt = require('bcryptjs');

// ====================================================================
// === KONFIGURASI ADMIN ===
// ####################################################################

const ADMIN_EMAIL = "daffaraelanaqiali30@gmail.com";
const ADMIN_USERNAME = "Admin Daffarael";
const ADMIN_PASSWORD = "yaaadaffa"; // Password default jika user belum ada

// ####################################################################

module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password terlebih dahulu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 1. Cek apakah user dengan email ini sudah ada
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT id FROM Users WHERE email = '${ADMIN_EMAIL}' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingUsers.length > 0) {
      // 2. Jika sudah ada (misal daftar manual), UPDATE role DAN PASSWORD
      console.log(`User ${ADMIN_EMAIL} sudah ada. Mengupdate role dan password...`);
      await queryInterface.bulkUpdate('Users', 
        { 
          role: 'admin',
          password: hashedPassword, // <-- Paksa update password agar sesuai dengan seeder
          is_verified: true, 
          updatedAt: new Date()
        },
        { email: ADMIN_EMAIL }
      );
    } else {
      // 3. Jika belum ada, INSERT user baru sebagai admin
      console.log(`User ${ADMIN_EMAIL} belum ada. Membuat user admin baru...`);
      
      // Generate ID
      let adminUserId;
      try {
          adminUserId = generateCustomId('LT');
      } catch (e) {
          adminUserId = `LT-${Date.now()}`;
      }

      await queryInterface.bulkInsert('Users', [{
        id: adminUserId,
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        is_verified: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  async down (queryInterface, Sequelize) {
    // Kembalikan role jadi user biasa (opsional) atau hapus
    // Di sini kita hapus saja jika emailnya cocok
    await queryInterface.bulkDelete('Users', { email: ADMIN_EMAIL }, {});
  }
};