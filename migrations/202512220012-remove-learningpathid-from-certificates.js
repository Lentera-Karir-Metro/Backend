'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove legacy unique constraint on user+learning_path if present
    try {
      await queryInterface.removeConstraint('Certificates', 'user_learning_path_certificate_unique');
    } catch (err) {
      // ignore if not exists
    }

    // Remove learning_path_id column if exists
    const tableDesc = await queryInterface.describeTable('Certificates');
    if (tableDesc['learning_path_id']) {
      await queryInterface.removeColumn('Certificates', 'learning_path_id');
    }

    // Add unique constraint on user_id + course_id to prevent duplicate certs per course
    if (tableDesc['course_id']) {
      try {
        await queryInterface.addConstraint('Certificates', {
          fields: ['user_id', 'course_id'],
          type: 'unique',
          name: 'user_course_certificate_unique'
        });
      } catch (err) {
        // ignore if already exists
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove new constraint if exists
    try {
      await queryInterface.removeConstraint('Certificates', 'user_course_certificate_unique');
    } catch (err) {
      // ignore
    }

    // Re-add learning_path_id column (nullable) and restore old unique constraint
    const tableDesc = await queryInterface.describeTable('Certificates');
    if (!tableDesc['learning_path_id']) {
      await queryInterface.addColumn('Certificates', 'learning_path_id', {
        type: Sequelize.STRING(16),
        allowNull: true,
        references: { model: 'LearningPaths', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    try {
      await queryInterface.addConstraint('Certificates', {
        fields: ['user_id', 'learning_path_id'],
        type: 'unique',
        name: 'user_learning_path_certificate_unique'
      });
    } catch (err) {
      // ignore if exists
    }
  }
};
