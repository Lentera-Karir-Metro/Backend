'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('LearningPaths', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'published',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('LearningPaths', 'status');
  }
};
