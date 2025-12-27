// Script untuk menjalankan ALTER TABLE menggunakan Sequelize
const { sequelize } = require('./models');

async function alterTables() {
  try {
    console.log('Starting table alterations...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 1. Alter Questions table
    console.log('Altering Questions table...');
    await sequelize.query(`
      ALTER TABLE \`Questions\` 
        DROP PRIMARY KEY, 
        MODIFY COLUMN \`id\` VARCHAR(16) NOT NULL, 
        ADD PRIMARY KEY (\`id\`)
    `);
    
    // 2. Alter Options.question_id
    console.log('Altering Options.question_id...');
    await sequelize.query(`
      ALTER TABLE \`Options\` 
        MODIFY COLUMN \`question_id\` VARCHAR(16) NOT NULL
    `);
    
    // 3. Alter Options table
    console.log('Altering Options table...');
    await sequelize.query(`
      ALTER TABLE \`Options\` 
        DROP PRIMARY KEY, 
        MODIFY COLUMN \`id\` VARCHAR(16) NOT NULL, 
        ADD PRIMARY KEY (\`id\`)
    `);
    
    // 4. Alter UserQuizAnswers columns
    console.log('Altering UserQuizAnswers...');
    await sequelize.query(`
      ALTER TABLE \`UserQuizAnswers\` 
        MODIFY COLUMN \`question_id\` VARCHAR(16) NOT NULL,
        MODIFY COLUMN \`selected_option_id\` VARCHAR(16)
    `);
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // Mark migration as done
    await sequelize.query(`
      INSERT INTO \`SequelizeMeta\` (\`name\`) 
      VALUES ('202512260001-alter-question-option-id-to-string.js')
    `);
    
    console.log('✅ All tables altered successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error altering tables:', error);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    process.exit(1);
  }
}

alterTables();
