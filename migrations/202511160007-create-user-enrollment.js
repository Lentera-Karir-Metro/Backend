// File: migrations/202511160007-create-user-enrollment.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserEnrollments', {
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
      midtrans_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      enrolled_at: {
        type: Sequelize.DATE,
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

    // Tambahkan constraint UNIQUE agar user tidak bisa enroll 2x di path yg sama
    await queryInterface.addConstraint('UserEnrollments', {
      fields: ['user_id', 'learning_path_id'],
      type: 'unique',
      name: 'user_learning_path_unique_constraint'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserEnrollments');
  }
};