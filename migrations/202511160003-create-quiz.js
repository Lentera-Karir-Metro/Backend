// File: migrations/202511160004-create-quiz.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Quizzes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(16),
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pass_threshold: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.75,
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
    await queryInterface.dropTable('Quizzes');
  }
};
