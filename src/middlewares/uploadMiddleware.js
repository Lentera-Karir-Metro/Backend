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
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  // Global config for allowed types and sizes
  const configs = {
    image: {
      types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    video: {
      types: ['video/mp4', 'video/webm', 'video/quicktime'],
      maxSize: 1000 * 1024 * 1024, // 1GB
    },
    document: {
      types: ['application/pdf'],
      maxSize: 50 * 1024 * 1024,
    }
  };

  const checkFile = (file) => {
    let typeGroup = 'other';
    if (configs.image.types.includes(file.mimetype)) typeGroup = 'image';
    else if (configs.video.types.includes(file.mimetype)) typeGroup = 'video';
    else if (configs.document.types.includes(file.mimetype)) typeGroup = 'document';

    if (typeGroup === 'other') {
      return { valid: false, message: `Tipe file ${file.originalname} tidak diizinkan. Hanya Image, Video, atau PDF.` };
    }

    if (file.size > configs[typeGroup].maxSize) {
      return { valid: false, message: `File ${file.originalname} terlalu besar untuk tipe ${typeGroup}.` };
    }
    return { valid: true };
  };

  // Validasi single file
  if (req.file) {
    const result = checkFile(req.file);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });
  }

  // Validasi multiple files
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const result = checkFile(file);
      if (!result.valid) return res.status(400).json({ success: false, message: result.message });
    }
  }

  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  validateFile,
};
