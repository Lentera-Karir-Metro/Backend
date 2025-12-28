// File: src/controllers/adminDashboardController.js
/**
 * @fileoverview Admin Dashboard Controller - Statistik & overview untuk admin panel
 * Menangani semua endpoint dashboard admin seperti total users, courses, revenue, etc.
 */
const db = require('../../models');
const { 
  User, 
  UserEnrollment, 
  Certificate,
  LearningPath,
  Course,
  Module,
  Sequelize
} = db;
const { Op } = Sequelize;

/**
 * @function getAdminDashboardStats
 * @description Mengambil statistik dashboard admin (total users, courses, revenue, enrollments, certificates)
 * @route GET /api/v1/admin/dashboard/stats
 * @access Private/Admin
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Total Users (hanya role 'user', bukan admin)
    const totalUsers = await User.count({ where: { role: 'user' } });
    
    // 2. Total Active Users (status = 'active' dan role = 'user')
    const totalActiveUsers = await User.count({
      where: { status: 'active', role: 'user' }
    });

    // 3. Total Inactive Users (role = 'user')
    const totalInactiveUsers = await User.count({
      where: { status: 'inactive', role: 'user' }
    });

    // 4. Total Learning Paths
    const totalLearningPaths = await LearningPath.count();

    // 5. Total Courses
    const totalCourses = await Course.count();

    // 6. Total Modules
    const totalModules = await Module.count();

    // 7. Total Enrollments (semua enrollment, regardless of status)
    const totalEnrollments = await UserEnrollment.count();

    // 8. Active Enrollments (status = 'success' / in progress)
    const activeEnrollments = await UserEnrollment.count({
      where: { status: 'success' }
    });

    // 9. Total Certificates Issued
    const totalCertificates = await Certificate.count();

    // 10. Total Revenue (sum dari UserEnrollment amount_paid untuk successful enrollments)
    const revenueResult = await UserEnrollment.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount_paid')), 'total_revenue']
      ],
      where: { status: 'success' },
      raw: true
    });
    const totalRevenue = revenueResult[0]?.total_revenue || 0;

    // 11. Users registered in last 7 days (role = 'user')
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await User.count({
      where: {
        role: 'user',
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // 12. Users registered in last 30 days (role = 'user')
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.count({
      where: {
        role: 'user',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: totalActiveUsers,
          inactive: totalInactiveUsers,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days
        },
        content: {
          totalLearningPaths,
          totalCourses,
          totalModules
        },
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments
        },
        certificates: {
          total: totalCertificates
        },
        revenue: {
          total: parseFloat(totalRevenue) || 0
        }
      }
    });
  } catch (err) {
    console.error('Error getAdminDashboardStats:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil statistik dashboard admin', 
      error: err.message 
    });
  }
};

/**
 * @function getRecentTransactions
 * @description Mengambil transaksi terbaru (enrollment dengan pembayaran)
 * @route GET /api/v1/admin/dashboard/recent-transactions
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 10)
 */
const getRecentTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const transactions = await UserEnrollment.findAll({
      where: { status: 'success' },
      attributes: [
        'id',
        'enrolled_at',
        'amount_paid'
      ],
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'username']
        },
            {
              model: Course,
              as: 'Course',
              attributes: ['id', 'title']
            }
      ],
      order: [['enrolled_at', 'DESC']],
      limit,
      raw: false
    });

    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      userName: tx.User?.username || 'N/A',
      userEmail: tx.User?.email || 'N/A',
      courseTitle: tx.Course?.title || 'N/A',
      amount: parseFloat(tx.amount_paid) || 0,
      date: tx.enrolled_at,
      status: 'Success'
    }));

    return res.status(200).json({
      success: true,
      data: formattedTransactions
    });
  } catch (err) {
    console.error('Error getRecentTransactions:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data transaksi', 
      error: err.message 
    });
  }
};

/**
 * @function getUserGrowthChart
 * @description Mengambil data pertumbuhan user per bulan (untuk chart)
 * @route GET /api/v1/admin/dashboard/user-growth
 * @access Private/Admin
 * @query {number} months - Jumlah bulan (default: 12)
 */
const getUserGrowthChart = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;

    // Generate array tanggal bulan terakhir
    const monthsData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsData.push({
        month: date.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        count: 0
      });
    }

    // Query user count per bulan (role = 'user')
    const userCounts = await User.findAll({
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'year'],
        [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { role: 'user' },
      group: [
        Sequelize.fn('YEAR', Sequelize.col('createdAt')),
        Sequelize.fn('MONTH', Sequelize.col('createdAt'))
      ],
      raw: true,
      subQuery: false
    });

    // Map userCounts into monthsData
    userCounts.forEach(uc => {
      const key = `${uc.year}-${String(uc.month).padStart(2, '0')}`;
      const foundMonth = monthsData.find(m => m.monthKey === key);
      if (foundMonth) {
        foundMonth.userCount = parseInt(uc.count) || 0;
      }
    });

    // Count mentors per month by looking at Courses (mentors are derived from Course.mentor_name)
    const mentorCounts = await Course.findAll({
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('createdAt')), 'year'],
        [Sequelize.fn('MONTH', Sequelize.col('createdAt')), 'month'],
        // Count distinct mentor_name per month
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('mentor_name'))), 'mentor_count']
      ],
      where: {
        mentor_name: { [Op.ne]: null }
      },
      group: [
        Sequelize.fn('YEAR', Sequelize.col('createdAt')),
        Sequelize.fn('MONTH', Sequelize.col('createdAt'))
      ],
      raw: true,
      subQuery: false
    });

    mentorCounts.forEach(mc => {
      const key = `${mc.year}-${String(mc.month).padStart(2, '0')}`;
      const foundMonth = monthsData.find(m => m.monthKey === key);
      if (foundMonth) {
        foundMonth.mentorCount = parseInt(mc.mentor_count) || 0;
      }
    });

    const data = monthsData.map(m => ({
      month: m.month,
      newUsers: m.userCount || 0,
      newMentors: m.mentorCount || 0
    }));

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error getUserGrowthChart:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data pertumbuhan user', 
      error: err.message 
    });
  }
};

/**
 * @function getEnrollmentStats
 * @description Mengambil statistik enrollment per learning path
 * @route GET /api/v1/admin/dashboard/enrollment-stats
 * @access Private/Admin
 */
const getEnrollmentStats = async (req, res) => {
  try {
    const enrollmentStats = await UserEnrollment.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      include: [
        {
          model: LearningPath,
          as: 'LearningPath',
          attributes: ['id', 'title'],
          required: true
        }
      ],
      group: ['learning_path_id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: false,
      subQuery: false
    });

    const data = enrollmentStats.map(es => ({
      pathTitle: es.LearningPath?.title || 'Unknown',
      enrollmentCount: parseInt(es.dataValues.count) || 0
    }));

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error getEnrollmentStats:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil statistik enrollment', 
      error: err.message 
    });
  }
};

/**
 * @function getRecentUsers
 * @description Mengambil user yang baru registrasi
 * @route GET /api/v1/admin/dashboard/recent-users
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 5)
 */
const getRecentUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'createdAt'],
      where: { role: 'user' },
      order: [['createdAt', 'DESC']],
      limit,
      raw: true
    });

    const formattedUsers = users.map((user, index) => ({
      no: index + 1,
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: formattedUsers
    });
  } catch (err) {
    console.error('Error getRecentUsers:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data user terbaru', 
      error: err.message 
    });
  }
};

/**
 * @function getRecentLearningPaths
 * @description Mengambil learning path yang baru dibuat
 * @route GET /api/v1/admin/dashboard/recent-learning-paths
 * @access Private/Admin
 * @query {number} limit - Jumlah data (default: 5)
 */
const getRecentLearningPaths = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const learningPaths = await LearningPath.findAll({
      attributes: ['id', 'title', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      raw: true
    });

    const formattedPaths = learningPaths.map((lp, index) => ({
      no: index + 1,
      id: lp.id,
      title: lp.title,
      createdAt: lp.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: formattedPaths
    });
  } catch (err) {
    console.error('Error getRecentLearningPaths:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data learning path terbaru', 
      error: err.message 
    });
  }
};

module.exports = {
  getAdminDashboardStats,
  getRecentTransactions,
  getUserGrowthChart,
  getEnrollmentStats,
  getRecentUsers,
  getRecentLearningPaths
};
