// File: src/controllers/reportsController.js
/**
 * @fileoverview Reports Controller - Analytics & reporting untuk admin
 * Menangani semua endpoint reports seperti user analytics, course performance, sales report
 */
const db = require('../../models');
const { 
  User, 
  UserEnrollment, 
  Certificate,
  LearningPath,
  Course,
  UserModuleProgress,
  Sequelize
} = db;
const { Op } = Sequelize;

/**
 * @function getUserAnalytics
 * @description Mengambil analitik pengguna (total, active, inactive, registered this month)
 * @route GET /api/v1/admin/reports/user-analytics
 * @access Private/Admin
 */
const getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });

    // Users registered this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const thisMonthUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    // User roles breakdown
    const roleBreakdown = await User.findAll({
      attributes: [
        'role',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    return res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        registeredThisMonth: thisMonthUsers,
        byRole: roleBreakdown.map(r => ({
          role: r.role,
          count: parseInt(r.count)
        }))
      }
    });
  } catch (err) {
    console.error('Error getUserAnalytics:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil analitik user', 
      error: err.message 
    });
  }
};

/**
 * @function getCoursePerformance
 * @description Mengambil performa kursus (enrollment, completion rate, revenue)
 * @route GET /api/v1/admin/reports/course-performance
 * @access Private/Admin
 */
const getCoursePerformance = async (req, res) => {
  try {
    const courses = await LearningPath.findAll({
      attributes: ['id', 'title', 'price', 'thumbnail_url'],
      include: [
        {
          model: UserEnrollment,
          as: 'enrollments',
          attributes: ['id', 'status', 'amount_paid'],
          required: false
        }
      ],
      raw: false
    });

    const performanceData = await Promise.all(
      courses.map(async (course) => {
        const totalEnrollments = course.enrollments?.length || 0;
        const completedEnrollments = course.enrollments?.filter(e => e.status === 'success')?.length || 0;
        const completionRate = totalEnrollments > 0 
          ? Math.round((completedEnrollments / totalEnrollments) * 100) 
          : 0;
        
        const totalRevenue = course.enrollments?.reduce((sum, e) => sum + (parseFloat(e.amount_paid) || 0), 0) || 0;

        // Count total modules & courses
        const courseCount = await Course.count({
          where: { learning_path_id: course.id }
        });

        return {
          id: course.id,
          title: course.title,
          courseCount,
          totalEnrollments,
          completedEnrollments,
          completionRate: `${completionRate}%`,
          revenue: parseFloat(totalRevenue) || 0,
          price: parseFloat(course.price) || 0
        };
      })
    );

    // Sort by revenue desc
    performanceData.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (err) {
    console.error('Error getCoursePerformance:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil performa kursus', 
      error: err.message 
    });
  }
};

/**
 * @function getSalesReport
 * @description Mengambil laporan penjualan per bulan
 * @route GET /api/v1/admin/reports/sales-report
 * @access Private/Admin
 * @query {number} months - Jumlah bulan (default: 12)
 */
const getSalesReport = async (req, res) => {
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
        sales: 0,
        enrollments: 0
      });
    }

    // Query sales per bulan
    const salesData = await UserEnrollment.findAll({
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('enrolled_at')), 'year'],
        [Sequelize.fn('MONTH', Sequelize.col('enrolled_at')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'enrollment_count'],
        [Sequelize.fn('SUM', Sequelize.col('amount_paid')), 'total_sales']
      ],
      where: { status: 'success' },
      group: [
        Sequelize.fn('YEAR', Sequelize.col('enrolled_at')),
        Sequelize.fn('MONTH', Sequelize.col('enrolled_at'))
      ],
      raw: true,
      subQuery: false
    });

    // Map hasil ke monthsData
    salesData.forEach(sd => {
      const key = `${sd.year}-${String(sd.month).padStart(2, '0')}`;
      const foundMonth = monthsData.find(m => m.monthKey === key);
      if (foundMonth) {
        foundMonth.sales = parseFloat(sd.total_sales) || 0;
        foundMonth.enrollments = parseInt(sd.enrollment_count);
      }
    });

    const data = monthsData.map(m => ({
      month: m.month,
      sales: m.sales,
      enrollments: m.enrollments
    }));

    const totalSales = data.reduce((sum, m) => sum + m.sales, 0);
    const totalEnrollments = data.reduce((sum, m) => sum + m.enrollments, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalSales: parseFloat(totalSales) || 0,
        totalEnrollments,
        averageSalesPerMonth: parseFloat(totalSales / months) || 0
      },
      data
    });
  } catch (err) {
    console.error('Error getSalesReport:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil laporan penjualan', 
      error: err.message 
    });
  }
};

/**
 * @function getEnrollmentTrends
 * @description Mengambil tren enrollment (daily untuk last 30 days)
 * @route GET /api/v1/admin/reports/enrollment-trends
 * @access Private/Admin
 */
const getEnrollmentTrends = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query enrollment per hari
    const dailyEnrollments = await UserEnrollment.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('enrolled_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('amount_paid')), 'daily_revenue']
      ],
      where: {
        enrolled_at: { [Op.gte]: thirtyDaysAgo },
        status: 'success'
      },
      group: [Sequelize.fn('DATE', Sequelize.col('enrolled_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('enrolled_at')), 'ASC']],
      raw: true
    });

    const data = dailyEnrollments.map(de => ({
      date: de.date,
      enrollments: parseInt(de.count),
      revenue: parseFloat(de.daily_revenue) || 0
    }));

    return res.status(200).json({
      success: true,
      period: '30 days',
      data
    });
  } catch (err) {
    console.error('Error getEnrollmentTrends:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil tren enrollment', 
      error: err.message 
    });
  }
};

/**
 * @function getCertificateStats
 * @description Mengambil statistik sertifikat
 * @route GET /api/v1/admin/reports/certificate-stats
 * @access Private/Admin
 */
const getCertificateStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.count();
    
    const certificatesIssuedThisMonth = await Certificate.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setDate(1))
        }
      }
    });

    // Certificates per learning path
    const certificatesByLearningPath = await Certificate.findAll({
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

    return res.status(200).json({
      success: true,
      data: {
        totalIssued: totalCertificates,
        issuedThisMonth: certificatesIssuedThisMonth,
        topLearningPaths: certificatesByLearningPath.map(c => ({
          pathTitle: c.LearningPath?.title || 'Unknown',
          certificateCount: parseInt(c.dataValues.count)
        }))
      }
    });
  } catch (err) {
    console.error('Error getCertificateStats:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil statistik sertifikat', 
      error: err.message 
    });
  }
};

module.exports = {
  getUserAnalytics,
  getCoursePerformance,
  getSalesReport,
  getEnrollmentTrends,
  getCertificateStats
};
