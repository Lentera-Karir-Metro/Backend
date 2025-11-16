// File: src/controllers/paymentController.js
/**
 * @fileoverview Controller untuk mengelola inisiasi pembayaran (Checkout)
 * dengan Midtrans Snap. Endpoint ini diakses oleh User yang sudah login.
 */
const db = require('../../models');
const { LearningPath, UserEnrollment } = db;
const { snap } = require('../utils/midtransClient'); // Impor Midtrans Snap Client
const { generateCustomId } = require('../utils/idGenerator'); // Impor helper ID kustom

/**
 * @function createCheckoutSession
 * @description Membuat sesi checkout Midtrans dan menyiapkan record UserEnrollment dengan status 'pending'.
 * @route POST /api/v1/payments/checkout
 *
 * @param {object} req - Objek request (body: { learning_path_id }, req.user disediakan oleh middleware protect)
 * @param {object} res - Objek response
 * @returns {object} Respon Midtrans Snap token dan URL redirect.
 */
const createCheckoutSession = async (req, res) => {
  const { learning_path_id } = req.body;
  // Ambil data User dari token (disediakan oleh middleware 'protect')
  const userId = req.user.id; 
  const userEmail = req.user.email;
  const userNama = req.user.nama_lengkap;

  if (!learning_path_id) {
    return res.status(400).json({ message: 'Learning Path ID wajib diisi.' });
  }

  try {
    // 1. Cek Learning Path & Harga
    const learningPath = await LearningPath.findByPk(learning_path_id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    if (learningPath.price <= 0) {
      return res.status(400).json({ message: 'Learning Path ini gratis (atau harga belum di-set).' });
    }

    // 2. Cek apakah user sudah terdaftar dan sukses
    const existingEnrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: learningPath.id }
    });

    if (existingEnrollment && existingEnrollment.status === 'success') {
      return res.status(409).json({ message: 'Anda sudah terdaftar di learning path ini.' });
    }

    // 3. Buat 'order_id' unik (midtrans transaction ID)
    const orderId = `LENTERA-${generateCustomId('TRX')}`; // Gunakan prefix + ID kustom

    // 4. Buat record 'UserEnrollment' dengan status 'pending'
    let enrollment;
    if (existingEnrollment) {
      // Jika sudah ada (misal status 'failed' atau 'pending' lama), update
      enrollment = existingEnrollment;
      enrollment.midtrans_transaction_id = orderId; 
      enrollment.status = 'pending';
      await enrollment.save();
    } else {
      // Jika belum ada, buat baru
      enrollment = await UserEnrollment.create({
        user_id: userId,
        learning_path_id: learningPath.id,
        midtrans_transaction_id: orderId,
        status: 'pending',
      });
    }

    // 5. Buat parameter transaksi untuk Midtrans
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseFloat(learningPath.price),
      },
      item_details: [{
        id: learningPath.id,
        price: parseFloat(learningPath.price),
        quantity: 1,
        name: learningPath.title,
      }],
      customer_details: {
        first_name: userNama,
        email: userEmail,
      },
      // 6. SISIPKAN METADATA (SANGAT PENTING!)
      // Webhook Midtrans akan menggunakan metadata ini untuk meng-enroll user
      metadata: {
        user_id: userId, 
        learning_path_id: learningPath.id,
      }
    };

    // 7. Dapatkan token/URL Snap dari Midtrans
    const transaction = await snap.createTransaction(transactionDetails);

    // 8. Kirim respon ke frontend
    return res.status(201).json({
      message: 'Sesi checkout berhasil dibuat.',
      transaction, // Berisi token dan redirect_url
      enrollment_id: enrollment.id,
    });

  } catch (err) {
    console.error('Checkout error:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createCheckoutSession,
};