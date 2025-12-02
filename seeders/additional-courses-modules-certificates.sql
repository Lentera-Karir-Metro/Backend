-- =====================================================
-- ADDITIONAL COURSES DATA
-- =====================================================
-- Menambah courses untuk melengkapi setiap Learning Path
-- Total akan ada sekitar 60+ courses

-- Learning Path 1: Full Stack Web Development (LP-000001)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000034', 'LP-000001', 'Deployment & DevOps Fundamentals', 'Belajar deployment aplikasi ke production, CI/CD, dan DevOps practices', 4, NOW(), NOW()),
('CR-000035', 'LP-000001', 'Web Security Best Practices', 'Memahami keamanan web, OWASP Top 10, dan implementasi authentication/authorization', 5, NOW(), NOW()),
('CR-000036', 'LP-000001', 'Testing & Quality Assurance', 'Unit testing, integration testing, dan end-to-end testing untuk aplikasi full stack', 6, NOW(), NOW());

-- Learning Path 2: UI/UX Design Mastery (LP-000002)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000037', 'LP-000002', 'Advanced Prototyping Techniques', 'Membuat prototype interaktif dengan Figma, Adobe XD, dan Framer', 4, NOW(), NOW()),
('CR-000038', 'LP-000002', 'Accessibility Design (A11y)', 'Merancang interface yang accessible untuk semua pengguna', 5, NOW(), NOW()),
('CR-000039', 'LP-000002', 'Motion Design for UI', 'Menambahkan animasi dan micro-interactions yang meningkatkan user experience', 6, NOW(), NOW());

-- Learning Path 3: Data Science & Analytics (LP-000003)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000040', 'LP-000003', 'Deep Learning Fundamentals', 'Neural networks, CNN, RNN, dan implementasi dengan TensorFlow/PyTorch', 4, NOW(), NOW()),
('CR-000041', 'LP-000003', 'Natural Language Processing', 'Text processing, sentiment analysis, dan chatbot development', 5, NOW(), NOW()),
('CR-000042', 'LP-000003', 'Big Data Technologies', 'Hadoop, Spark, dan distributed computing untuk data skala besar', 6, NOW(), NOW());

-- Learning Path 4: Digital Marketing Pro (LP-000004)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000043', 'LP-000004', 'Marketing Analytics & Data-Driven Decisions', 'Google Analytics, Facebook Pixel, dan data analysis untuk marketing', 4, NOW(), NOW()),
('CR-000044', 'LP-000004', 'Influencer Marketing Strategy', 'Membangun campaign dengan influencer dan mengukur ROI', 5, NOW(), NOW()),
('CR-000045', 'LP-000004', 'Email Marketing Automation', 'Mailchimp, email campaigns, dan marketing automation tools', 6, NOW(), NOW());

-- Learning Path 5: Mobile App Development with Flutter (LP-000005)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000046', 'LP-000005', 'Advanced Flutter Animations', 'Custom animations, hero transitions, dan animated widgets', 4, NOW(), NOW()),
('CR-000047', 'LP-000005', 'Flutter Performance Optimization', 'Optimizing app performance, memory management, dan best practices', 5, NOW(), NOW()),
('CR-000048', 'LP-000005', 'Publishing to App Stores', 'Deploy ke Google Play Store dan Apple App Store', 6, NOW(), NOW());

-- Learning Path 6: Cybersecurity Essentials (LP-000006)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000049', 'LP-000006', 'Advanced Penetration Testing', 'Advanced exploitation techniques dan post-exploitation', 4, NOW(), NOW()),
('CR-000050', 'LP-000006', 'Security Operations Center (SOC)', 'SIEM tools, incident response, dan threat hunting', 5, NOW(), NOW()),
('CR-000051', 'LP-000006', 'Cloud Security', 'Securing AWS, Azure, dan GCP infrastructure', 6, NOW(), NOW());

-- Learning Path 7: AWS Cloud Practitioner (LP-000007)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000052', 'LP-000007', 'AWS Lambda & Serverless', 'Building serverless applications dengan AWS Lambda, API Gateway, dan DynamoDB', 4, NOW(), NOW()),
('CR-000053', 'LP-000007', 'AWS Security & Compliance', 'IAM, security groups, encryption, dan compliance best practices', 5, NOW(), NOW()),
('CR-000054', 'LP-000007', 'AWS Cost Optimization', 'Mengelola dan mengoptimalkan biaya cloud infrastructure', 6, NOW(), NOW());

-- Learning Path 8: Product Management Masterclass (LP-000008)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000055', 'LP-000008', 'Growth Product Management', 'Growth hacking, A/B testing, dan product-led growth strategies', 4, NOW(), NOW()),
('CR-000056', 'LP-000008', 'Product Analytics & Metrics', 'KPIs, OKRs, dan data-driven product decisions', 5, NOW(), NOW()),
('CR-000057', 'LP-000008', 'Stakeholder Management', 'Komunikasi dengan stakeholders, managing expectations, dan conflict resolution', 6, NOW(), NOW());

-- Learning Path 9: Blockchain & Web3 Development (LP-000009)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000058', 'LP-000009', 'DeFi Development', 'Building decentralized finance applications, liquidity pools, dan yield farming', 4, NOW(), NOW()),
('CR-000059', 'LP-000009', 'NFT Marketplace Development', 'Creating NFT marketplaces dengan OpenSea SDK dan IPFS', 5, NOW(), NOW()),
('CR-000060', 'LP-000009', 'Web3 Security & Auditing', 'Smart contract security, common vulnerabilities, dan audit practices', 6, NOW(), NOW());

-- Learning Path 10: Content Creation & Video Editing (LP-000010)
INSERT INTO Courses (id, learning_path_id, title, description, sequence_order, createdAt, updatedAt) VALUES
('CR-000061', 'LP-000010', 'Advanced Color Grading', 'Color correction, color grading techniques dengan DaVinci Resolve', 4, NOW(), NOW()),
('CR-000062', 'LP-000010', 'YouTube Algorithm & SEO', 'Optimizing content untuk YouTube algorithm, thumbnail design, dan audience retention', 5, NOW(), NOW()),
('CR-000063', 'LP-000010', 'Monetization Strategies', 'Berbagai cara monetize content: ads, sponsorship, merchandise, courses', 6, NOW(), NOW());

-- =====================================================
-- ADDITIONAL MODULES DATA
-- =====================================================
-- Menambah modules untuk courses yang baru dibuat

-- Modules untuk CR-000034: Deployment & DevOps Fundamentals
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000027', 'CR-000034', 'Introduction to DevOps', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000028', 'CR-000034', 'Docker Containerization', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000029', 'CR-000034', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000030', 'CR-000034', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000035: Web Security Best Practices
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000031', 'CR-000035', 'OWASP Top 10 Security Risks', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000032', 'CR-000035', 'Implementing Authentication', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000033', 'CR-000035', 'Security Testing', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000034', 'CR-000035', 'Web Security Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000036: Testing & Quality Assurance
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000035', 'CR-000036', 'Unit Testing Fundamentals', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000036', 'CR-000036', 'Integration Testing', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000037', 'CR-000036', 'E2E Testing with Cypress', 'video', 3, 35, 35, NOW(), NOW()),
('MD-000038', 'CR-000036', 'Testing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000037: Advanced Prototyping Techniques
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000039', 'CR-000037', 'Interactive Prototypes in Figma', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000040', 'CR-000037', 'Framer Motion Basics', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000041', 'CR-000037', 'Prototyping Guide', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000042', 'CR-000037', 'Prototyping Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000038: Accessibility Design (A11y)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000043', 'CR-000038', 'WCAG Guidelines', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000044', 'CR-000038', 'Color Contrast & Typography', 'video', 2, 20, 20, NOW(), NOW()),
('MD-000045', 'CR-000038', 'Screen Reader Optimization', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000046', 'CR-000038', 'A11y Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000039: Motion Design for UI
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000047', 'CR-000039', 'Animation Principles', 'video', 1, 22, 22, NOW(), NOW()),
('MD-000048', 'CR-000039', 'Micro-interactions', 'video', 2, 28, 28, NOW(), NOW()),
('MD-000049', 'CR-000039', 'Motion Design Tools', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000050', 'CR-000039', 'Motion Design Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000040: Deep Learning Fundamentals
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000051', 'CR-000040', 'Neural Networks Architecture', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000052', 'CR-000040', 'CNN for Image Recognition', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000053', 'CR-000040', 'RNN & LSTM', 'video', 3, 38, 38, NOW(), NOW()),
('MD-000054', 'CR-000040', 'Deep Learning Quiz', 'quiz', 4, NULL, 25, NOW(), NOW());

-- Modules untuk CR-000041: Natural Language Processing
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000055', 'CR-000041', 'Text Preprocessing', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000056', 'CR-000041', 'Sentiment Analysis', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000057', 'CR-000041', 'NLP with Transformers', 'video', 3, 45, 45, NOW(), NOW()),
('MD-000058', 'CR-000041', 'NLP Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000042: Big Data Technologies
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000059', 'CR-000042', 'Hadoop Ecosystem', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000060', 'CR-000042', 'Apache Spark Fundamentals', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000061', 'CR-000042', 'Big Data Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000062', 'CR-000042', 'Big Data Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000043: Marketing Analytics
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000063', 'CR-000043', 'Google Analytics 4 Setup', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000064', 'CR-000043', 'Facebook Pixel Implementation', 'video', 2, 22, 22, NOW(), NOW()),
('MD-000065', 'CR-000043', 'Data-Driven Marketing', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000066', 'CR-000043', 'Analytics Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000044: Influencer Marketing Strategy
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000067', 'CR-000044', 'Finding Right Influencers', 'video', 1, 20, 20, NOW(), NOW()),
('MD-000068', 'CR-000044', 'Campaign Planning', 'video', 2, 25, 25, NOW(), NOW()),
('MD-000069', 'CR-000044', 'Measuring ROI', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000070', 'CR-000044', 'Influencer Marketing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000045: Email Marketing Automation
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000071', 'CR-000045', 'Email List Building', 'video', 1, 18, 18, NOW(), NOW()),
('MD-000072', 'CR-000045', 'Mailchimp Automation', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000073', 'CR-000045', 'Email Copywriting', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000074', 'CR-000045', 'Email Marketing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000046: Advanced Flutter Animations
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000075', 'CR-000046', 'Custom Animations', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000076', 'CR-000046', 'Hero Transitions', 'video', 2, 28, 28, NOW(), NOW()),
('MD-000077', 'CR-000046', 'Animation Guide', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000078', 'CR-000046', 'Animation Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000047: Flutter Performance Optimization
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000079', 'CR-000047', 'Performance Profiling', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000080', 'CR-000047', 'Memory Management', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000081', 'CR-000047', 'Optimization Guide', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000082', 'CR-000047', 'Performance Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000048: Publishing to App Stores
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000083', 'CR-000048', 'Google Play Store Deployment', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000084', 'CR-000048', 'Apple App Store Submission', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000085', 'CR-000048', 'App Store Optimization', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000086', 'CR-000048', 'Publishing Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000049: Advanced Penetration Testing
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000087', 'CR-000049', 'Exploitation Techniques', 'video', 1, 40, 40, NOW(), NOW()),
('MD-000088', 'CR-000049', 'Post-Exploitation', 'video', 2, 38, 38, NOW(), NOW()),
('MD-000089', 'CR-000049', 'Pentesting Guide', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000090', 'CR-000049', 'Pentesting Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000050: Security Operations Center (SOC)
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000091', 'CR-000050', 'SIEM Tools Overview', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000092', 'CR-000050', 'Incident Response', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000093', 'CR-000050', 'Threat Hunting', 'video', 3, 35, 35, NOW(), NOW()),
('MD-000094', 'CR-000050', 'SOC Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000051: Cloud Security
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000095', 'CR-000051', 'AWS Security Best Practices', 'video', 1, 32, 32, NOW(), NOW()),
('MD-000096', 'CR-000051', 'Azure Security Center', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000097', 'CR-000051', 'Cloud Security Guide', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000098', 'CR-000051', 'Cloud Security Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000052: AWS Lambda & Serverless
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000099', 'CR-000052', 'Lambda Functions Basics', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000100', 'CR-000052', 'API Gateway Integration', 'video', 2, 35, 35, NOW(), NOW()),
('MD-000101', 'CR-000052', 'DynamoDB for Serverless', 'video', 3, 28, 28, NOW(), NOW()),
('MD-000102', 'CR-000052', 'Serverless Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000053: AWS Security & Compliance
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000103', 'CR-000053', 'IAM Best Practices', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000104', 'CR-000053', 'VPC Security', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000105', 'CR-000053', 'Compliance Frameworks', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000106', 'CR-000053', 'AWS Security Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000054: AWS Cost Optimization
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000107', 'CR-000054', 'Cost Management Tools', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000108', 'CR-000054', 'Reserved Instances', 'video', 2, 22, 22, NOW(), NOW()),
('MD-000109', 'CR-000054', 'Cost Optimization Guide', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000110', 'CR-000054', 'Cost Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000055: Growth Product Management
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000111', 'CR-000055', 'Growth Hacking Fundamentals', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000112', 'CR-000055', 'A/B Testing Framework', 'video', 2, 32, 32, NOW(), NOW()),
('MD-000113', 'CR-000055', 'Product-Led Growth', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000114', 'CR-000055', 'Growth PM Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000056: Product Analytics & Metrics
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000115', 'CR-000056', 'Defining KPIs', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000116', 'CR-000056', 'OKR Framework', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000117', 'CR-000056', 'Analytics Tools', 'video', 3, 28, 28, NOW(), NOW()),
('MD-000118', 'CR-000056', 'Metrics Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000057: Stakeholder Management
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000119', 'CR-000057', 'Effective Communication', 'video', 1, 22, 22, NOW(), NOW()),
('MD-000120', 'CR-000057', 'Managing Expectations', 'video', 2, 25, 25, NOW(), NOW()),
('MD-000121', 'CR-000057', 'Conflict Resolution', 'ebook', 3, NULL, 20, NOW(), NOW()),
('MD-000122', 'CR-000057', 'Stakeholder Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000058: DeFi Development
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000123', 'CR-000058', 'DeFi Protocols Overview', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000124', 'CR-000058', 'Liquidity Pool Development', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000125', 'CR-000058', 'Yield Farming Strategies', 'video', 3, 38, 38, NOW(), NOW()),
('MD-000126', 'CR-000058', 'DeFi Quiz', 'quiz', 4, NULL, 25, NOW(), NOW());

-- Modules untuk CR-000059: NFT Marketplace Development
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000127', 'CR-000059', 'NFT Standards (ERC-721/1155)', 'video', 1, 30, 30, NOW(), NOW()),
('MD-000128', 'CR-000059', 'IPFS for Storage', 'video', 2, 28, 28, NOW(), NOW()),
('MD-000129', 'CR-000059', 'Marketplace Smart Contracts', 'video', 3, 45, 45, NOW(), NOW()),
('MD-000130', 'CR-000059', 'NFT Quiz', 'quiz', 4, NULL, 20, NOW(), NOW());

-- Modules untuk CR-000060: Web3 Security & Auditing
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000131', 'CR-000060', 'Common Vulnerabilities', 'video', 1, 35, 35, NOW(), NOW()),
('MD-000132', 'CR-000060', 'Audit Tools & Techniques', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000133', 'CR-000060', 'Security Best Practices', 'ebook', 3, NULL, 30, NOW(), NOW()),
('MD-000134', 'CR-000060', 'Security Quiz', 'quiz', 4, NULL, 25, NOW(), NOW());

-- Modules untuk CR-000061: Advanced Color Grading
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000135', 'CR-000061', 'Color Theory for Video', 'video', 1, 25, 25, NOW(), NOW()),
('MD-000136', 'CR-000061', 'DaVinci Resolve Workflow', 'video', 2, 40, 40, NOW(), NOW()),
('MD-000137', 'CR-000061', 'LUTs and Presets', 'video', 3, 30, 30, NOW(), NOW()),
('MD-000138', 'CR-000061', 'Color Grading Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000062: YouTube Algorithm & SEO
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000139', 'CR-000062', 'YouTube Algorithm 2025', 'video', 1, 28, 28, NOW(), NOW()),
('MD-000140', 'CR-000062', 'Thumbnail Design Strategies', 'video', 2, 25, 25, NOW(), NOW()),
('MD-000141', 'CR-000062', 'Audience Retention Tactics', 'ebook', 3, NULL, 25, NOW(), NOW()),
('MD-000142', 'CR-000062', 'YouTube SEO Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- Modules untuk CR-000063: Monetization Strategies
INSERT INTO Modules (id, course_id, title, module_type, sequence_order, durasi_video_menit, estimasi_waktu_menit, createdAt, updatedAt) VALUES
('MD-000143', 'CR-000063', 'Ad Revenue Optimization', 'video', 1, 22, 22, NOW(), NOW()),
('MD-000144', 'CR-000063', 'Brand Deals & Sponsorships', 'video', 2, 30, 30, NOW(), NOW()),
('MD-000145', 'CR-000063', 'Digital Products', 'video', 3, 35, 35, NOW(), NOW()),
('MD-000146', 'CR-000063', 'Monetization Quiz', 'quiz', 4, NULL, 15, NOW(), NOW());

-- =====================================================
-- ADDITIONAL CERTIFICATES DATA
-- =====================================================
-- Menambah certificates untuk berbagai users yang menyelesaikan learning paths

-- Certificates untuk user LT-768548 (dimasdrn21)
INSERT INTO Certificates (id, user_id, learning_path_id, issued_date, certificate_url, createdAt, updatedAt) VALUES
('CERT-000005', 'LT-768548', 'LP-000002', '2025-11-20', 'https://certificates.lenterakarir.com/cert-000005.pdf', NOW(), NOW()),
('CERT-000006', 'LT-768548', 'LP-000005', '2025-11-25', 'https://certificates.lenterakarir.com/cert-000006.pdf', NOW(), NOW());

-- Certificates untuk user LT-130230 (zndanjay)
INSERT INTO Certificates (id, user_id, learning_path_id, issued_date, certificate_url, createdAt, updatedAt) VALUES
('CERT-000007', 'LT-130230', 'LP-000003', '2025-11-18', 'https://certificates.lenterakarir.com/cert-000007.pdf', NOW(), NOW()),
('CERT-000008', 'LT-130230', 'LP-000007', '2025-11-22', 'https://certificates.lenterakarir.com/cert-000008.pdf', NOW(), NOW()),
('CERT-000009', 'LT-130230', 'LP-000009', '2025-11-28', 'https://certificates.lenterakarir.com/cert-000009.pdf', NOW(), NOW());

-- Certificates untuk user LT-912152 (admin)
INSERT INTO Certificates (id, user_id, learning_path_id, issued_date, certificate_url, createdAt, updatedAt) VALUES
('CERT-000010', 'LT-912152', 'LP-000004', '2025-11-15', 'https://certificates.lenterakarir.com/cert-000010.pdf', NOW(), NOW()),
('CERT-000011', 'LT-912152', 'LP-000006', '2025-11-19', 'https://certificates.lenterakarir.com/cert-000011.pdf', NOW(), NOW()),
('CERT-000012', 'LT-912152', 'LP-000008', '2025-11-26', 'https://certificates.lenterakarir.com/cert-000012.pdf', NOW(), NOW()),
('CERT-000013', 'LT-912152', 'LP-000010', '2025-11-30', 'https://certificates.lenterakarir.com/cert-000013.pdf', NOW(), NOW());

-- =====================================================
-- SUMMARY
-- =====================================================
-- Total Courses Added: 30 courses baru (CR-000034 sampai CR-000063)
-- Total Modules Added: 120 modules baru (MD-000027 sampai MD-000146)
--   - Video modules: ~80 modules
--   - Ebook modules: ~20 modules
--   - Quiz modules: ~20 modules
-- Total Certificates Added: 9 certificates baru (CERT-000005 sampai CERT-000013)
--
-- Sekarang setiap Learning Path memiliki 6 courses (lengkap)
-- Setiap course memiliki rata-rata 4 modules
-- Total ada 63 courses dan 146 modules di database
-- =====================================================

