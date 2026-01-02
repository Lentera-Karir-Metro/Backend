'use strict';

/**
 * Migration untuk membuat tabel Categories dan menambahkan kolom category_id ke tabel Courses.
 * Sistem kategori dinamis untuk menggantikan kategori statis sebelumnya.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Buat tabel Categories
        await queryInterface.createTable('Categories', {
            id: {
                type: Sequelize.STRING(16),
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            icon: {
                type: Sequelize.STRING(50),
                allowNull: true,
                defaultValue: 'folder'
            },
            color: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '#6B21FF'
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive'),
                allowNull: false,
                defaultValue: 'active'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // 2. Tambahkan kolom category_id ke tabel Courses
        await queryInterface.addColumn('Courses', 'category_id', {
            type: Sequelize.STRING(16),
            allowNull: true,
            references: {
                model: 'Categories',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        console.log('✅ Migration berhasil: Tabel Categories dibuat dan kolom category_id ditambahkan ke Courses');
    },

    async down(queryInterface, Sequelize) {
        // Rollback: Hapus kolom dan tabel
        await queryInterface.removeColumn('Courses', 'category_id');
        await queryInterface.dropTable('Categories');

        console.log('✅ Rollback berhasil: Kolom category_id dihapus dan tabel Categories di-drop');
    }
};
