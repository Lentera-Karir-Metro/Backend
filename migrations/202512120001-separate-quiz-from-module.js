'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tambahkan kolom course_id ke tabel Quizzes
    await queryInterface.addColumn('Quizzes', 'course_id', {
      type: Sequelize.STRING(16),
      allowNull: true,
      references: {
        model: 'Courses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 2. Hapus kolom quiz_id dari tabel Modules
    // Kita cek dulu apakah kolomnya ada biar aman
    const tableInfo = await queryInterface.describeTable('Modules');
    if (tableInfo.quiz_id) {
      await queryInterface.removeColumn('Modules', 'quiz_id');
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Hapus kolom course_id dari tabel Quizzes
    await queryInterface.removeColumn('Quizzes', 'course_id');

    // 2. Kembalikan kolom quiz_id ke tabel Modules
    await queryInterface.addColumn('Modules', 'quiz_id', {
      type: Sequelize.STRING(16),
      allowNull: true,
      references: {
        model: 'Quizzes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
};
