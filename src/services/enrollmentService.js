// File: src/services/enrollmentService.js
/**
 * @fileoverview Service untuk mengelola logika bisnis User Enrollment.
 * Memisahkan logika database yang kompleks dari Controller agar bisa digunakan ulang (Reusable).
 */

const db = require('../../models');
const { UserEnrollment } = db;

/**
 * Fungsi serbaguna untuk membuat atau memperbarui enrollment.
 * Digunakan oleh Webhook (Aktivasi) dan Admin (Manual Enroll).
 *
 * @param {string} userId - ID user (LT-XXXXXX)
 * @param {string} learningPathId - ID learning path (LP-XXXXXX)
 * @param {object} options - Opsi tambahan { status, midtransId, enrolledAt, skipIfExists }
 * @returns {Promise<object>} { enrollment, created }
 */
async function createOrUpdateEnrollment(userId, options = {}) {
  const {
    status = 'pending',
    midtransId = null,
    enrolledAt = null,
    courseId = null,
    skipIfExists = false
  } = options;

  try {
    // Course-first enrollment: courseId wajib
    if (!courseId) throw new Error('courseId must be provided for enrollment');

    const where = { user_id: userId, course_id: courseId };

    const defaults = {
      status,
      midtrans_transaction_id: midtransId,
      enrolled_at: enrolledAt,
      course_id: courseId
    };

    const [enrollment, created] = await UserEnrollment.findOrCreate({ where, defaults });

    if (!created && !skipIfExists) {
      if (status) enrollment.status = status;
      if (midtransId) enrollment.midtrans_transaction_id = midtransId;
      if (enrolledAt) enrollment.enrolled_at = enrolledAt;
      await enrollment.save();
    }

    return { enrollment, created };
  } catch (err) {
    console.error('Error creating/updating enrollment:', err.message);
    throw err;
  }
}

/**
 * Wrapper khusus untuk mengaktifkan enrollment (biasanya dipanggil oleh Webhook).
 * @param {string} userId
 * @param {string} learningPathId
 * @param {string} midtransId - Order ID dari Midtrans (wajib untuk identifikasi transaksi yang tepat)
 */
async function activateEnrollment(userId, midtransId = null, courseId = null) {
  try {
    let enrollment;

    // Jika ada midtransId, cari enrollment berdasarkan order_id (lebih spesifik)
    if (midtransId) {
      enrollment = await UserEnrollment.findOne({
        where: {
          midtrans_transaction_id: midtransId
        }
      });

      if (!enrollment) {
        console.warn(`[activateEnrollment] Enrollment dengan order_id ${midtransId} tidak ditemukan`);
        // Fallback: cari berdasarkan user_id dan learning_path_id
        const where = { user_id: userId, status: 'pending' };
        if (courseId) where.course_id = courseId;
        enrollment = await UserEnrollment.findOne({ where, order: [['createdAt', 'DESC']] });
      }
    } else {
      // Jika tidak ada midtransId, cari berdasarkan user dan learning path
      const where = { user_id: userId, status: 'pending' };
      if (courseId) where.course_id = courseId;
      enrollment = await UserEnrollment.findOne({ where, order: [['createdAt', 'DESC']] });
    }

    if (!enrollment) {
      console.warn(`[activateEnrollment] Tidak ada enrollment pending untuk user ${userId}, learning_path ${learningPathId}`);
      return { enrollment: null, created: false };
    }

    // Update enrollment menjadi success
    enrollment.status = 'success';
    enrollment.enrolled_at = new Date();
    if (midtransId && !enrollment.midtrans_transaction_id) {
      enrollment.midtrans_transaction_id = midtransId;
    }
    
    await enrollment.save();

    console.log(`[activateEnrollment] ✅ Enrollment ${enrollment.id} berhasil diaktifkan`);
    return { enrollment, created: false };

  } catch (err) {
    console.error('[activateEnrollment] Error:', err.message);
    throw err;
  }
}

module.exports = {
  createOrUpdateEnrollment,
  activateEnrollment
};