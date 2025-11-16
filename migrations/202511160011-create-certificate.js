// File: migrations/202511160011-create-certificate.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Certificates', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16),
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      learning_path_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'LearningPaths', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      total_hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      certificate_url: {
        type: Sequelize.STRING,
        allowNull: true,
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

    // Constraint: 1 User hanya bisa dapat 1 Sertifikat per Learning Path
    await queryInterface.addConstraint('Certificates', {
      fields: ['user_id', 'learning_path_id'],
      type: 'unique',
      name: 'user_learning_path_certificate_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Certificates');
  }
};