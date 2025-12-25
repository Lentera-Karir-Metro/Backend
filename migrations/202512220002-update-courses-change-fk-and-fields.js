"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom learning_path_id (pindah ke tabel join) dan sequence_order
    const table = 'Courses';
    const tableDesc = await queryInterface.describeTable(table);
    if (tableDesc['learning_path_id']) {
      await queryInterface.removeColumn(table, 'learning_path_id');
    }
    if (tableDesc['sequence_order']) {
      await queryInterface.removeColumn(table, 'sequence_order');
    }

    // Tambahkan kolom baru sesuai permintaan
    if (!tableDesc['price']) {
      await queryInterface.addColumn(table, 'price', { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 });
    }
    if (!tableDesc['thumbnail_url']) {
      await queryInterface.addColumn(table, 'thumbnail_url', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc['discount_amount']) {
      await queryInterface.addColumn(table, 'discount_amount', { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 });
    }
    if (!tableDesc['category']) {
      await queryInterface.addColumn(table, 'category', { type: Sequelize.STRING, allowNull: false, defaultValue: 'All' });
    }
    if (!tableDesc['mentor_name']) {
      await queryInterface.addColumn(table, 'mentor_name', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc['mentor_title']) {
      await queryInterface.addColumn(table, 'mentor_title', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc['mentor_photo_profile']) {
      await queryInterface.addColumn(table, 'mentor_photo_profile', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc['status']) {
      await queryInterface.addColumn(table, 'status', { type: Sequelize.STRING, allowNull: false, defaultValue: 'published' });
    }
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan perubahan: tambahkan kembali learning_path_id dan sequence_order
    const table = 'Courses';
    const tableDesc = await queryInterface.describeTable(table);
    if (!tableDesc['learning_path_id']) {
      await queryInterface.addColumn(table, 'learning_path_id', { type: Sequelize.STRING(16), allowNull: true });
    }
    if (!tableDesc['sequence_order']) {
      await queryInterface.addColumn(table, 'sequence_order', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    }

    // Hapus kolom yang ditambahkan
    const toRemove = ['price','thumbnail_url','discount_amount','category','mentor_name','mentor_title','mentor_photo_profile','status'];
    for (const col of toRemove) {
      const desc = await queryInterface.describeTable(table);
      if (desc[col]) await queryInterface.removeColumn(table, col);
    }
  }
};
