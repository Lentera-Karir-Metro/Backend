// File: models/index.js
// PENTING: File ini sebagian besar dibuat otomatis oleh sequelize-cli
// dan berfungsi sebagai titik pusat untuk semua model database.

'use strict';

const fs = require('fs'); // Modul File System (untuk membaca direktori)
const path = require('path'); // Modul Path (untuk mengelola path file)
const Sequelize = require('sequelize'); // Pustaka Sequelize
const process = require('process');
const basename = path.basename(__filename); // Nama file ini ('index.js')
const env = process.env.NODE_ENV || 'development'; // Tentukan lingkungan (development/production)
const config = require(__dirname + '/../config/config.json')[env]; // Muat konfigurasi database
const db = {}; // Objek 'db' akan menampung semua model kita

let sequelize;
// Inisialisasi koneksi Sequelize
if (config.use_env_variable) {
  // Opsi untuk terhubung menggunakan variabel lingkungan (biasanya untuk production)
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Opsi untuk terhubung menggunakan detail dari config.json (biasanya untuk development)
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Logika untuk memuat semua file model secara dinamis
fs
  .readdirSync(__dirname) // Baca semua file di direktori ini (folder 'models')
  .filter(file => {
    // Filter file:
    return (
      file.indexOf('.') !== 0 && // Bukan file tersembunyi (diawali '.')
      file !== basename && // Bukan file ini sendiri ('index.js')
      file.slice(-3) === '.js' && // Harus berakhiran '.js'
      file.indexOf('.test.js') === -1 // Abaikan file tes
    );
  })
  .forEach(file => {
    // Untuk setiap file model yang ditemukan (misal: 'user.js')
    // Impor file tersebut dan teruskan koneksi 'sequelize' dan 'DataTypes'
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    // Simpan model ke dalam objek 'db'
    db[model.name] = model; // misal: db['User'] = model User
  });

// Logika untuk menjalankan asosiasi (relasi)
Object.keys(db).forEach(modelName => {
  // Jika model memiliki fungsi 'associate' (yang kita definisikan)
  if (db[modelName].associate) {
    // Jalankan fungsi tersebut dan teruskan semua model (db)
    // Ini adalah langkah yang membangun relasi .hasMany, .belongsTo, dll.
    db[modelName].associate(db);
  }
});

// Ekspor koneksi 'sequelize' dan pustaka 'Sequelize'
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Ekspor objek 'db' yang kini berisi semua model dan koneksi
module.exports = db;