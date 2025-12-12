'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Quizzes', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('Quizzes', 'duration_minutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 artinya tidak ada batas waktu
    });
    await queryInterface.addColumn('Quizzes', 'max_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 = Unlimited attempts
    });
    await queryInterface.addColumn('Quizzes', 'sequence_order', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Quizzes', 'description');
    await queryInterface.removeColumn('Quizzes', 'duration_minutes');
    await queryInterface.removeColumn('Quizzes', 'max_attempts');
    await queryInterface.removeColumn('Quizzes', 'sequence_order');
  }
};
