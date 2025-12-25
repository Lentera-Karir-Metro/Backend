'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Modules', 'module_type');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Modules', 'module_type', {
            type: Sequelize.ENUM('video', 'ebook', 'quiz'),
            allowNull: true // changed to true just in case
        });
    }
};
