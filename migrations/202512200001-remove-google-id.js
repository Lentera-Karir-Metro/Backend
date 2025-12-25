'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Menghapus kolom google_id karena fitur Google Auth & Supabase Auth sudah dihapus
    await queryInterface.removeColumn('Users', 'google_id');
  },

  async down (queryInterface, Sequelize) {
    // Jika rollback, kembalikan kolom google_id
    await queryInterface.addColumn('Users', 'google_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  }
};
