require('dotenv').config();
const nodemailer = require('nodemailer');

const testGmailConfigs = async () => {
  console.log('=== Testing Multiple Gmail SMTP Configurations ===\n');
  console.log('Email:', process.env.EMAIL_USER);
  console.log('Password:', process.env.EMAIL_PASS ? '****** (SET)' : 'NOT SET');
  console.log('');

  const configs = [
    {
      name: 'Port 587 (TLS/STARTTLS)',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      }
    },
    {
      name: 'Port 465 (SSL)',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    },
    {
      name: 'Port 25 (Plain)',
      config: {
        host: 'smtp.gmail.com',
        port: 25,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n📡 Testing: ${name}`);
    console.log(`   Host: ${config.host}:${config.port}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      // Test connection
      await transporter.verify();
      console.log('   ✓ Connection successful!');
      
      // Try sending test email
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Test Email - Lentera Karir',
        text: 'This is a test email from Lentera Karir backend.'
      });
      
      console.log('   ✓ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log(`   ✅ This configuration WORKS! Use port ${config.port}`);
      
      // If successful, no need to test other configs
      break;
    } catch (error) {
      console.log('   ✗ Failed:', error.message);
      if (error.code) console.log('   Code:', error.code);
    }
  }
  
  console.log('\n=== Test Complete ===');
};

testGmailConfigs();
