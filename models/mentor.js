// File: models/mentor.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
    /**
     * Model Mentor
     * Merepresentasikan data mentor untuk Course.
     */
    class Mentor extends Model {
        static associate(models) {
            // Sebuah Mentor memiliki banyak Course
            Mentor.hasMany(models.Course, {
                foreignKey: 'mentor_id',
                as: 'courses',
            });
        }
    }

    Mentor.init({
        id: {
            type: DataTypes.STRING(16),
            allowNull: false,
            primaryKey: true,
            unique: true,
            defaultValue: () => generateCustomId('MNT')
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: true,
            comment: 'Jabatan/pekerjaan mentor'
        },
        photo_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    }, {
        sequelize,
        modelName: 'Mentor',
        timestamps: true,
        hooks: {
            beforeCreate: (mentor, options) => {
                mentor.id = generateCustomId('MNT');
            },
        },
    });

    return Mentor;
};
