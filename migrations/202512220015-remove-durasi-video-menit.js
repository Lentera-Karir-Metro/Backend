'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Modules', 'durasi_video_menit');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('Modules', 'durasi_video_menit', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    }
};
