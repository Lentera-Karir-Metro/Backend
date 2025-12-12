/**
 * @fileoverview Middleware untuk file upload menggunakan Multer
 * Validasi ukuran file, tipe file, dan konfigurasi storage
 */

const multer = require('multer');
const path = require('path');

/**
 * Konfigurasi storage untuk menyimpan file sementara di memory
 * (akan langsung dikirim ke Supabase, tidak disimpan di disk)
 */
const storage = multer.memoryStorage();

/**
 * Filter file - validasi tipe MIME
 * Hanya terima file yang sesuai dengan bucket yang dituju
 */
const fileFilter = (req, file, cb) => {
  const { bucketType } = req.params;
  
  // Definisi tipe file yang diizinkan per bucket
  const allowedMimeTypes = {
    thumbnails: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    videos: ['video/mp4', 'video/webm', 'video/quicktime'],
    ebooks: ['application/pdf'],
    certificates: ['image/jpeg', 'image/png', 'application/pdf'],
  };

  // Jika bucketType tidak sesuai, terima semua tipe untuk fleksibilitas
  if (!allowedMimeTypes[bucketType]) {
    return cb(null, true);
  }

  if (allowedMimeTypes[bucketType].includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowedExtensions = allowedMimeTypes[bucketType].join(', ');
    cb(new Error(`Tipe file tidak diizinkan. Accepted: ${allowedExtensions}`));
  }
};

/**
 * Konfigurasi Multer untuk single file upload
 */
const uploadSingle = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1GB (untuk accommodate video files besar)
  },
  fileFilter: fileFilter,
});

/**
 * Konfigurasi Multer untuk multiple file upload
 */
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1GB per file
  },
  fileFilter: fileFilter,
});

/**
 * Custom middleware untuk validasi file per bucket type
 * Gunakan ini untuk validasi ukuran dan tipe file yang lebih spesifik
 */
const validateFileByBucket = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(); // Tidak ada file, lanjut ke fungsi berikutnya
  }

  // Jika bucketType ada di params, gunakan itu. Jika tidak, cek dari body module_type
  const bucketType = req.params.bucketType || 
                      (req.body.module_type === 'video' ? 'videos' : 
                       req.body.module_type === 'ebook' ? 'ebooks' : 
                       'thumbnails');

  // Konfigurasi per bucket
  const bucketConfig = {
    thumbnails: { maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] },
    videos: { maxSize: 500 * 1024 * 1024, allowedTypes: ['video/mp4', 'video/webm'] },
    ebooks: { maxSize: 50 * 1024 * 1024, allowedTypes: ['application/pdf'] },
    certificates: { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
  };

  const config = bucketConfig[bucketType];
  if (!config) {
    return next();
  }

  // Validasi single file
  if (req.file) {
    if (req.file.size > config.maxSize) {
      return res.status(400).json({
        success: false,
        message: `Ukuran file terlalu besar. Max: ${config.maxSize / 1024 / 1024}MB`,
      });
    }

    if (!config.allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Tipe file tidak diizinkan. Accepted: ${config.allowedTypes.join(', ')}`,
      });
    }
  }

  // Validasi multiple files
  if (req.files && Array.isArray(req.files)) {
    for (let file of req.files) {
      if (file.size > config.maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} terlalu besar. Max: ${config.maxSize / 1024 / 1024}MB`,
        });
      }

      if (!config.allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} tipe tidak diizinkan`,
        });
      }
    }
  }

  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  validateFileByBucket,
};
