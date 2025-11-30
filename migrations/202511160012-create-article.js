// File: migrations/202511160012-create-article.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Articles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT('long'), allowNull: false }, // Isi artikel panjang
      thumbnail_url: { type: Sequelize.STRING },
      author: { type: Sequelize.STRING, defaultValue: 'Admin' },
      category: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Articles');
  }
};