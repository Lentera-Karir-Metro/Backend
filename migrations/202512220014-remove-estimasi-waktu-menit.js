'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Modules', 'estimasi_waktu_menit');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Modules', 'estimasi_waktu_menit', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
    }
};
