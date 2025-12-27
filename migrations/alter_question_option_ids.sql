-- Script untuk mengubah ID Questions dan Options dari INTEGER ke VARCHAR(16)
-- Jalankan script ini di MySQL Workbench atau terminal MySQL

USE database_lentera_karir;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Alter Questions table
ALTER TABLE `Questions` 
  DROP PRIMARY KEY, 
  MODIFY COLUMN `id` VARCHAR(16) NOT NULL, 
  ADD PRIMARY KEY (`id`);

-- 2. Alter Options.question_id reference
ALTER TABLE `Options` 
  MODIFY COLUMN `question_id` VARCHAR(16) NOT NULL;

-- 3. Alter Options table
ALTER TABLE `Options` 
  DROP PRIMARY KEY, 
  MODIFY COLUMN `id` VARCHAR(16) NOT NULL, 
  ADD PRIMARY KEY (`id`);

-- 4. Alter UserQuizAnswers foreign key columns
ALTER TABLE `UserQuizAnswers` 
  MODIFY COLUMN `question_id` VARCHAR(16) NOT NULL,
  MODIFY COLUMN `selected_option_id` VARCHAR(16);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Mark migration as completed in SequelizeMeta
INSERT INTO `SequelizeMeta` (`name`) VALUES ('202512260001-alter-question-option-id-to-string.js');
