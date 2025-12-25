"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hapus unique constraint lama (user_learning_path_unique_constraint)
    try {
      await queryInterface.removeConstraint('UserEnrollments', 'user_learning_path_unique_constraint');
    } catch (e) {
      // Ignore jika tidak ada
      console.warn('Constraint user_learning_path_unique_constraint not found or already removed.');
    }

    // 2. Ubah learning_path_id menjadi nullable
    await queryInterface.changeColumn('UserEnrollments', 'learning_path_id', {
      type: Sequelize.STRING(16),
      allowNull: true,
      references: { model: 'LearningPaths', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 3. Tambahkan kolom course_id (nullable)
    const tableDesc = await queryInterface.describeTable('UserEnrollments');
    if (!tableDesc['course_id']) {
      await queryInterface.addColumn('UserEnrollments', 'course_id', {
        type: Sequelize.STRING(16),
        allowNull: true,
        references: { model: 'Courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert: hapus kolom course_id, set learning_path_id NOT NULL, dan restore unique constraint
    const tableDesc = await queryInterface.describeTable('UserEnrollments');
    if (tableDesc['course_id']) {
      await queryInterface.removeColumn('UserEnrollments', 'course_id');
    }

    await queryInterface.changeColumn('UserEnrollments', 'learning_path_id', {
      type: Sequelize.STRING(16),
      allowNull: false,
      references: { model: 'LearningPaths', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Restore unique constraint (tolerant if already exists)
    try {
      await queryInterface.addConstraint('UserEnrollments', {
        fields: ['user_id', 'learning_path_id'],
        type: 'unique',
        name: 'user_learning_path_unique_constraint'
      });
    } catch (e) {
      console.warn('Constraint user_learning_path_unique_constraint already exists, skipping restore.');
    }
  }
};
