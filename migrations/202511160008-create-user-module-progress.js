// File: migrations/202511160008-create-user-module-progress.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserModuleProgresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      module_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Modules', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    // Tambahkan constraint UNIQUE agar user tidak bisa menyelesaikan 1 modul 2x
    await queryInterface.addConstraint('UserModuleProgresses', {
      fields: ['user_id', 'module_id'],
      type: 'unique',
      name: 'user_module_unique_constraint'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserModuleProgresses');
  }
};