'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('Certificates');
    if (!tableDesc['course_id']) {
      await queryInterface.addColumn('Certificates', 'course_id', {
        type: Sequelize.STRING(16),
        allowNull: true,
        references: { model: 'Courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!tableDesc['status']) {
      await queryInterface.addColumn('Certificates', 'status', {
        type: Sequelize.ENUM('pending','generated'),
        allowNull: false,
        defaultValue: 'pending'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('Certificates');
    if (tableDesc['status']) {
      await queryInterface.removeColumn('Certificates', 'status');
      // Drop enum type if exists (Postgres) - noop for MySQL
    }
    if (tableDesc['course_id']) {
      await queryInterface.removeColumn('Certificates', 'course_id');
    }
  }
};
