const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the Gmail SMTP transporter.
 * Uses App Password from .env — no signup required beyond generating the App Password.
 */
async function initMailer() {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify the connection on startup
    await transporter.verify();
    console.log('📧 Gmail SMTP connected successfully!');
    console.log(`   Sending from: ${process.env.FROM_EMAIL}`);
  } catch (err) {
    console.error('⚠️  Gmail SMTP connection failed:', err.message);
    console.log('   Email notifications will be skipped. Check SMTP_USER and SMTP_PASS in .env');
    transporter = null;
  }
}

/**
 * Send an email via Gmail SMTP.
 */
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`📧 [SKIPPED] No SMTP transporter. To: ${to} | Subject: ${subject}`);
    return { error: 'No transporter' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"E-ShopX 🛒" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log('\n📧 ─── EMAIL SENT ───────────────────────────────────────────');
    console.log(`   To       : ${to}`);
    console.log(`   Subject  : ${subject}`);
    console.log(`   Message  : ${info.messageId}`);
    console.log('   ✅ Check your Gmail inbox!');
    console.log('📧 ─────────────────────────────────────────────────────────\n');

    return { messageId: info.messageId };
  } catch (err) {
    console.error('📧 Failed to send email:', err.message);
    return { error: err.message };
  }
}

module.exports = { initMailer, sendEmail };
