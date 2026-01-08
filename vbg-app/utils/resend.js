import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend with API key from environment (optional for development)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send appointment notification email to business
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<Object>} - Resend API response
 */
export async function sendAppointmentNotification(appointmentData) {
  try {
    if (!resend) {
      console.warn('[Resend] API key not configured, skipping email');
      return { success: false, message: 'Email service not configured' };
    }
    
    const { name, email, phone, appointment_type, preferred_date, preferred_time, description, notes } = appointmentData;
    
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: process.env.BUSINESS_EMAIL || 'admin@example.com',
      subject: `New Appointment Request: ${name || email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">New Appointment Request</h2>
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name || 'N/A'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Appointment Type:</strong> ${appointment_type}</p>
            <p><strong>Preferred Date:</strong> ${preferred_date}</p>
            <p><strong>Preferred Time:</strong> ${preferred_time}</p>
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });

    console.log('[Resend] Appointment notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Resend Error] Failed to send appointment notification:', error);
    throw error;
  }
}

/**
 * Send confirmation email to customer
 * @param {Object} customerData - Customer details
 * @returns {Promise<Object>} - Resend API response
 */
export async function sendCustomerConfirmation(customerData) {
  try {
    if (!resend) {
      console.warn('[Resend] API key not configured, skipping email');
      return { success: false, message: 'Email service not configured' };
    }
    
    const { name, email, appointment_type, preferred_date, preferred_time } = customerData;
    const firstName = name ? name.split(' ')[0] : '';
    
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: email,
      subject: 'Appointment Request Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">Thank You for Your Appointment Request!</h2>
          <p>Hi${firstName ? ' ' + firstName : ''},</p>
          <p>We've received your appointment request and will get back to you shortly to confirm.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0891b2; margin-top: 0;">Request Details:</h3>
            <p><strong>Type:</strong> ${appointment_type}</p>
            <p><strong>Preferred Date:</strong> ${preferred_date}</p>
            <p><strong>Preferred Time:</strong> ${preferred_time}</p>
          </div>

          <p>If you have any questions or need to make changes, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>
          <strong>Veritas Building Group</strong></p>
        </div>
      `
    });

    console.log('[Resend] Customer confirmation sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Resend Error] Failed to send customer confirmation:', error);
    throw error;
  }
}

/**
 * Send general notification email
 * @param {Object} emailData - Email details {to, subject, html}
 * @returns {Promise<Object>} - Resend API response
 */
export async function sendEmail(emailData) {
  try {
    if (!resend) {
      console.warn('[Resend] API key not configured, skipping email');
      return { success: false, message: 'Email service not configured' };
    }
    
    const { to, subject, html, from } = emailData;
    
    const response = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to,
      subject,
      html
    });

    console.log('[Resend] Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[Resend Error] Failed to send email:', error);
    throw error;
  }
}

export default resend;
