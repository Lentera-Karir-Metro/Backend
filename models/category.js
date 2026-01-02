// File: models/category.js
'use strict';
const { Model } = require('sequelize');
const { generateCustomId } = require('../src/utils/idGenerator');

module.exports = (sequelize, DataTypes) => {
    /**
     * Model Category
     * Merepresentasikan kategori untuk Course.
     */
    class Category extends Model {
        static associate(models) {
            // Sebuah Category memiliki banyak Course
            Category.hasMany(models.Course, {
                foreignKey: 'category_id',
                as: 'courses',
            });
        }
    }

    Category.init({
        id: {
            type: DataTypes.STRING(16),
            allowNull: false,
            primaryKey: true,
            unique: true,
            defaultValue: () => generateCustomId('CAT')
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        icon: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: 'folder', // Default icon
        },
        color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: '#6B21FF', // Default purple color
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    }, {
        sequelize,
        modelName: 'Category',
        timestamps: true,
        hooks: {
            beforeCreate: (category, options) => {
                category.id = generateCustomId('CAT');
            },
        },
    });

    return Category;
};
