// File: migrations/202511160003-create-module.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Modules', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16),
      },
      course_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: {
          model: 'Courses', // Nama tabel
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      module_type: {
        type: Sequelize.ENUM('video', 'ebook', 'quiz'),
        allowNull: false,
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      video_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ebook_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      quiz_id: {
        type: Sequelize.STRING(16),
            allowNull: true,
            references: { 
              model: 'Quizzes', 
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
      },
      durasi_video_menit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      estimasi_waktu_menit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Modules');
  }
};