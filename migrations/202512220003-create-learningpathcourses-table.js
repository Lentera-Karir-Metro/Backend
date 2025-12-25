"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LearningPathCourses', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(24)
      },
      learning_path_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'LearningPaths', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      course_id: {
        type: Sequelize.STRING(16),
        allowNull: false,
        references: { model: 'Courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LearningPathCourses');
  }
};
