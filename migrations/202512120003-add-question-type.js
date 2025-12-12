'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Questions', 'question_type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'multiple_choice', // Default ke pilihan ganda
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Questions', 'question_type');
  }
};
