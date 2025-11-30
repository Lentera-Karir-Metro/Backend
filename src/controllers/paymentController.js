// File: src/controllers/paymentController.js
/**
 * @fileoverview Controller untuk mengelola inisiasi pembayaran (Checkout)
 * dengan Midtrans Snap. Endpoint ini diakses oleh User yang sudah login.
 */
const db = require('../../models');
const { LearningPath, UserEnrollment } = db;
// Kita gunakan wrapper helper yang lebih aman (sesuai update utils sebelumnya)
const { createSnapTransaction } = require('../utils/midtransClient'); 
const { generateCustomId } = require('../utils/idGenerator'); 

/**
 * @function createCheckoutSession
 * @description Membuat sesi checkout Midtrans dengan memperhitungkan DISKON.
 * @route POST /api/v1/payments/checkout
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 */
const createCheckoutSession = async (req, res) => {
  const { learning_path_id } = req.body;
  
  // Ambil data User dari token (disediakan oleh middleware 'protect')
  const userId = req.user.id; 
  const userEmail = req.user.email;
  // Gunakan 'username' sesuai kolom database terbaru
  const userNama = req.user.username; 

  if (!learning_path_id) {
    return res.status(400).json({ message: 'Learning Path ID wajib diisi.' });
  }

  try {
    // 1. Ambil Data Learning Path
    const learningPath = await LearningPath.findByPk(learning_path_id);
    
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning Path tidak ditemukan.' });
    }

    // --- LOGIKA HITUNG HARGA & DISKON ---
    const originalPrice = parseFloat(learningPath.price);
    const discount = parseFloat(learningPath.discount_amount) || 0;
    
    // Harga Akhir = Harga Asli - Diskon
    let finalPrice = originalPrice - discount;

    // Validasi harga tidak boleh negatif
    if (finalPrice < 0) {
        return res.status(400).json({ message: 'Konfigurasi harga salah (Diskon lebih besar dari harga asli).' });
    }
    // Jika gratis (0), harusnya bypass payment gateway (tapi kita anggap bayar Rp 0 tidak didukung Midtrans, minimal Rp 1)
    if (finalPrice === 0) {
        // Opsional: Bisa langsung auto-enroll di sini jika gratis
        // Untuk sekarang kita lempar error biar admin tahu
        return res.status(400).json({ message: 'Kelas ini gratis, silakan hubungi admin (Fitur klaim gratis belum tersedia).' });
    }
    // -------------------------------------

    // 2. Cek apakah user sudah terdaftar
    const existingEnrollment = await UserEnrollment.findOne({
      where: { user_id: userId, learning_path_id: learningPath.id }
    });

    // Jika sudah sukses bayar, tolak
    if (existingEnrollment && existingEnrollment.status === 'success') {
      return res.status(409).json({ message: 'Anda sudah terdaftar di learning path ini.' });
    }

    // 3. Buat 'order_id' unik
    const orderId = `LENTERA-${generateCustomId('TRX')}`;

    // 4. Buat/Update Record Enrollment (Status: Pending)
    let enrollment;
    if (existingEnrollment) {
      // Update transaksi lama yang gagal/pending
      enrollment = existingEnrollment;
      enrollment.midtrans_transaction_id = orderId; 
      enrollment.status = 'pending';
      await enrollment.save();
    } else {
      // Buat baru
      // Note: ID (EN-XXXXXX) otomatis dibuat oleh Hook di Model, tidak perlu generate manual
      enrollment = await UserEnrollment.create({
        user_id: userId,
        learning_path_id: learningPath.id,
        midtrans_transaction_id: orderId,
        status: 'pending',
      });
    }

    // 5. Siapkan Payload Midtrans dengan HARGA DISKON
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice, // <--- PENTING: Gunakan harga setelah diskon
      },
      item_details: [{
        id: learningPath.id,
        price: finalPrice,        // <--- PENTING: Gunakan harga setelah diskon
        quantity: 1,
        name: learningPath.title, // Nama barang di struk
      }],
      customer_details: {
        first_name: userNama,
        email: userEmail,
      },
      // Metadata untuk Webhook
      metadata: {
        user_id: userId, 
        learning_path_id: learningPath.id,
      }
    };

    // 6. Minta Token ke Midtrans
    const transaction = await createSnapTransaction(transactionDetails);

    // 7. Kirim respon ke Frontend
    return res.status(201).json({
      message: 'Sesi checkout berhasil dibuat.',
      original_price: originalPrice,
      discount_amount: discount,
      final_price: finalPrice,
      transaction, // Token Snap & Redirect URL
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