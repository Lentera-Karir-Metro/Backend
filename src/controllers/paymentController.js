// File: src/controllers/paymentController.js
/**
 * @fileoverview Controller untuk mengelola inisiasi pembayaran (Checkout)
 * dengan Midtrans Snap. Endpoint ini diakses oleh User yang sudah login.
 */
const db = require('../../models');
const { Course, UserEnrollment, User, Sequelize } = db;
const { Op } = Sequelize;
// Kita gunakan wrapper helper yang lebih aman (sesuai update utils sebelumnya)
const { createSnapTransaction, cancelMidtransTransaction } = require('../utils/midtransClient');
const { generateCustomId } = require('../utils/idGenerator');

/**
 * @function getAllTransactions
 * @description Mengambil semua data transaksi untuk Admin Panel.
 * Mendukung pagination, search (Transaction ID), dan filter status.
 * @route GET /api/v1/admin/transactions
 * @access Private/Admin
 */
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter by Status
    if (status && status !== 'All') {
      // Map UI status if needed, but usually UI sends 'success', 'pending', 'failed'
      // If UI sends 'Success', 'Pending' (Title Case), we might need to lowercase it
      whereClause.status = status.toLowerCase();
    }

    // Search by Transaction ID
    if (search) {
      whereClause.midtrans_transaction_id = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await UserEnrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['username', 'email'],
          required: false // Allow null users
        },
        {
          model: Course,
          as: 'Course',
          attributes: ['title'],
          required: false // Allow null courses
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const data = rows.map(enrollment => ({
      id: enrollment.midtrans_transaction_id || enrollment.id, // Use Midtrans ID if available, else Enrollment ID
      user_name: enrollment.User ? enrollment.User.username : 'Unknown User', // Use username instead of name
      class_name: enrollment.Course ? enrollment.Course.title : 'Unknown Class',
      amount: enrollment.amount_paid ? parseFloat(enrollment.amount_paid) : 0,
      payment_method: enrollment.payment_method || '-',
      status: enrollment.status,
      date: enrollment.createdAt
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error getAllTransactions:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data transaksi',
      error: err.message
    });
  }
};

/**
 * @function createCheckoutSession
 * @description Membuat sesi checkout Midtrans dengan memperhitungkan DISKON.
 * @route POST /api/v1/payments/checkout
 *
 * @param {object} req - Objek request
 * @param {object} res - Objek response
 */
const createCheckoutSession = async (req, res) => {
  const { course_id } = req.body;

  // Ambil data User dari token (disediakan oleh middleware 'protect')
  const userId = req.user.id;
  const userEmail = req.user.email;
  // Gunakan 'username' sesuai kolom database terbaru
  const userNama = req.user.username;

  if (!course_id) {
    return res.status(400).json({ message: '`course_id` wajib diisi. Pembelian hanya tersedia untuk Course.' });
  }

  try {
    let productTitle;
    let originalPrice = 0;
    let discount = 0;
    let finalPrice = 0;
    let productId = null;

    // Jika checkout berbasis Course (produk utama)
    if (course_id) {
      const course = await Course.findByPk(course_id);
      if (!course) return res.status(404).json({ message: 'Course tidak ditemukan.' });
      productTitle = course.title;
      productId = course.id;
      originalPrice = parseFloat(course.price || 0);
      discount = parseFloat(course.discount_amount) || 0;
      finalPrice = originalPrice - discount;
    }

    // Validasi harga tidak boleh negatif
    if (finalPrice < 0) {
      return res.status(400).json({ message: 'Konfigurasi harga salah (Diskon lebih besar dari harga asli).' });
    }
    // Jika gratis (0), harusnya bypass payment gateway
    if (finalPrice === 0) {
      return res.status(400).json({ message: 'Produk ini gratis; klaim gratis belum diimplementasikan.' });
    }
    // -------------------------------------

    // 2. Cek apakah ada enrollment APAPUN untuk user ini pada produk yang sama
    const whereClause = { user_id: userId, course_id };

    const existingEnrollment = await UserEnrollment.findOne({ where: whereClause });

    // 3. Buat 'order_id' unik
    const orderId = `LENTERA-${generateCustomId('TRX')}`;

    let enrollment;

    if (existingEnrollment) {
      // Ada enrollment yang sudah ada
      if (existingEnrollment.status === 'success') {
        // Jika sudah success, tolak (sudah terdaftar di Course ini)
        return res.status(409).json({ message: 'Anda sudah membeli Course ini.' });
      } else {
        // Jika status pending atau failed, CANCEL transaksi lama di Midtrans
        if (existingEnrollment.midtrans_transaction_id) {
          console.log(`[Checkout] Canceling old Midtrans transaction: ${existingEnrollment.midtrans_transaction_id}`);
          await cancelMidtransTransaction(existingEnrollment.midtrans_transaction_id);
        }

        // UPDATE dengan transaction ID baru
        console.log(`[Checkout] Updating existing enrollment (status: ${existingEnrollment.status}): ${existingEnrollment.id} with new transaction: ${orderId}`);
        await existingEnrollment.update({ midtrans_transaction_id: orderId, status: 'pending' });
        enrollment = existingEnrollment;
      }
    } else {
      // Belum ada enrollment sama sekali, buat baru
      console.log(`[Checkout] Creating new enrollment with transaction: ${orderId}`);
      const enrollmentId = generateCustomId('EN');
      const createPayload = {
        id: enrollmentId,
        user_id: userId,
        midtrans_transaction_id: orderId,
        status: 'pending',
        amount_paid: finalPrice
      };
      createPayload.course_id = course_id;

      enrollment = await UserEnrollment.create(createPayload);
    }

    // 5. Siapkan Payload Midtrans dengan HARGA DISKON
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice,
      },
      item_details: [{
        id: productId,
        price: finalPrice,
        quantity: 1,
        name: productTitle,
      }],
      customer_details: {
        first_name: userNama,
        email: userEmail,
      },
      metadata: {
        user_id: userId,
        course_id: course_id || null,
        course_only: !!course_id
      }
    };

    // 6. Minta Token ke Midtrans
    let transaction;
    try {
      transaction = await createSnapTransaction(transactionDetails);
    } catch (midtransError) {
      // ROLLBACK: Jika gagal connect ke Midtrans, hapus data enrollment lokal agar tidak jadi sampah
      console.error(`[Checkout] Gagal menghubungi Midtrans. Menghapus enrollment ${enrollment.id}...`);
      if (enrollment) {
        // Jika ini enrollment baru (bukan update yang lama), kita hapus permanen
        // Jika update, kembalikan status ke failed/pending (tergantung logika bisnis), di sini kita hapus saja biar bersih untuk retry
        await enrollment.destroy();
      }
      throw midtransError; // Lempar error agar ditangkap catch block utama
    }

    // 7. Kirim respon ke Frontend
    return res.status(201).json({
      message: 'Sesi checkout berhasil dibuat.',
      order_id: orderId,
      original_price: originalPrice,
      discount_amount: discount,
      final_price: finalPrice,
      transaction,
      enrollment_id: enrollment.id,
    });

  } catch (err) {
    console.error('Checkout error:', err.message);
    console.error('Checkout error full stack:', err);

    // Handle validation errors with more detail
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const details = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      console.error('Validation details:', details);
      return res.status(400).json({ message: 'Validation error.', error: details });
    }

    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createCheckoutSession,
  getAllTransactions
};