'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Users', 'supabase_auth_id', 'google_id');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('Users', 'google_id', 'supabase_auth_id');
  }
};
