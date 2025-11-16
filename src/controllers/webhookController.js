// File: src/controllers/webhookController.js
const { coreApi } = require('../utils/midtransClient');
const db = require('../../models');
const { UserEnrollment, User } = db;

// @desc    Menangani notifikasi dari Midtrans
// @route   POST /api/v1/webhooks/midtrans
const handleMidtransNotification = async (req, res) => {
  const notificationBody = req.body;

  try {
    const statusResponse = await coreApi.transaction.notification(notificationBody);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const metadata = statusResponse.metadata;
    
    console.log(`Notifikasi diterima untuk Order ID: ${orderId}, Status: ${transactionStatus}`);
    
    if (transactionStatus == 'settlement') {
      if (fraudStatus == 'accept') {
        
        const userId = metadata.user_id;
        const learningPathId = metadata.learning_path_id;

        if (!userId || !learningPathId) {
          console.error('Webhook error: Metadata user_id atau learning_path_id tidak ada.');
          return res.status(400).json({ message: 'Metadata tidak lengkap.' });
        }

        const [enrollment, created] = await UserEnrollment.findOrCreate({
          where: {
            user_id: userId,
            learning_path_id: learningPathId
          },
          defaults: {
            status: 'success',
            enrolled_at: new Date(),
            midtrans_transaction_id: orderId
          }
        });

        if (created) {
          console.log(`Enrollment berhasil dibuat untuk user: ${userId}`);
        } else {
          console.log(`Enrollment sudah ada untuk user: ${userId}. Status di-update.`);
          enrollment.status = 'success';
          enrollment.enrolled_at = new Date();
          enrollment.midtrans_transaction_id = orderId;
          await enrollment.save();
        }
      }
    } else if (transactionStatus == 'expire' || transactionStatus == 'cancel' || transactionStatus == 'deny') {
      console.log(`Pembayaran ${orderId} gagal/expire.`);
    }

    return res.status(200).json({ message: 'Notifikasi berhasil diproses.' });

  } catch (err) {
    console.error('Midtrans Webhook Error:', err.message);
    return res.status(500).json({ message: 'Server error.', error: err.message });
  }
};


// @desc    Menangani user dihapus dari Supabase
// @route   POST /api/v1/webhooks/supabase/user-deleted
const handleSupabaseUserDelete = async (req, res) => {
  try {
    const { record, old_record } = req.body;
    const supabaseAuthId = old_record ? old_record.id : (record ? record.id : null);

    if (!supabaseAuthId) {
      return res.status(400).json({ message: 'Payload webhook tidak valid.' });
    }

    console.log(`Webhook diterima: Hapus user dengan Supabase ID ${supabaseAuthId}`);

    const user = await User.findOne({
      where: { supabase_auth_id: supabaseAuthId }
    });

    if (user) {
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