'use strict';

/**
 * Migration untuk menambahkan unique constraint pada user_id + course_id
 * dan menghapus constraint lama jika masih ada.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Hapus old unique constraint jika masih ada
        try {
            await queryInterface.removeConstraint('UserEnrollments', 'user_learning_path_unique_constraint');
            console.log('Removed old constraint: user_learning_path_unique_constraint');
        } catch (e) {
            console.warn('Constraint user_learning_path_unique_constraint not found, skipping.');
        }

        // 2. Hapus constraint user_course_unique_constraint jika sudah ada (untuk idempotency)
        try {
            await queryInterface.removeConstraint('UserEnrollments', 'user_course_unique_constraint');
            console.log('Removed existing constraint: user_course_unique_constraint');
        } catch (e) {
            console.warn('Constraint user_course_unique_constraint not found, skipping.');
        }

        // 3. Tambahkan unique constraint baru untuk user_id + course_id
        await queryInterface.addConstraint('UserEnrollments', {
            fields: ['user_id', 'course_id'],
            type: 'unique',
            name: 'user_course_unique_constraint'
        });
        console.log('Added new constraint: user_course_unique_constraint');
    },

    async down(queryInterface, Sequelize) {
        // Hapus constraint user_course_unique_constraint
        try {
            await queryInterface.removeConstraint('UserEnrollments', 'user_course_unique_constraint');
        } catch (e) {
            console.warn('Constraint user_course_unique_constraint not found during rollback.');
        }
    }
};
