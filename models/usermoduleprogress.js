// File: models/usermoduleprogress.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  /**
   * Model UserModuleProgress
   * Merepresentasikan progres penyelesaian modul oleh seorang pengguna.
   * Tabel ini adalah inti dari logika "Tandai Selesai"
   * dan digunakan untuk memvalidasi penguncian (lock) modul/course berikutnya.
   */
  class UserModuleProgress extends Model {
    /**
     * Helper method untuk mendefinisikan relasi.
     * Method ini otomatis dipanggil oleh `models/index.js`.
     * @param {object} models - Kumpulan semua model yang terdefinisi
     */
    static associate(models) {
      // Progres ini milik (belongsTo) satu User
      UserModuleProgress.belongsTo(models.User, { 
        foreignKey: 'user_id',
        as: 'user'
      });
      // Progres ini merujuk pada (belongsTo) satu Module
      UserModuleProgress.belongsTo(models.Module, { 
        foreignKey: 'module_id',
        as: 'module'
      });
    }
  }

  /**
   * Inisialisasi model UserModuleProgress dengan skema database.
   */
  UserModuleProgress.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true, // Menggunakan ID standar yang bertambah otomatis
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING(16), // FK ke ID kustom User (LT-XXXXXX)
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika User dihapus, progresnya ikut terhapus
    },
    module_id: {
      type: DataTypes.STRING(16), // FK ke ID kustom Module (MD-XXXXXX)
      allowNull: false,
      references: { model: 'Modules', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Jika Modul dihapus, progres terkait ikut terhapus
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Keberadaan record di tabel ini sudah menandakan 'selesai'
    },
  }, {
    sequelize,
    modelName: 'UserModuleProgress',
    timestamps: true, // Otomatis menambah createdAt dan updatedAt
    // Tidak ada hook 'beforeCreate' karena ID sudah auto-increment
  });
  return UserModuleProgress;
};