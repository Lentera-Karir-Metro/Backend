require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmailSend = async () => {
  console.log('=== Testing Gmail SMTP Connection ===');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass:', process.env.EMAIL_PASS ? '****** (SET)' : 'NOT SET');
  console.log('');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true // Enable debug output
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified!');
    console.log('');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Lentera Karir Test" <' + process.env.EMAIL_USER + '>',
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Test Email - Lentera Karir',
      html: '<h1>Email Configuration Works!</h1><p>Your email settings are correct.</p>'
    });

    console.log('✓ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('✗ Email test failed!');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.command) console.error('Command:', error.command);
  }
};

testEmailSend();
