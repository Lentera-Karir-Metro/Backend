-- =====================================================
-- MODULES FOR 22 EXISTING COURSES (FINAL VERSION)
-- =====================================================
-- Each course has 4 modules: 2 videos, 1 ebook, 1 quiz
-- Total: 88 modules (MD-000235 to MD-000322)
-- =====================================================

-- Course: SEO & Content Marketing (CR-000007)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000235', 'CR-000007', 'Keyword Research & On-Page SEO', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000236', 'CR-000007', 'Link Building Strategies', 'video', 2, 28, 28, NOW(), NOW()),
('MD-000237', 'CR-000007', 'Content Marketing Best Practices', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000238', 'CR-000007', 'SEO Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Social Media Marketing (CR-000008)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000239', 'CR-000008', 'Social Media Strategy', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000240', 'CR-000008', 'Content Creation for Social Media', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000241', 'CR-000008', 'Community Management Guide', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000242', 'CR-000008', 'Social Media Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Email & Ads Campaign (CR-000009)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000243', 'CR-000009', 'Email Campaign Strategy', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000244', 'CR-000009', 'Google Ads & Facebook Ads', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000245', 'CR-000009', 'Ad Copywriting Techniques', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000246', 'CR-000009', 'Campaign Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Dart Programming Basics (CR-000010)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000247', 'CR-000010', 'Dart Syntax & Variables', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000248', 'CR-000010', 'OOP in Dart', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000249', 'CR-000010', 'Async Programming Guide', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000250', 'CR-000010', 'Dart Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Flutter UI Development (CR-000011)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000251', 'CR-000011', 'Flutter Widgets Fundamentals', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000252', 'CR-000011', 'Layouts & Responsive Design', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000253', 'CR-000011', 'Material Design Guide', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000254', 'CR-000011', 'Flutter UI Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: State Management & API (CR-000012)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000255', 'CR-000012', 'Provider & Riverpod', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000256', 'CR-000012', 'REST API Integration', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000257', 'CR-000012', 'State Management Patterns', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000258', 'CR-000012', 'State Management Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Publishing to Store (CR-000013)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000259', 'CR-000013', 'App Store Guidelines', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000260', 'CR-000013', 'Build & Release Process', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000261', 'CR-000013', 'App Store Optimization', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000262', 'CR-000013', 'Publishing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Security Fundamentals (CR-000014)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000263', 'CR-000014', 'Information Security Basics', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000264', 'CR-000014', 'Network Security Fundamentals', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000265', 'CR-000014', 'Cryptography Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000266', 'CR-000014', 'Security Fundamentals Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Ethical Hacking (CR-000015)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000267', 'CR-000015', 'Penetration Testing Methodology', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000268', 'CR-000015', 'Web Application Hacking', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000269', 'CR-000015', 'Ethical Hacking Techniques', 'ebook', 3, NULL, 35, NOW(), NOW()),
('MD-000270', 'CR-000015', 'Ethical Hacking Quiz', 'quiz', 4, NULL, 25, NOW(), NOW());

-- Course: Security Tools & Defense (CR-000016)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000271', 'CR-000016', 'Security Tools Overview', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000272', 'CR-000016', 'Firewall & IDS/IPS', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000273', 'CR-000016', 'Defense Strategies', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000274', 'CR-000016', 'Security Tools Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: AWS Core Services (CR-000017)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000275', 'CR-000017', 'EC2 & Compute Services', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000276', 'CR-000017', 'S3 & Storage Solutions', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000277', 'CR-000017', 'RDS & Database Services', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000278', 'CR-000017', 'AWS Core Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Serverless Architecture (CR-000018)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000279', 'CR-000018', 'Lambda Functions Deep Dive', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000280', 'CR-000018', 'Event-Driven Architecture', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000281', 'CR-000018', 'Serverless Best Practices', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000282', 'CR-000018', 'Serverless Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: DevOps & CI/CD on AWS (CR-000019)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000283', 'CR-000019', 'CodePipeline & CodeBuild', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000284', 'CR-000019', 'Infrastructure as Code', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000285', 'CR-000019', 'CI/CD Best Practices', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000286', 'CR-000019', 'DevOps Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Product Strategy & Vision (CR-000020)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000287', 'CR-000020', 'Defining Product Vision', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000288', 'CR-000020', 'Market Analysis & Positioning', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000289', 'CR-000020', 'Product Roadmapping', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000290', 'CR-000020', 'Product Strategy Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Agile & Scrum Framework (CR-000021)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000291', 'CR-000021', 'Agile Principles & Values', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000292', 'CR-000021', 'Scrum Events & Artifacts', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000293', 'CR-000021', 'Sprint Planning Guide', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000294', 'CR-000021', 'Agile Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Analytics & Metrics (CR-000022)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000295', 'CR-000022', 'Product Analytics Tools', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000296', 'CR-000022', 'Defining Success Metrics', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000297', 'CR-000022', 'Data-Driven Decision Making', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000298', 'CR-000022', 'Analytics Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Blockchain Fundamentals (CR-000023)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000299', 'CR-000023', 'Blockchain Architecture', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000300', 'CR-000023', 'Consensus Mechanisms', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000301', 'CR-000023', 'Cryptocurrency Basics', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000302', 'CR-000023', 'Blockchain Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Smart Contracts with Solidity (CR-000024)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000303', 'CR-000024', 'Solidity Syntax & Data Types', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000304', 'CR-000024', 'Writing Smart Contracts', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000305', 'CR-000024', 'Smart Contract Patterns', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000306', 'CR-000024', 'Solidity Quiz', 'quiz', 4, NULL, 25, NOW(), NOW());

-- Course: dApps Development (CR-000025)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000307', 'CR-000025', 'Web3.js & Ethers.js', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000308', 'CR-000025', 'Building dApp Frontend', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000309', 'CR-000025', 'dApp Architecture Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000310', 'CR-000025', 'dApps Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Course: Content Strategy & Planning (CR-000026)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000311', 'CR-000026', 'Content Pillars & Themes', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000312', 'CR-000026', 'Content Calendar Planning', 'video', 2, 28, 28, NOW(), NOW()),
('MD-000313', 'CR-000026', 'Audience Research Guide', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000314', 'CR-000026', 'Content Strategy Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Video Editing Basics (CR-000027)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000315', 'CR-000027', 'Video Editing Fundamentals', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000316', 'CR-000027', 'Transitions & Effects', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000317', 'CR-000027', 'Adobe Premiere Pro Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000318', 'CR-000027', 'Video Editing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Course: Motion Graphics & Effects (CR-000028)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000319', 'CR-000028', 'After Effects Basics', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000320', 'CR-000028', 'Animation Techniques', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000321', 'CR-000028', 'Motion Graphics Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000322', 'CR-000028', 'Motion Graphics Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ 88 Modules Added (MD-000235 to MD-000322)
-- ✅ Covering 22 courses across 6 learning paths
-- ✅ Each course has 4 modules (2 video, 1 ebook, 1 quiz)
-- ✅ Course IDs: CR-000007 to CR-000028
-- ✅ NO DUPLICATE IDs - Safe to execute
-- =====================================================
