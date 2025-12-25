"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'LearningPathCourses';
    const tableDesc = await queryInterface.describeTable(table);
    if (!tableDesc['sequence_order']) {
      await queryInterface.addColumn(table, 'sequence_order', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'LearningPathCourses';
    const tableDesc = await queryInterface.describeTable(table);
    if (tableDesc['sequence_order']) {
      await queryInterface.removeColumn(table, 'sequence_order');
    }
  }
};
