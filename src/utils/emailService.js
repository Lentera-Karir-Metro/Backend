const nodemailer = require('nodemailer');
let MailtrapClient;
try {
  ({ MailtrapClient } = require('mailtrap'));
} catch (_) {
  MailtrapClient = null;
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_USER,
  EMAIL_PASS,
  FROM_EMAIL,
  FROM_NAME,
  FRONTEND_URL,
  MAILTRAP_MODE,
  MAILTRAP_API_TOKEN,
  MAILTRAP_FROM_EMAIL,
  MAILTRAP_FROM_NAME,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USER,
  MAILTRAP_PASS,
} = process.env;

function createSmtpTransport() {
  if (!SMTP_HOST || !SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

function createGmailTransport() {
  if (!EMAIL_USER || !EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

function createJsonTransport() {
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendEmail({ to, subject, html, text }) {
  const fromAddress = FROM_EMAIL || EMAIL_USER || SMTP_USER || 'no-reply@example.com';
  const fromName = FROM_NAME || 'Lentera Karir';
  const from = `${fromName} <${fromAddress}>`;

  // 1) Mailtrap Sending via HTTP API (real delivery)
  if (MAILTRAP_MODE && MAILTRAP_MODE.toLowerCase() === 'sending' && MailtrapClient && MAILTRAP_API_TOKEN) {
    try {
      const client = new MailtrapClient({ token: MAILTRAP_API_TOKEN });
      const senderEmail = MAILTRAP_FROM_EMAIL || fromAddress;
      const senderName = MAILTRAP_FROM_NAME || fromName;
      const result = await client.send({
        from: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        html,
        text,
        category: 'verification'
      });
      return { ok: true, id: result?.message_ids?.[0] || 'mailtrap-api' };
    } catch (err) {
      // Fallthrough to SMTP options
    }
  }

  // 2) Mailtrap Testing (Sandbox) via SMTP
  const testingHost = MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
  const testingPort = Number(MAILTRAP_PORT || 2525);
  const hasTestingCreds = MAILTRAP_USER && MAILTRAP_PASS;
  const transports = [
    hasTestingCreds
      ? {
          name: 'Mailtrap Sandbox',
          transporter: nodemailer.createTransport({
            host: testingHost,
            port: testingPort,
            secure: false,
            auth: { user: MAILTRAP_USER, pass: MAILTRAP_PASS },
          })
        }
      : null,
    createSmtpTransport() ? { name: 'Generic SMTP', transporter: createSmtpTransport() } : null,
    createGmailTransport() ? { name: 'Gmail', transporter: createGmailTransport() } : null,
    { name: 'JSON Fallback (Fake)', transporter: createJsonTransport() },
  ].filter(Boolean);

  let lastError = null;
  for (const item of transports) {
    try {
      console.log(`[EmailService] Attempting to send via: ${item.name}...`);
      const info = await item.transporter.sendMail({ from, to, subject, html, text });
      console.log(`[EmailService] Success! Sent via ${item.name}. MessageID: ${info.messageId}`);
      
      if (item.name === 'JSON Fallback (Fake)') {
        console.warn('[EmailService] WARNING: Email was NOT sent to internet. It was captured by JSON Transport.');
        console.warn('[EmailService] Content Preview:', JSON.stringify(info));
      }
      
      return { ok: true, id: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Failed to send via ${item.name}: ${err.message}`);
      lastError = err;
      continue;
    }
  }
  return { ok: false, error: lastError?.message || 'Failed to send email' };
}

function buildVerificationHtml(verificationUrl) {
  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifikasi Akun Lentera Karir</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f6f8fb; margin:0; padding:0; }
      .container { max-width:600px; margin:24px auto; background:#fff; border-radius:8px; padding:24px; }
      .button { display:inline-block; background:#2563eb; color:#fff; padding:12px 16px; border-radius:6px; text-decoration:none; }
      .footer { margin-top:24px; color:#667085; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Verifikasi Email Anda</h2>
      <p>Terima kasih telah mendaftar di Lentera Karir. Klik tombol di bawah untuk memverifikasi email Anda:</p>
      <p><a href="${verificationUrl}" class="button">Verifikasi Email Saya</a></p>
      <p>Atau gunakan link berikut:</p>
      <p style="background:#eef2ff; padding:10px; word-break: break-all;">${verificationUrl}</p>
      <div class="footer">&copy; 2025 Lentera Karir</div>
    </div>
  </body>
</html>`;
}

async function sendVerificationEmail(email, token) {
  const base = FRONTEND_URL || 'http://localhost:3001';
  const verificationUrl = `${base}/auth/verify-email?token=${token}`;
  const subject = 'Verifikasi Akun Lentera Karir Anda';
  const html = buildVerificationHtml(verificationUrl);

  const result = await sendEmail({ to: email, subject, html });
  if (!result.ok) {
    throw new Error(result.error || 'Gagal mengirim email verifikasi');
  }
  return result;
}

function buildResetPasswordHtml(resetUrl) {
  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Password Lentera Karir</title>
    <style>
      body { font-family: Arial, sans-serif; background:#f6f8fb; margin:0; padding:0; }
      .container { max-width:600px; margin:24px auto; background:#fff; border-radius:8px; padding:24px; }
      .button { display:inline-block; background:#dc2626; color:#fff; padding:12px 16px; border-radius:6px; text-decoration:none; }
      .footer { margin-top:24px; color:#667085; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Permintaan Reset Password</h2>
      <p>Kami menerima permintaan untuk mereset password akun Lentera Karir Anda.</p>
      <p>Jika ini bukan Anda, abaikan email ini. Jika ini Anda, klik tombol di bawah:</p>
      <p><a href="${resetUrl}" class="button">Reset Password Saya</a></p>
      <p>Link ini hanya berlaku selama 1 jam.</p>
      <div class="footer">&copy; 2025 Lentera Karir</div>
    </div>
  </body>
</html>`;
}

async function sendResetPasswordEmail(email, token) {
  const base = process.env.FRONTEND_URL || 'http://localhost:3001';
  const resetUrl = `${base}/auth/reset-password?token=${token}`;
  const subject = 'Reset Password Lentera Karir';
  const html = buildResetPasswordHtml(resetUrl);

  const result = await sendEmail({ to: email, subject, html });
  if (!result.ok) {
    throw new Error(result.error || 'Gagal mengirim email reset password');
  }
  return result;
}

module.exports = { sendEmail, sendVerificationEmail, sendResetPasswordEmail };

