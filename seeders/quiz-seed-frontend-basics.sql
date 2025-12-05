-- ========================================
-- SEED DATA: Quiz Frontend Basics
-- ========================================
-- File: seeders/quiz-seed-frontend-basics.sql
-- 
-- Deskripsi:
-- Script SQL untuk mengisi data quiz "Frontend Basics" beserta
-- pertanyaan dan pilihan jawaban.
--
-- Cara menjalankan:
-- mysql -u root database_lentera_karir < quiz-seed-frontend-basics.sql
-- ========================================

USE database_lentera_karir;

-- ========================================
-- 1. INSERT QUIZ
-- ========================================
-- Insert quiz only if it doesn't already exist (idempotent)
INSERT INTO Quizzes (id, title, pass_threshold, createdAt, updatedAt)
SELECT 'QZ-000001','Frontend Basics Quiz',0.70,NOW(),NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Quizzes WHERE id = 'QZ-000001');

-- ========================================
-- 2. INSERT QUESTIONS
-- ========================================
-- Insert questions only when this quiz doesn't already have questions (idempotent)
-- Note: Questions.id is assumed to be auto-increment integer, so we don't provide `id`.
INSERT INTO Questions (quiz_id, question_text, createdAt, updatedAt)
SELECT 'QZ-000001', 'Apa kepanjangan dari HTML?', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE quiz_id = 'QZ-000001')
UNION ALL
SELECT 'QZ-000001', 'CSS digunakan untuk apa dalam web development?', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE quiz_id = 'QZ-000001')
UNION ALL
SELECT 'QZ-000001', 'Manakah yang bukan merupakan JavaScript framework?', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE quiz_id = 'QZ-000001')
UNION ALL
SELECT 'QZ-000001', 'Tag HTML mana yang digunakan untuk membuat hyperlink?', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE quiz_id = 'QZ-000001')
UNION ALL
SELECT 'QZ-000001', 'Apa fungsi dari DOM (Document Object Model)?', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Questions WHERE quiz_id = 'QZ-000001');

-- ========================================
-- 3. INSERT OPTIONS (Question 1)
-- ========================================
-- Insert options for each question. We lookup the question id by quiz_id + question_text.
-- We do not set Options.id here (let DB auto-generate) to avoid type/PK issues.
INSERT INTO Options (question_id, option_text, is_correct, createdAt, updatedAt)
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa kepanjangan dari HTML?' LIMIT 1), 'HyperText Markup Language', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa kepanjangan dari HTML?' AND o.option_text='HyperText Markup Language'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa kepanjangan dari HTML?' LIMIT 1), 'HighLevel Text Markup Language', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa kepanjangan dari HTML?' AND o.option_text='HighLevel Text Markup Language'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa kepanjangan dari HTML?' LIMIT 1), 'HyperTransfer Markup Language', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa kepanjangan dari HTML?' AND o.option_text='HyperTransfer Markup Language'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa kepanjangan dari HTML?' LIMIT 1), 'Home Tool Markup Language', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa kepanjangan dari HTML?' AND o.option_text='Home Tool Markup Language'
);

-- ========================================
-- 4. INSERT OPTIONS (Question 2)
-- ========================================
INSERT INTO Options (question_id, option_text, is_correct, createdAt, updatedAt)
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='CSS digunakan untuk apa dalam web development?' LIMIT 1), 'Styling dan desain tampilan website', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='CSS digunakan untuk apa dalam web development?' AND o.option_text='Styling dan desain tampilan website'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='CSS digunakan untuk apa dalam web development?' LIMIT 1), 'Membuat struktur website', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='CSS digunakan untuk apa dalam web development?' AND o.option_text='Membuat struktur website'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='CSS digunakan untuk apa dalam web development?' LIMIT 1), 'Mengelola database', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='CSS digunakan untuk apa dalam web development?' AND o.option_text='Mengelola database'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='CSS digunakan untuk apa dalam web development?' LIMIT 1), 'Membuat animasi 3D', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='CSS digunakan untuk apa dalam web development?' AND o.option_text='Membuat animasi 3D'
);

-- ========================================
-- 5. INSERT OPTIONS (Question 3)
-- ========================================
INSERT INTO Options (question_id, option_text, is_correct, createdAt, updatedAt)
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Manakah yang bukan merupakan JavaScript framework?' LIMIT 1), 'Django', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Manakah yang bukan merupakan JavaScript framework?' AND o.option_text='Django'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Manakah yang bukan merupakan JavaScript framework?' LIMIT 1), 'React', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Manakah yang bukan merupakan JavaScript framework?' AND o.option_text='React'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Manakah yang bukan merupakan JavaScript framework?' LIMIT 1), 'Vue', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Manakah yang bukan merupakan JavaScript framework?' AND o.option_text='Vue'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Manakah yang bukan merupakan JavaScript framework?' LIMIT 1), 'Angular', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Manakah yang bukan merupakan JavaScript framework?' AND o.option_text='Angular'
);

-- ========================================
-- 6. INSERT OPTIONS (Question 4)
-- ========================================
INSERT INTO Options (question_id, option_text, is_correct, createdAt, updatedAt)
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' LIMIT 1), '<a>', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' AND o.option_text='<a>'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' LIMIT 1), '<link>', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' AND o.option_text='<link>'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' LIMIT 1), '<href>', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' AND o.option_text='<href>'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' LIMIT 1), '<hyperlink>', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Tag HTML mana yang digunakan untuk membuat hyperlink?' AND o.option_text='<hyperlink>'
);

-- ========================================
-- 7. INSERT OPTIONS (Question 5)
-- ========================================
INSERT INTO Options (question_id, option_text, is_correct, createdAt, updatedAt)
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa fungsi dari DOM (Document Object Model)?' LIMIT 1), 'Merepresentasikan struktur HTML sebagai objek yang dapat dimanipulasi', 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa fungsi dari DOM (Document Object Model)?' AND o.option_text='Merepresentasikan struktur HTML sebagai objek yang dapat dimanipulasi'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa fungsi dari DOM (Document Object Model)?' LIMIT 1), 'Menyimpan data user di browser', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa fungsi dari DOM (Document Object Model)?' AND o.option_text='Menyimpan data user di browser'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa fungsi dari DOM (Document Object Model)?' LIMIT 1), 'Mengatur style CSS', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa fungsi dari DOM (Document Object Model)?' AND o.option_text='Mengatur style CSS'
)
UNION ALL
SELECT (SELECT id FROM Questions WHERE quiz_id='QZ-000001' AND question_text='Apa fungsi dari DOM (Document Object Model)?' LIMIT 1), 'Mengelola routing website', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
	SELECT 1 FROM Options o JOIN Questions q ON o.question_id = q.id
	WHERE q.quiz_id='QZ-000001' AND q.question_text='Apa fungsi dari DOM (Document Object Model)?' AND o.option_text='Mengelola routing website'
);

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Uncomment untuk verifikasi data yang sudah diinsert:
-- SELECT * FROM Quizzes WHERE id = 'QZ-000001';
-- SELECT * FROM Questions WHERE quiz_id = 'QZ-000001';
-- SELECT * FROM Options WHERE question_id IN (SELECT id FROM Questions WHERE quiz_id = 'QZ-000001');
