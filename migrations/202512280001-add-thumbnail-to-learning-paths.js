'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('LearningPaths', 'thumbnail', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'URL gambar thumbnail untuk learning path',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('LearningPaths', 'thumbnail');
  }
};
