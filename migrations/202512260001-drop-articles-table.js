'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Drop articles table
        await queryInterface.dropTable('articles');
    },

    async down(queryInterface, Sequelize) {
        // This is a destructive migration - cannot be undone
        // If needed, recreate the articles table here
    }
};
