'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom learning_path_id jika ada
    const tableDesc = await queryInterface.describeTable('UserEnrollments');
    if (tableDesc['learning_path_id']) {
      await queryInterface.removeColumn('UserEnrollments', 'learning_path_id');
    }
  },

  async down(queryInterface, Sequelize) {
    // Restore kolom learning_path_id sebagai nullable (agar rollback aman)
    const tableDesc = await queryInterface.describeTable('UserEnrollments');
    if (!tableDesc['learning_path_id']) {
      await queryInterface.addColumn('UserEnrollments', 'learning_path_id', {
        type: Sequelize.STRING(16),
        allowNull: true,
        references: { model: 'LearningPaths', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  }
};
