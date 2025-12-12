'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambahkan kembali kolom quiz_id ke tabel Modules
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
  },

  async down(queryInterface, Sequelize) {
    // Hapus kolom quiz_id dari tabel Modules
    await queryInterface.removeColumn('Modules', 'quiz_id');
  }
};
