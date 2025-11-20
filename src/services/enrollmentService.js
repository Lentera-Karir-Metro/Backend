/**
 * Service untuk mengelola User Enrollment
 * Centralized logic untuk membuat dan update enrollment
 */

const db = require('../../models');
const { UserEnrollment } = db;
const { generateCustomId } = require('../utils/idGenerator');

/**
 * Buat atau update enrollment untuk user
 * @param {string} userId - ID user (LT-XXXXXX)
 * @param {string} learningPathId - ID learning path (LP-XXXXXX)
 * @param {object} options - Opsi tambahan { status, midtransId, enrolledAt }
 * @returns {object} { enrollment, created }
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
        id: generateCustomId('EN'),
        status,
        midtrans_transaction_id: midtransId,
        enrolled_at: enrolledAt
      }
    });

    if (!created && !skipIfExists) {
      // Update existing enrollment
      enrollment.status = status || enrollment.status;
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
 * Activate enrollment (set status to success)
 * @param {string} userId
 * @param {string} learningPathId
 * @param {string} midtransId
 */
async function activateEnrollment(userId, learningPathId, midtransId = null) {
  return createOrUpdateEnrollment(userId, learningPathId, {
    status: 'success',
    midtransId,
    enrolledAt: new Date(),
    skipIfExists: false
  });
}

module.exports = {
  createOrUpdateEnrollment,
  activateEnrollment
};
