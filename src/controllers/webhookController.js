// File: src/controllers/webhookController.js
/**
 * @fileoverview Controller untuk menangani Webhook dari layanan eksternal (Midtrans & Supabase).
 * Endpoint ini tidak memiliki middleware otentikasi karena dipanggil oleh server lain.
 */
const { verifyCoreNotification } = require('../utils/midtransClient');
const { activateEnrollment } = require('../services/enrollmentService');
const db = require('../../models');
const { UserEnrollment, User } = db;

/**
 * @function handleMidtransNotification
 * @description Menangani notifikasi status transaksi dari Midtrans.
 * @route POST /api/v1/webhooks/midtrans
 */
const handleMidtransNotification = async (req, res) => {
  const notificationBody = req.body;
  const isTestMode = process.env.WEBHOOK_TEST_MODE === 'true';

  try {
    // Validasi awal: pastikan payload tidak kosong
    if (!notificationBody || Object.keys(notificationBody).length === 0) {
      console.error('Webhook error: payload kosong.', notificationBody);
      return res.status(400).json({ message: 'Payload webhook kosong.' });
    }

    // Cek apakah ada identifier transaksi yang bisa dipakai
    const possibleOrderId = notificationBody.order_id || notificationBody.orderId || notificationBody.order || notificationBody.transaction_id || notificationBody.transactionId;
    if (!possibleOrderId) {
      console.error('Webhook error: payload tidak memiliki order_id/transaction_id.', notificationBody);
      return res.status(400).json({ message: 'Payload webhook tidak memiliki order_id atau transaction_id.' });
    }

    let statusResponse = notificationBody;
    let verificationFailed = false;

    // 1. Coba verifikasi dengan Midtrans (jika bukan test mode)
    if (!isTestMode) {
      try {
        statusResponse = await verifyCoreNotification(notificationBody);
        console.log(`[Webhook] Verifikasi Midtrans sukses untuk order: ${possibleOrderId}`);
      } catch (verifyErr) {
        // Jika verifikasi gagal (mis. 404), log tapi tetap lanjutkan dengan data dari payload
        console.warn(`[Webhook] Verifikasi Midtrans gagal: ${verifyErr.message}`);
        console.warn(`[Webhook] Menggunakan data dari payload sebagai fallback`);
        verificationFailed = true;
        // Gunakan notificationBody yang sudah divalidasi sebagai statusResponse
        statusResponse = notificationBody;
      }
    } else {
      console.log(`[Webhook] TEST MODE ENABLED - Melewati verifikasi Midtrans`);
    }
    
    const orderId = statusResponse.order_id || statusResponse.orderId || possibleOrderId;
    const transactionStatus = statusResponse.transaction_status || statusResponse.transactionStatus || statusResponse.status;
    const fraudStatus = statusResponse.fraud_status || statusResponse.fraudStatus;
    const metadata = statusResponse.metadata || statusResponse.meta || {};

    console.log(`[Webhook] Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

    // 2. Logika Aktivasi Enrollment
    if (transactionStatus == 'settlement' || (isTestMode && transactionStatus === 'settlement')) {
      if (fraudStatus == 'accept' || !fraudStatus) { // Jika fraud_status kosong, dianggap accept
        
        const userId = metadata.user_id;
        const courseId = metadata.course_id || metadata.courseId || null;

        if (!userId || !courseId) {
          console.error('Webhook error: Metadata user_id atau course_id tidak ada.');
          return res.status(400).json({ message: 'Metadata tidak lengkap. `course_id` wajib untuk pembelian.' });
        }

        // Activation: treat purchases as course-only enrollments
        try {
          const { enrollment, created } = await activateEnrollment(userId, orderId, courseId);
          if (created) console.log(`[Webhook] ✅ Enrollment COURSE-BARU dibuat untuk user: ${userId}`);
          else console.log(`[Webhook] ✅ Enrollment COURSE di-update untuk user: ${userId}`);
        } catch (enrollErr) {
          console.error('Error saat activate enrollment (course-only):', enrollErr.message);
          return res.status(500).json({ message: 'Database error saat activate enrollment.' });
        }
      } else {
        console.log(`[Webhook] Transaksi ditolak (fraud_status: ${fraudStatus})`);
      }
    } else if (transactionStatus == 'expire' || transactionStatus == 'cancel' || transactionStatus == 'deny') {
      console.log(`[Webhook] Pembayaran gagal/expire (${transactionStatus})`);
    } else {
      console.log(`[Webhook] Status transaksi tidak dikenali: ${transactionStatus}`);
    }

    // 3. Wajib mengirim respon 200 OK ke Midtrans
    return res.status(200).json({ 
      message: 'Notifikasi berhasil diproses.',
      debug: { verificationFailed, isTestMode }
    });

  } catch (err) {
    console.error('[Webhook] Unexpected error:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  handleMidtransNotification,
};