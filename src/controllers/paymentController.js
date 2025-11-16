// File: src/controllers/paymentController.js
const db = require('../../models');
const { LearningPath, User, UserEnrollment } = db;
const { snap } = require('../utils/midtransClient'); // Impor 'snap'
const { generateCustomId } = require('../utils/idGenerator');

// @desc    Membuat sesi checkout Midtrans
// @route   POST /api/v1/payments/checkout
const createCheckoutSession = async (req, res) => {
  const { learning_path_id } = req.body;
  // req.user didapat dari middleware 'protect'
  const userId = req.user.id; 
  const userEmail = req.user.email;
  const userNama = req.user.nama_lengkap;

  if (!learning_path_id) {
    return res.status(400).json({ message: 'Learning Path ID wajib diisi.' });
  }

  try {
    // 1. Cek apakah Learning Path ada dan ambil harganya
    const learningPath = await LearningPath.findByPk(learning_path_id);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }
    if (learningPath.price <= 0) {
      return res.status(400).json({ message: 'Learning Path ini gratis (atau harga belum di-set).' });
    }

    // 2. Cek apakah user sudah terdaftar
    const existingEnrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: learningPath.id }
    });

    if (existingEnrollment && existingEnrollment.status === 'success') {
      return res.status(409).json({ message: 'Anda sudah terdaftar di learning path ini.' });
    }

    // 3. Buat 'order_id' unik untuk Midtrans
    const orderId = `LENTERA-${generateCustomId('TRX')}`;

    // 4. Buat record 'UserEnrollment' dengan status 'pending'
    // atau update jika sudah ada tapi gagal/pending
    let enrollment;
    if (existingEnrollment) {
      enrollment = existingEnrollment;
      enrollment.midtrans_transaction_id = orderId; // Update order ID baru
      enrollment.status = 'pending';
    } else {
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
      metadata: {
        user_id: userId, // ID MySQL kita (LT-XXXXXX)
        learning_path_id: learningPath.id, // ID LP (LP-XXXXXX)
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