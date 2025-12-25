'use strict';

const bcrypt = require('bcryptjs');
const { generateCustomId } = require('../src/utils/idGenerator');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Users (skip admin - already created by previous seeder)
    const passwordHash = await bcrypt.hash('password123', 10);
    const studentId = generateCustomId('LT');

    // Cek apakah student sudah ada (hindari duplicate key saat seed dijalankan ulang)
    const existingStudent = await queryInterface.sequelize.query(
      `SELECT id FROM Users WHERE email = 'student@lenterakarir.com' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existingStudent.length === 0) {
      await queryInterface.bulkInsert('Users', [
        {
          id: studentId,
          username: 'Budi Santoso',
          email: 'student@lenterakarir.com',
          password: passwordHash,
          role: 'user',
          status: 'active',
          is_verified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } else {
      console.log('Student student@lenterakarir.com sudah ada. Lewati pembuatan user.');
    }

    // 2. Create Learning Paths
    const lpWebId = generateCustomId('LP');
    const lpDataId = generateCustomId('LP');

    await queryInterface.bulkInsert('LearningPaths', [
      {
        id: lpWebId,
        title: 'Full Stack Web Developer',
        description: 'Pelajari cara membangun website modern dari nol hingga mahir menggunakan teknologi terkini.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: lpDataId,
        title: 'Data Science Fundamentals',
        description: 'Memulai karir di bidang data dengan mempelajari Python, SQL, dan analisis data dasar.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 3. Create Courses for Web Dev LP
    const courseHtmlId = generateCustomId('CR');
    const courseJsId = generateCustomId('CR');

    await queryInterface.bulkInsert('Courses', [
      {
        id: courseHtmlId,
        title: 'HTML & CSS Dasar',
        description: 'Fondasi utama dalam pembuatan website.',
        price: 0.00,
        thumbnail_url: null,
        discount_amount: 0.00,
        category: 'All',
        mentor_name: null,
        mentor_title: null,
        mentor_photo_profile: null,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: courseJsId,
        title: 'JavaScript Modern',
        description: 'Membuat website menjadi interaktif dengan JavaScript.',
        price: 0.00,
        thumbnail_url: null,
        discount_amount: 0.00,
        category: 'All',
        mentor_name: null,
        mentor_title: null,
        mentor_photo_profile: null,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Map courses to learning paths via join table
    await queryInterface.bulkInsert('LearningPathCourses', [
      { id: generateCustomId('LPC'), learning_path_id: lpWebId, course_id: courseHtmlId, createdAt: new Date(), updatedAt: new Date() },
      { id: generateCustomId('LPC'), learning_path_id: lpWebId, course_id: courseJsId, createdAt: new Date(), updatedAt: new Date() }
    ]);

    // 4. Create Quizzes (Need to be created before Modules that reference them)
    const quizHtmlId = generateCustomId('QZ');
    const quizJsId = generateCustomId('QZ');

    await queryInterface.bulkInsert('Quizzes', [
      {
        id: quizHtmlId,
        course_id: courseHtmlId,
        title: 'Kuis Pemahaman HTML & CSS',
        pass_threshold: 0.7,
        duration_minutes: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: quizJsId,
        course_id: courseJsId,
        title: 'Kuis Logika JavaScript',
        pass_threshold: 0.75,
        duration_minutes: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 5. Create Modules
    const modHtmlVideoId = generateCustomId('MD');
    const modHtmlEbookId = generateCustomId('MD');
    const modHtmlQuizId = generateCustomId('MD');

    const modJsVideoId = generateCustomId('MD');
    const modJsQuizId = generateCustomId('MD');

    await queryInterface.bulkInsert('Modules', [
      // HTML Course Modules
      {
        id: modHtmlVideoId,
        course_id: courseHtmlId,
        title: 'Pengenalan HTML',
        video_url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE', // Sample video
        ebook_url: null,
        sequence_order: 1,
        quiz_id: null,
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: modHtmlEbookId,
        course_id: courseHtmlId,
        title: 'Panduan CSS Layout',
        video_url: null,
        ebook_url: 'https://example.com/css-guide.pdf',
        sequence_order: 2,
        quiz_id: null,
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: modHtmlQuizId,
        course_id: courseHtmlId,
        title: 'Evaluasi HTML & CSS',
        video_url: null,
        ebook_url: null,
        sequence_order: 3,
        quiz_id: quizHtmlId, // Link to Quiz
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // JS Course Modules
      {
        id: modJsVideoId,
        course_id: courseJsId,
        title: 'Variabel dan Tipe Data',
        video_url: 'https://www.youtube.com/watch?v=R9I85qyl6J4',
        ebook_url: null,
        sequence_order: 1,
        quiz_id: null,
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: modJsQuizId,
        course_id: courseJsId,
        title: 'Evaluasi JavaScript',
        video_url: null,
        ebook_url: null,
        sequence_order: 2,
        quiz_id: quizJsId, // Link to Quiz
        
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 6. Create Questions & Options (cek dulu untuk menghindari duplicate saat seed ulang)
    const existingQuestions = await queryInterface.sequelize.query(
      `SELECT id FROM Questions WHERE quiz_id IN ('${quizHtmlId}','${quizJsId}') LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let q1Id, q2Id, q3Id;
    if (existingQuestions.length === 0) {
      await queryInterface.bulkInsert('Questions', [
        {
          quiz_id: quizHtmlId,
          question_text: 'Apa kepanjangan dari HTML?',
          question_type: 'multiple_choice',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          quiz_id: quizHtmlId,
          question_text: 'Tag mana yang digunakan untuk membuat link?',
          question_type: 'multiple_choice',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          quiz_id: quizJsId,
          question_text: 'Manakah yang BUKAN tipe data primitif di JavaScript?',
          question_type: 'multiple_choice',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      // Ambil ID yang baru saja dibuat berdasarkan quiz_id dan question_text
      const q1 = await queryInterface.sequelize.query(
        `SELECT id FROM Questions WHERE quiz_id='${quizHtmlId}' AND question_text='Apa kepanjangan dari HTML?' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const q2 = await queryInterface.sequelize.query(
        `SELECT id FROM Questions WHERE quiz_id='${quizHtmlId}' AND question_text='Tag mana yang digunakan untuk membuat link?' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const q3 = await queryInterface.sequelize.query(
        `SELECT id FROM Questions WHERE quiz_id='${quizJsId}' AND question_text='Manakah yang BUKAN tipe data primitif di JavaScript?' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      q1Id = q1[0].id;
      q2Id = q2[0].id;
      q3Id = q3[0].id;

      // 7. Create Options
      await queryInterface.bulkInsert('Options', [
        // Options for Q1 (HTML)
        {
          question_id: q1Id,
          option_text: 'Hyper Text Markup Language',
          is_correct: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          question_id: q1Id,
          option_text: 'High Text Markup Language',
          is_correct: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          question_id: q1Id,
          option_text: 'Hyper Tool Markup Language',
          is_correct: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Options for Q2 (Link)
        {
          question_id: q2Id,
          option_text: '<a>',
          is_correct: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          question_id: q2Id,
          option_text: '<link>',
          is_correct: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Options for Q3 (JS)
        {
          question_id: q3Id,
          option_text: 'String',
          is_correct: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          question_id: q3Id,
          option_text: 'Boolean',
          is_correct: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          question_id: q3Id,
          option_text: 'Array',
          is_correct: true, // Array is object type in JS, not primitive
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    } else {
      console.log('Questions untuk demo sudah ada. Lewati pembuatan Questions & Options.');
    }

    // 8. Create Articles
    await queryInterface.bulkInsert('Articles', [
      {
        title: '5 Tips Sukses Karir di Bidang Teknologi',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        author: 'Admin Lentera',
        category: 'Career',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Mengenal Apa Itu Full Stack Developer',
        content: 'Full Stack Developer adalah seseorang yang menguasai baik Front-End maupun Back-End...',
        thumbnail_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
        author: 'Admin Lentera',
        category: 'Technology',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse order of creation to avoid foreign key constraints
    await queryInterface.bulkDelete('Options', null, {});
    await queryInterface.bulkDelete('Questions', null, {});
    await queryInterface.bulkDelete('Modules', null, {});
    await queryInterface.bulkDelete('Quizzes', null, {});
    await queryInterface.bulkDelete('Courses', null, {});
    await queryInterface.bulkDelete('LearningPaths', null, {});
    await queryInterface.bulkDelete('Users', { email: ['admin@lenterakarir.com', 'student@lenterakarir.com'] }, {});
    await queryInterface.bulkDelete('Articles', null, {});
  }
};
