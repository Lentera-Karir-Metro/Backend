// File: src/controllers/paymentStatusController.js
/**
 * @fileoverview Controller untuk mengecek dan mensinkronkan status pembayaran
 * Digunakan sebagai fallback ketika webhook tidak berjalan (development mode)
 */
const db = require('../../models');
const { UserEnrollment } = db;
const { getTransactionStatus } = require('../utils/midtransClient');

/**
 * @function checkPaymentStatus
 * @description Mengecek status pembayaran di Midtrans dan update enrollment jika sudah settlement
 * @route GET /api/v1/payments/status/:order_id
 */
const checkPaymentStatus = async (req, res) => {
  const { order_id } = req.params;
  const userId = req.user.id; // Dari middleware protect

  try {
    console.log(`\n[CheckPayment] ========== START ==========`);
    console.log(`[CheckPayment] Order ID: ${order_id}`);
    console.log(`[CheckPayment] User ID: ${userId}`);

    // 1. Cari enrollment berdasarkan order_id
    const enrollment = await UserEnrollment.findOne({
      where: { 
        midtrans_transaction_id: order_id,
        user_id: userId // Pastikan order ini milik user yang login
      }
    });

    if (!enrollment) {
      console.log(`[CheckPayment] ❌ Enrollment not found for order: ${order_id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Transaksi tidak ditemukan.' 
      });
    }

    console.log(`[CheckPayment] Enrollment found: ${enrollment.id}, Current status: ${enrollment.status}`);

    // 2. Jika sudah success, langsung return
    if (enrollment.status === 'success') {
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Pembayaran sudah berhasil.',
        enrollment: {
          id: enrollment.id,
          course_id: enrollment.course_id || null,
          enrolled_at: enrollment.enrolled_at
        }
      });
    }

    // 3. Query status ke Midtrans (Gunakan helper fetch baru)
    try {
      const statusResponse = await getTransactionStatus(order_id);
      
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;
      const paymentType = statusResponse.payment_type;
      const grossAmount = statusResponse.gross_amount;

      console.log(`[CheckPayment] Midtrans status: ${transactionStatus}, Fraud: ${fraudStatus || 'N/A'}`);

      // 4. Update enrollment berdasarkan status
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        if (fraudStatus === 'accept' || !fraudStatus) {
          enrollment.status = 'success';
          enrollment.enrolled_at = new Date();
          // Update info pembayaran tambahan
          if (paymentType) enrollment.payment_method = paymentType;
          if (grossAmount) enrollment.amount_paid = grossAmount;
          
          await enrollment.save();

          console.log(`[CheckPayment] ✅ Enrollment ${enrollment.id} updated to SUCCESS`);
          console.log(`[CheckPayment] ========== END ==========\n`);

          return res.status(200).json({
          success: true,
          status: 'success',
          message: 'Pembayaran berhasil dikonfirmasi!',
          enrollment: {
            id: enrollment.id,
            learning_path_id: enrollment.learning_path_id,
            course_id: enrollment.course_id || null,
            enrolled_at: enrollment.enrolled_at
          }
        });
        } else {
          return res.status(400).json({
            success: false,
            status: 'fraud',
            message: 'Pembayaran ditolak karena terindikasi fraud.'
          });
        }
      } else if (transactionStatus === 'pending') {
        return res.status(200).json({
          success: false,
          status: 'pending',
          message: 'Pembayaran masih dalam proses.'
        });
      } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
        enrollment.status = 'failed';
        await enrollment.save();

        return res.status(400).json({
          success: false,
          status: 'failed',
          message: `Pembayaran gagal (${transactionStatus}).`
        });
      } else {
        return res.status(200).json({
          success: false,
          status: transactionStatus,
          message: `Status pembayaran: ${transactionStatus}`
        });
      }

    } catch (midtransError) {
      // Jika error 404, transaksi tidak ditemukan di Midtrans
      if (midtransError.httpStatusCode === 404) {
        console.warn(`[CheckPayment] Transaction not found in Midtrans: ${order_id}`);
        return res.status(404).json({
          success: false,
          status: 'not_found',
          message: 'Transaksi tidak ditemukan di sistem pembayaran.'
        });
      }

      console.error(`[CheckPayment] Midtrans API error:`, midtransError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengecek status pembayaran.',
        error: midtransError.message
      });
    }

  } catch (err) {
    console.error('[CheckPayment] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message
    });
  }
};

/**
 * @function syncAllPendingPayments
 * @description Mensinkronkan semua pembayaran pending milik user
 * @route POST /api/v1/payments/sync
 */
const syncAllPendingPayments = async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`[SyncPayments] Syncing pending payments for user: ${userId}`);

    // 1. Ambil semua enrollment pending milik user ini
    const pendingEnrollments = await UserEnrollment.findAll({
      where: { 
        user_id: userId,
        status: 'pending' 
      }
    });

    if (pendingEnrollments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tidak ada pembayaran pending.',
        synced: 0
      });
    }

    let syncedCount = 0;
    const results = [];

    // 2. Cek status setiap transaksi
    for (const enrollment of pendingEnrollments) {
      const orderId = enrollment.midtrans_transaction_id;
      
      if (!orderId) continue;

      try {
        const statusResponse = await coreApi.transaction.status(orderId);
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
          if (fraudStatus === 'accept' || !fraudStatus) {
            enrollment.status = 'success';
            enrollment.enrolled_at = new Date();
            await enrollment.save();
            
            syncedCount++;
                results.push({
                  order_id: orderId,
                  status: 'success',
                  course_id: enrollment.course_id || null
                });
          }
        } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
          enrollment.status = 'failed';
          await enrollment.save();
          
          results.push({
            order_id: orderId,
            status: 'failed',
            course_id: enrollment.course_id || null
          });
        }
      } catch (err) {
        console.warn(`[SyncPayments] Error checking ${orderId}:`, err.message);
      }
    }

    console.log(`[SyncPayments] ✅ Synced ${syncedCount} payments`);

    return res.status(200).json({
      success: true,
      message: `Berhasil mensinkronkan ${syncedCount} pembayaran.`,
      synced: syncedCount,
      results
    });

  } catch (err) {
    console.error('[SyncPayments] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: err.message
    });
  }
};

module.exports = {
  checkPaymentStatus,
  syncAllPendingPayments
};
