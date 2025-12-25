'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Certificates', 'recipient_name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Certificates', 'course_title', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    // Make user_id and learning_path_id nullable
    await queryInterface.changeColumn('Certificates', 'user_id', {
      type: Sequelize.STRING(16),
      allowNull: true
    });
    await queryInterface.changeColumn('Certificates', 'learning_path_id', {
      type: Sequelize.STRING(16),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Certificates', 'recipient_name');
    await queryInterface.removeColumn('Certificates', 'course_title');
    
    // Revert nullable (might fail if data exists with nulls, but for down migration it's ok to try)
    // Note: In real prod, we'd need to be careful here.
  }
};
