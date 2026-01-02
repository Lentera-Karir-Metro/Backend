'use strict';

/**
 * Migration untuk membuat tabel Mentors dan menambahkan kolom mentor_id ke tabel Courses.
 * Sistem mentor dinamis untuk menggantikan data mentor statis di Course.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Buat tabel Mentors
        await queryInterface.createTable('Mentors', {
            id: {
                type: Sequelize.STRING(16),
                primaryKey: true,
                allowNull: false
            },
            name: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            title: {
                type: Sequelize.STRING(150),
                allowNull: true,
                comment: 'Jabatan/pekerjaan mentor'
            },
            photo_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            bio: {
                type: Sequelize.TEXT,
                allowNull: true
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

        // 2. Tambahkan kolom mentor_id ke tabel Courses
        await queryInterface.addColumn('Courses', 'mentor_id', {
            type: Sequelize.STRING(16),
            allowNull: true,
            references: {
                model: 'Mentors',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        console.log('✅ Migration berhasil: Tabel Mentors dibuat dan kolom mentor_id ditambahkan ke Courses');
    },

    async down(queryInterface, Sequelize) {
        // Rollback: Hapus kolom dan tabel
        await queryInterface.removeColumn('Courses', 'mentor_id');
        await queryInterface.dropTable('Mentors');

        console.log('✅ Rollback berhasil: Kolom mentor_id dihapus dan tabel Mentors di-drop');
    }
};
