const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    let info = await transporter.sendMail({
      from: `"Rooster App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('📨 Email sent to:', to, '| Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
