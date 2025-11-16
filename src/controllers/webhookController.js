// File: src/controllers/webhookController.js
/**
 * @fileoverview Controller untuk menangani Webhook dari layanan eksternal (Midtrans & Supabase).
 * Endpoint ini tidak memiliki middleware otentikasi karena dipanggil oleh server lain.
 */
const { coreApi } = require('../utils/midtransClient');
const db = require('../../models');
const { UserEnrollment, User } = db;

/**
 * @function handleMidtransNotification
 * @description Menangani notifikasi status transaksi dari Midtrans. Jika pembayaran sukses ('settlement'), 
 * akan membuat atau memperbarui record UserEnrollment.
 * @route POST /api/v1/webhooks/midtrans
 *
 * @param {object} req - Objek request (body berisi notifikasi Midtrans)
 * @param {object} res - Objek response
 * @returns {object} Status 200 OK ke Midtrans untuk konfirmasi penerimaan.
 */
const handleMidtransNotification = async (req, res) => {
  const notificationBody = req.body;

  try {
    // 1. Verifikasi notifikasi dari Midtrans (ini juga memastikan keaslian data)
    const statusResponse = await coreApi.transaction.notification(notificationBody);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const metadata = statusResponse.metadata; // Metadata yang kita sisipkan saat checkout
    
    console.log(`Notifikasi diterima untuk Order ID: ${orderId}, Status: ${transactionStatus}`);
    
    // 2. Logika Aktivasi Enrollment
    if (transactionStatus == 'settlement') { // Pembayaran berhasil
      if (fraudStatus == 'accept') {
        
        // Ambil data penting dari metadata yang kita kirimkan saat checkout
        const userId = metadata.user_id;
        const learningPathId = metadata.learning_path_id;

        if (!userId || !learningPathId) {
          console.error('Webhook error: Metadata user_id atau learning_path_id tidak ada.');
          return res.status(400).json({ message: 'Metadata tidak lengkap.' });
        }

        // 3. Buat/Update record Enrollment
        // Menggunakan findOrCreate untuk memastikan idempotency (mencegah duplikat jika Midtrans mengirim notifikasi 2x)
        const [enrollment, created] = await UserEnrollment.findOrCreate({
          where: {
            user_id: userId,
            learning_path_id: learningPathId
          },
          defaults: {
            status: 'success', // Set status sukses
            enrolled_at: new Date(),
            midtrans_transaction_id: orderId
          }
        });

        if (created) {
          console.log(`Enrollment berhasil dibuat untuk user: ${userId}`);
        } else {
          // Jika record sudah ada (misal dari /checkout pending), update statusnya menjadi success
          console.log(`Enrollment sudah ada untuk user: ${userId}. Status di-update.`);
          enrollment.status = 'success';
          enrollment.enrolled_at = new Date();
          enrollment.midtrans_transaction_id = orderId;
          await enrollment.save();
        }
      }
    } else if (transactionStatus == 'expire' || transactionStatus == 'cancel' || transactionStatus == 'deny') {
      // TODO: Di sini tempat untuk update record enrollment jika statusnya gagal/expire
      console.log(`Pembayaran ${orderId} gagal/expire.`);
    }

    // 4. Wajib mengirim respon 200 OK ke Midtrans
    return res.status(200).json({ message: 'Notifikasi berhasil diproses.' });

  } catch (err) {
    console.error('Midtrans Webhook Error:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

/**
 * @function handleSupabaseUserDelete
 * @description Menangani notifikasi penghapusan user dari Supabase Auth.
 * Akan menghapus user terkait di database MySQL lokal (sinkronisasi hapus).
 * @route POST /api/v1/webhooks/supabase/user-deleted
 *
 * @param {object} req - Objek request (body berisi payload Supabase)
 * @param {object} res - Objek response
 * @returns {object} Status 200 OK.
 */
const handleSupabaseUserDelete = async (req, res) => {
  try {
    const { old_record } = req.body;
    // Ambil ID user dari record lama (record yang baru dihapus)
    const supabaseAuthId = old_record ? old_record.id : null;

    if (!supabaseAuthId) {
      return res.status(400).json({ message: 'Payload webhook tidak valid.' });
    }

    console.log(`Webhook diterima: Hapus user dengan Supabase ID ${supabaseAuthId}`);

    // 1. Cari user di database MySQL kita
    const user = await User.findOne({
      where: { supabase_auth_id: supabaseAuthId }
    });

    if (user) {
      // 2. Hapus user
      // (onDelete: 'CASCADE' di model kita akan otomatis menghapus
      // enrollments, progresses, certificates, dll. user ini)
      await user.destroy();
      console.log(`User MySQL (ID: ${user.id}) berhasil dihapus.`);
    } else {
      console.warn(`User dengan Supabase ID ${supabaseAuthId} tidak ditemukan di MySQL.`);
    }

    return res.status(200).json({ message: 'Webhook delete berhasil diproses.' });

  } catch (err) {
    console.error('Supabase Webhook Error:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};


module.exports = {
  handleMidtransNotification,
  handleSupabaseUserDelete,
};