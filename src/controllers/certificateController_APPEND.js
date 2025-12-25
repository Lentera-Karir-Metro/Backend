/**
 * @function getUserCertificateStatus
 * @description User - Cek status sertifikat untuk course tertentu
 * @route GET /api/v1/certificates/status/:course_id
 */
exports.getUserCertificateStatus = async (req, res) => {
    const userId = req.user.id;
    const { course_id } = req.params;

    try {
        // Cek apakah sudah enroll
        const enrollment = await db.UserEnrollment.findOne({
            where: { user_id: userId, course_id: course_id, status: 'success' }
        });

        if (!enrollment) {
            return res.status(400).json({ status: 'NOT_ENROLLED', message: 'Anda belum terdaftar di kursus ini.' });
        }

        // Cek apakah sudah punya sertifikat
        const cert = await Certificate.findOne({
            where: { user_id: userId, course_id: course_id }
        });

        if (cert) {
            return res.status(200).json({
                status: 'AVAILABLE',
                message: 'Sertifikat tersedia.',
                certificate_url: cert.certificate_url
            });
        }

        // Cek progres 100%
        const totalModules = await db.Module.count({ where: { course_id } });
        const completedModules = await db.UserModuleProgress.count({
            where: { user_id: userId, is_completed: true },
            include: [{ model: db.Module, as: 'module', where: { course_id } }]
        });

        if (completedModules < totalModules) {
            return res.status(200).json({
                status: 'INCOMPLETE',
                message: 'Sertifikat belum dapat diclaim karena belum menyelesaikan kursus.',
                progress: `${completedModules}/${totalModules}`
            });
        }

        // Jika selesai tapi belum ada sertifikat
        return res.status(200).json({
            status: 'WAITING',
            message: 'Mohon tunggu, sertifikat sedang diproses oleh admin.'
        });

    } catch (err) {
        console.error('Error getUserCertificateStatus:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * @function previewCertificate
 * @description Admin - Preview sertifikat sebelum generate
 * @route POST /api/v1/certificates/admin/preview
 */
exports.previewCertificate = async (req, res) => {
    const { user_id, course_id, template_id } = req.body;

    try {
        const user = await User.findByPk(user_id);
        const course = await db.Course.findByPk(course_id);

        if (!user || !course) {
            return res.status(404).json({ message: 'User or Course not found' });
        }

        let backgroundUrl = null;
        if (template_id) {
            const template = await CertificateTemplate.findByPk(template_id);
            if (template) {
                backgroundUrl = template.file_url;
            }
        }

        const certificateData = {
            recipient_name: user.username,
            course_title: course.title,
            instructor_name: course.mentor_name || 'Lentera Karir Instructor',
            completion_date: new Date(),
            background_url: backgroundUrl
        };

        // Buat path temporary untuk preview
        const tempDir = path.join(__dirname, '../../public/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const fileName = `preview-${user_id}-${course_id}-${Date.now()}.png`;
        const outputPath = path.join(tempDir, fileName);

        await generateCertificatePNG(certificateData, outputPath);

        // Kirim file image sebagai response
        res.sendFile(outputPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Hapus file setelah dikirim
            setTimeout(() => {
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            }, 10000);
        });

    } catch (err) {
        console.error('Error previewCertificate:', err);
        return res.status(500).json({ message: 'Gagal membuat preview sertifikat', error: err.message });
    }
};

/**
 * @function getCertificateCandidates
 * @description Admin - Mengambil daftar user yang sudah menyelesaikan kursus tapi belum punya sertifikat.
 * @route GET /api/v1/certificates/admin/candidates
 */
exports.getCertificateCandidates = async (req, res) => {
    try {
        const enrollments = await db.UserEnrollment.findAll({
            where: { status: 'success' },
            include: [
                { model: User, as: 'User', attributes: ['id', 'username', 'email'] },
                { model: db.Course, as: 'Course', attributes: ['id', 'title', 'mentor_name'] }
            ]
        });

        const candidates = [];

        for (const enrollment of enrollments) {
            if (!enrollment.User || !enrollment.Course) continue;

            const userId = enrollment.user_id;
            const courseId = enrollment.course_id;

            const existingCert = await Certificate.findOne({
                where: { user_id: userId, course_id: courseId }
            });

            if (existingCert) continue;

            const totalModules = await db.Module.count({ where: { course_id: courseId } });
            if (totalModules === 0) continue;

            const completedModulesCount = await db.UserModuleProgress.count({
                where: { user_id: userId, is_completed: true },
                include: [{ model: db.Module, as: 'module', where: { course_id: courseId } }]
            });

            if (completedModulesCount === totalModules) {
                const lastProgress = await db.UserModuleProgress.findOne({
                    where: { user_id: userId, is_completed: true },
                    include: [{ model: db.Module, as: 'module', where: { course_id: courseId } }],
                    order: [['updatedAt', 'DESC']]
                });

                candidates.push({
                    user_id: userId,
                    user_name: enrollment.User.username,
                    user_email: enrollment.User.email,
                    course_id: courseId,
                    course_title: enrollment.Course.title,
                    mentor_name: enrollment.Course.mentor_name,
                    completed_at: lastProgress ? lastProgress.updatedAt : new Date(),
                    status: 'Waiting for Certificate'
                });
            }
        }

        return res.status(200).json({ success: true, data: candidates });

    } catch (err) {
        console.error('Error getCertificateCandidates:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kandidat sertifikat.',
            error: err.message
        });
    }
};
