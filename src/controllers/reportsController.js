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
  Module,
  UserModuleProgress,
  UserQuizAttempt,
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
 * @function getClassPerformance
 * @description Mengambil performa kelas (Courses) untuk UI Report & Monitoring.
 * Menampilkan Judul Kelas, Kategori, dan Jumlah Enroll.
 * @route GET /api/v1/admin/reports/class-performance
 */
const getClassPerformance = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    // Filter enrollment date if provided
    const enrollmentWhere = {};
    if (startDate && endDate) {
      enrollmentWhere.enrolled_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Ambil Courses dengan enrollments count
    const { count, rows } = await Course.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'title', 'category'],
      include: [
        {
          model: UserEnrollment,
          as: 'enrollments',
          attributes: ['id'],
          where: Object.keys(enrollmentWhere).length > 0 ? enrollmentWhere : undefined,
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      order: [['title', 'ASC']]
    });

    const data = rows.map(course => ({
      id: course.id,
      title: course.title,
      category: course.category || 'Uncategorized',
      total_enrollments: course.enrollments ? course.enrollments.length : 0
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
    console.error('Error getClassPerformance:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil performa kelas', 
      error: err.message 
    });
  }
};

/**
 * @function getStudentPerformance
 * @description Mengambil performa belajar siswa untuk UI Report & Monitoring.
 * Menampilkan Nama, Jumlah Kelas, Progress Belajar.
 * @route GET /api/v1/admin/reports/student-performance
 */
const getStudentPerformance = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { role: 'user' }; // Only students
    if (search) {
      whereClause.username = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'username', 'email'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Get detailed performance data for each user
    const data = await Promise.all(rows.map(async (user) => {
      // 1. Count Enrolled Classes (by course)
      const enrolledClassesCount = await UserEnrollment.count({ where: { user_id: user.id } });

      // 2. Calculate Learning Progress
      // Ambil semua enrollments user beserta Course -> Module untuk hitung total module
      const enrollments = await UserEnrollment.findAll({
        where: { user_id: user.id },
        attributes: ['id'],
        include: [{
          model: Course,
          as: 'Course',
          attributes: ['id'],
          include: [{ model: Module, as: 'modules', attributes: ['id'] }]
        }]
      });

      // Count total modules
      let totalModules = 0;
      enrollments.forEach(enrollment => {
        if (enrollment.Course && enrollment.Course.modules) {
          totalModules += enrollment.Course.modules.length;
        }
      });

      // Count completed modules
      const completedModulesCount = await UserModuleProgress.count({
        where: { user_id: user.id }
      });

      let progressPercentage = 0;
      if (totalModules > 0) {
        progressPercentage = Math.min(100, Math.round((completedModulesCount / totalModules) * 100));
      }

      return {
        id: user.id,
        name: user.username,
        avatar_url: null,
        enrolled_classes: enrolledClassesCount,
        progress: `${progressPercentage}%`
      };
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
    console.error('Error getStudentPerformance:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil performa belajar siswa', 
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
    // Course performance: compute per Course (Course is product)
    const courses = await Course.findAll({
      attributes: ['id', 'title', 'price'],
      include: [{ model: UserEnrollment, as: 'enrollments', attributes: ['id','status','amount_paid'], required: false }]
    });

    const performanceData = await Promise.all(courses.map(async (c) => {
      const totalEnrollments = c.enrollments?.length || 0;
      const completedEnrollments = c.enrollments?.filter(e => e.status === 'success')?.length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
      const totalRevenue = c.enrollments?.reduce((sum, e) => sum + (parseFloat(e.amount_paid) || 0), 0) || 0;
      const moduleCount = await Module.count({ where: { course_id: c.id } });
      return {
        id: c.id,
        title: c.title,
        moduleCount,
        totalEnrollments,
        completedEnrollments,
        completionRate: `${completionRate}%`,
        revenue: parseFloat(totalRevenue) || 0,
        price: parseFloat(c.price) || 0
      };
    }));

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

    // Certificates per learning path (aggregate via course -> learning_path mapping)
    const [certificatesByLearningPath] = await db.sequelize.query(`
      SELECT lp.id AS id, lp.title AS title, COUNT(cer.id) AS count
      FROM Certificates cer
      JOIN Courses c ON cer.course_id = c.id
      JOIN LearningPathCourses lpc ON lpc.course_id = c.id
      JOIN LearningPaths lp ON lpc.learning_path_id = lp.id
      GROUP BY lp.id, lp.title
      ORDER BY count DESC
      LIMIT 10
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalIssued: totalCertificates,
        issuedThisMonth: certificatesIssuedThisMonth,
        topLearningPaths: certificatesByLearningPath.map(c => ({
          pathTitle: c.title || 'Unknown',
          certificateCount: parseInt(c.count)
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
  getClassPerformance,
  getStudentPerformance,
  getSalesReport,
  getEnrollmentTrends,
  getCertificateStats
};
