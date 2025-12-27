// Script untuk testing certificate flow
// Email: dimasdrn21@gmail.com
// Password: dimasganteng

const db = require('../models');
const bcrypt = require('bcryptjs');
const { generateCustomId } = require('../src/utils/idGenerator');

async function setupTestCertificateFlow() {
    try {
        console.log('🚀 Starting certificate flow test setup...\n');

        // 1. Find or create user
        const userEmail = 'drn211103@gmail.com';
        let user = await db.User.findOne({ where: { email: userEmail } });

        if (!user) {
            console.log('📝 Creating test user...');
            const hashedPassword = await bcrypt.hash('dimasganteng', 10);
            user = await db.User.create({
                email: userEmail,
                password: hashedPassword,
                username: 'dims the meet guy',
                role: 'user',
                status: 'active'
            });
            console.log('✅ User created:', user.email);
        } else {
            console.log('✅ User found:', user.email);
        }

        // 2. Get first available course
        const course = await db.Course.findOne({
            where: { status: 'published' }
        });

        if (!course) {
            console.log('❌ No published course found. Please create a course first.');
            return;
        }

        console.log('✅ Course found:', course.title);

        // 3. Check if enrollment exists
        let enrollment = await db.UserEnrollment.findOne({
            where: {
                user_id: user.id,
                course_id: course.id
            }
        });

        if (!enrollment) {
            console.log('📝 Creating enrollment...');
            enrollment = await db.UserEnrollment.create({
                id: generateCustomId('ENR'),
                user_id: user.id,
                course_id: course.id,
                status: 'success',
                payment_status: 'completed',
                enrolled_at: new Date()
            });
            console.log('✅ Enrollment created');
        } else {
            console.log('✅ Enrollment exists, updating to success...');
            enrollment.status = 'success';
            enrollment.payment_status = 'completed';
            await enrollment.save();
        }

        // 4. Get all modules in the course
        const modules = await db.Module.findAll({
            where: { course_id: course.id }
        });

        console.log(`📚 Found ${modules.length} modules in course`);

        if (modules.length === 0) {
            console.log('⚠️  No modules found. Course needs modules to test certificate flow.');
            console.log('   You can still test, but ideally add some modules to the course.');
        }

        // 5. Mark all modules as completed
        for (const module of modules) {
            let progress = await db.UserModuleProgress.findOne({
                where: {
                    user_id: user.id,
                    module_id: module.id
                }
            });

            if (!progress) {
                progress = await db.UserModuleProgress.create({
                    user_id: user.id,
                    module_id: module.id,
                    is_completed: true,
                    completed_at: new Date()
                });
                console.log(`  ✅ Module "${module.judul}" marked as completed`);
            } else if (!progress.is_completed) {
                progress.is_completed = true;
                progress.completed_at = new Date();
                await progress.save();
                console.log(`  ✅ Module "${module.judul}" updated to completed`);
            } else {
                console.log(`  ✓  Module "${module.judul}" already completed`);
            }
        }

        // 6. Check if certificate already exists
        const existingCert = await db.Certificate.findOne({
            where: {
                user_id: user.id,
                course_id: course.id
            }
        });

        if (existingCert) {
            console.log('\n⚠️  Certificate already exists for this user+course:');
            console.log(`   Certificate ID: ${existingCert.id}`);
            console.log(`   Status: ${existingCert.status}`);
            console.log(`   URL: ${existingCert.certificate_url || 'Not generated yet'}`);
            console.log('\n   To test again, you can delete this certificate from admin panel.');
        }

        console.log('\n✅ ===== SETUP COMPLETE =====');
        console.log('\n📋 Test Summary:');
        console.log(`   User: ${user.username} (${user.email})`);
        console.log(`   Course: ${course.title}`);
        console.log(`   Course ID: ${course.id}`);
        console.log(`   Modules Completed: ${modules.length}/${modules.length}`);
        console.log(`   Enrollment Status: ${enrollment.status}`);
        console.log(`   Ready for Certificate: ${existingCert ? 'Already has certificate' : 'YES ✅'}`);

        console.log('\n🔬 Testing Steps:');
        console.log('   1. Login sebagai admin');
        console.log('   2. Buka halaman /admin/certificates');
        console.log(`   3. Lihat user "${user.username}" di tabel dengan kursus "${course.title}"`);
        console.log('   4. Klik "Buat Sertifikat"');
        console.log('   5. Pilih template (opsional) dan format');
        console.log('   6. Klik Generate');
        console.log('   7. Sertifikat akan dibuat dengan data:');
        console.log(`      - Recipient Name: ${user.username}`);
        console.log(`      - Course Title: ${course.title}`);
        console.log(`      - Instructor: ${course.mentor_name || 'Lentera Karir Instructor'}`);
        console.log(`      - Completion Date: ${new Date().toLocaleDateString('id-ID')}`);

        console.log('\n🎨 Template akan merge dengan data user otomatis!');
        console.log('   Backend certificateGenerator akan overlay text di atas template image.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the setup
setupTestCertificateFlow();
