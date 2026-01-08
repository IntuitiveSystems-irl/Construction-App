import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend with API key from environment (optional for development)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async ({ to, subject, html, text, from, attachments }) => {
  try {
    if (!resend) {
      console.warn('[Resend] API key not configured, skipping email');
      console.log('\n=== EMAIL NOT SENT (No Configuration) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', html || text);
      console.log('Attachments:', attachments ? attachments.length : 0);
      console.log('Configure RESEND_API_KEY in .env to send real emails');
      console.log('==========================================\n');
      return { success: false, message: 'Email service not configured' };
    }

    const emailOptions = {
      from: from || process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to,
      subject,
      html: html || text
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    const response = await resend.emails.send(emailOptions);

    console.log('[Resend] Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Resend Error] Failed to send email:', error);
    throw error;
  }
};
