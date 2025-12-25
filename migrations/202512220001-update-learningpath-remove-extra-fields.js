"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom yang tidak diperlukan pada LearningPaths
    const table = 'LearningPaths';
    const removeIfExists = async (col) => {
      const tableDesc = await queryInterface.describeTable(table);
      if (tableDesc[col]) await queryInterface.removeColumn(table, col);
    };

    await removeIfExists('price');
    await removeIfExists('thumbnail_url');
    await removeIfExists('discount_amount');
    await removeIfExists('rating');
    await removeIfExists('review_count');
    await removeIfExists('category');
    await removeIfExists('level');
    await removeIfExists('mentor_name');
    await removeIfExists('mentor_title');
    await removeIfExists('mentor_avatar_url');
    await removeIfExists('status');
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan kolom (nilai default disesuaikan dengan skema sebelumnya)
    await queryInterface.addColumn('LearningPaths', 'price', { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 });
    await queryInterface.addColumn('LearningPaths', 'thumbnail_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('LearningPaths', 'discount_amount', { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 });
    await queryInterface.addColumn('LearningPaths', 'rating', { type: Sequelize.FLOAT(2,1), allowNull: false, defaultValue: 0.0 });
    await queryInterface.addColumn('LearningPaths', 'review_count', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    await queryInterface.addColumn('LearningPaths', 'category', { type: Sequelize.STRING, allowNull: false, defaultValue: 'General' });
    await queryInterface.addColumn('LearningPaths', 'level', { type: Sequelize.STRING, allowNull: false, defaultValue: 'Beginner' });
    await queryInterface.addColumn('LearningPaths', 'mentor_name', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('LearningPaths', 'mentor_title', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('LearningPaths', 'mentor_avatar_url', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('LearningPaths', 'status', { type: Sequelize.STRING, allowNull: true, defaultValue: 'published' });
  }
};
