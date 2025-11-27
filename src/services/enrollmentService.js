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
async function createOrUpdateEnrollment(userId, learningPathId, options = {}) {
  const {
    status = 'pending',
    midtransId = null,
    enrolledAt = null,
    skipIfExists = false
  } = options;

  try {
    const [enrollment, created] = await UserEnrollment.findOrCreate({
      where: {
        user_id: userId,
        learning_path_id: learningPathId
      },
      defaults: {
        // ID (EN-XXXXXX) akan otomatis di-generate oleh Hook di Model UserEnrollment
        status,
        midtrans_transaction_id: midtransId,
        enrolled_at: enrolledAt
      }
    });

    // Jika data sudah ada (tidak baru dibuat) dan kita tidak minta skip
    if (!created && !skipIfExists) {
      // Update data yang ada
      if (status) enrollment.status = status;
      if (midtransId) enrollment.midtrans_transaction_id = midtransId;
      if (enrolledAt) enrollment.enrolled_at = enrolledAt;
      
      await enrollment.save();
    }

    return { enrollment, created };
  } catch (err) {
    console.error('Error creating/updating enrollment:', err.message);
    throw err; // Lempar error ke controller untuk ditangani
  }
}

/**
 * Wrapper khusus untuk mengaktifkan enrollment (biasanya dipanggil oleh Webhook).
 * @param {string} userId
 * @param {string} learningPathId
 * @param {string} midtransId
 */
async function activateEnrollment(userId, learningPathId, midtransId = null) {
  return createOrUpdateEnrollment(userId, learningPathId, {
    status: 'success',
    midtransId,
    enrolledAt: new Date(),
    skipIfExists: false // Paksa update status jadi success meskipun sudah ada (misal pending)
  });
}

module.exports = {
  createOrUpdateEnrollment,
  activateEnrollment
};