/**
 * @fileoverview Utility untuk upload file ke Supabase Storage
 * Handle semua jenis file: gambar, video, ebook, sertifikat
 */

const supabase = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

/**
 * Upload file ke Supabase bucket
 * @param {Object} file - File object dari multer (req.file atau req.files)
 * @param {String} bucketName - Nama bucket di Supabase ('thumbnails', 'videos', 'ebooks', 'certificates')
 * @param {String} folderPath - Path folder di dalam bucket (opsional)
 * @returns {Promise<String>} URL publik dari file yang ter-upload
 */
const uploadToSupabase = async (file, bucketName, folderPath = '') => {
  if (!file) {
    throw new Error('File tidak ditemukan');
  }

  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase tidak terkonfigurasi. Periksa SUPABASE_URL dan SUPABASE_KEY di file .env');
    }

    // Baca file dari buffer/path
    const fileBuffer = file.buffer;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}-${randomStr}${fileExtension}`;
    
    // Tentukan path di Supabase
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload ke Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false, // Jangan overwrite jika file exist
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    // Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Upload to Supabase failed:', err.message);
    throw err;
  }
};

/**
 * Upload multiple files ke Supabase
 * @param {Array} files - Array of file objects dari multer
 * @param {String} bucketName - Nama bucket
 * @param {String} folderPath - Path folder di dalam bucket
 * @returns {Promise<Array>} Array of public URLs
 */
const uploadMultipleFiles = async (files, bucketName, folderPath = '') => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Tidak ada file untuk di-upload');
  }

  try {
    const uploadPromises = files.map(file => 
      uploadToSupabase(file, bucketName, folderPath)
    );
    
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (err) {
    console.error('Multiple upload failed:', err.message);
    throw err;
  }
};

/**
 * Delete file dari Supabase
 * @param {String} fileUrl - Public URL dari file yang akan dihapus
 * @param {String} bucketName - Nama bucket
 * @returns {Promise<Boolean>} true jika berhasil
 */
const deleteFromSupabase = async (fileUrl, bucketName) => {
  if (!fileUrl) {
    return true; // Skip jika URL kosong
  }

  try {
    // Extract file path dari URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = fileUrl.split(`/object/public/${bucketName}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid file URL format:', fileUrl);
      return false;
    }

    const filePath = decodeURIComponent(urlParts[1]);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn(`Failed to delete file from Supabase: ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete from Supabase failed:', err.message);
    return false;
  }
};

module.exports = {
  uploadToSupabase,
  uploadMultipleFiles,
  deleteFromSupabase,
};
