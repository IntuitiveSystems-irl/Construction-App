import nodemailer from 'nodemailer';

// Create transporter using SMTP configuration
const createTransporter = () => {
  const emailHost = process.env.MAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email credentials not configured properly.');
    console.warn('Required: EMAIL_USER, EMAIL_PASS');
    return null;
  }
  
  // If no host specified, try Gmail as fallback
  const host = emailHost || 'smtp.gmail.com';
  const port = parseInt(emailPort) || (host.includes('gmail') ? 587 : 465);

  const config = {
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for other ports like 587
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      ciphers: 'SSLv3' // For compatibility with some SMTP servers
    },
    debug: true, // Enable debug logging
    logger: true // Enable logging
  };

  console.log('📧 Email transporter configured:', {
    host: host,
    port: config.port,
    user: emailUser,
    secure: config.secure
  });

  return nodemailer.createTransport(config);
};

let transporter = null;

// Lazy initialization of transporter
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Get transporter (lazy initialization)
    const currentTransporter = getTransporter();
    
    // If no transporter configured, fall back to console logging
    if (!currentTransporter) {
      console.log('\n=== EMAIL NOT SENT (No Configuration) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', html || text);
      console.log('Configure email credentials in .env to send real emails');
      console.log('==========================================\n');
      
      // Throw error to indicate email wasn't sent
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `"Rooster Construction" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text
    };

    const result = await currentTransporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', {
      to,
      subject,
      messageId: result.messageId
    });
    
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
};
