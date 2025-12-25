// File: migrations/202511160001-create-learning-path.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LearningPaths', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16),
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00, // Default 0 (Tidak ada diskon)
      },
      rating: {
        type: Sequelize.FLOAT(2, 1), // Tipe Float (misal: 4.5)
        allowNull: false,
        defaultValue: 0.0,
      },
      review_count: {
        type: Sequelize.INTEGER, // Tipe Angka Bulat (misal: 120)
        allowNull: false,
        defaultValue: 0,
      },
      category: {
        type: Sequelize.STRING, // Contoh isi: "Programming", "Design", "Marketing"
        allowNull: false,
        defaultValue: "General",
      },
      level: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Beginner",
      },
      mentor_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mentor_title: {
        type: Sequelize.STRING, // Contoh: "Product Manager at Gojek"
        allowNull: true,
      },
      mentor_avatar_url: {
        type: Sequelize.STRING, // Link foto mentor
        allowNull: true,
      },
      // --------------------------------
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LearningPaths');
  }
};