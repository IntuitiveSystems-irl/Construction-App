// SMS utility - supports both Twilio and email-to-SMS gateways
import nodemailer from 'nodemailer';

// Dynamic import for Twilio (handles both ES modules and CommonJS)
let twilioClient = null;
const getTwilioClient = async () => {
  if (!twilioClient) {
    try {
      const twilio = await import('twilio');
      const Twilio = twilio.default || twilio;
      twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
      // Fallback to require for CommonJS
      const twilio = require('twilio');
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }
  return twilioClient;
};

// Get Esendex account reference from API
const getEsendexAccountReference = async () => {
  try {
    const response = await fetch('https://api.esendex.com/v1.0/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.ESENDEX_API_TOKEN + ':').toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Esendex Accounts:', JSON.stringify(data, null, 2));
    
    // Extract the first account reference
    if (data.accounts && data.accounts.length > 0) {
      return data.accounts[0].reference;
    }
    
    throw new Error('No accounts found');
  } catch (error) {
    console.error('❌ Failed to get Esendex account reference:', error);
    throw error;
  }
};

// Check if Esendex is configured
const isEsendexConfigured = () => {
  return !!(process.env.ESENDEX_API_TOKEN);
};

// Esendex SMS sending (reliable SMS service)
const sendEsendexSMS = async ({ to, message }) => {
  try {
    // Format phone number for international format
    let phoneNumber = to;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+1' + phoneNumber.replace(/\D/g, '');
    }
    
    console.log(`📞 Esendex: Sending to ${phoneNumber}`);
    
    // Get account reference (from env or API)
    let accountReference = process.env.ESENDEX_ACCOUNT_REFERENCE;
    if (!accountReference) {
      console.log('🔍 Fetching Esendex account reference from API...');
      accountReference = await getEsendexAccountReference();
      console.log(`🔍 Found account reference: ${accountReference}`);
    }
    
    const response = await fetch('https://api.esendex.com/v1.0/messagedispatcher', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.ESENDEX_API_TOKEN + ':').toString('base64')}`,
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<messages>
  <accountreference>${accountReference}</accountreference>
  <message>
    <to>${phoneNumber}</to>
    <body>${message}</body>
  </message>
</messages>`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Esendex API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.text();
    console.log(`✅ Esendex SMS sent successfully`);
    console.log(`📊 Esendex Response:`, result);
    
    return {
      success: true,
      provider: 'esendex',
      phone: phoneNumber,
      message: message,
      response: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Esendex SMS failed:', error);
    throw error;
  }
};

// Check if Twilio is configured
const isTwilioConfigured = () => {
  // Disabled - user prefers phone-based SMS
  return false;
};

// Manual SMS sending (email you the SMS to send manually)
const sendManualSMSRequest = async ({ to, message }) => {
  try {
    const transporter = createTransporter();
    
    const emailContent = `
📱 SMS REQUEST - Please send manually from your phone:

📞 TO: ${to}
💬 MESSAGE: ${message}

⏰ Time: ${new Date().toLocaleString()}
🏗️ From: Rooster Construction Management

---
Copy the message above and send it as SMS from your phone.
    `;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.YOUR_EMAIL,
      subject: `📱 SMS Request: Send to ${to}`,
      text: emailContent
    });
    
    console.log(`📧 SMS request emailed to ${process.env.YOUR_EMAIL}`);
    
    return {
      success: true,
      provider: 'manual-email',
      phone: to,
      message: message,
      emailedTo: process.env.YOUR_EMAIL,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Manual SMS request failed:', error);
    throw error;
  }
};

// Phone-based SMS sending (using your actual phone)
const sendPhoneSMS = async ({ to, message }) => {
  try {
    const response = await fetch(process.env.PHONE_SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PHONE_SMS_API_KEY}`
      },
      body: JSON.stringify({
        to: to,
        message: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Phone SMS API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Phone SMS sent via your phone`);
    
    return {
      success: true,
      provider: 'phone-api',
      phone: to,
      message: message,
      result: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Phone SMS failed:', error);
    throw error;
  }
};

// Twilio SMS sending (more reliable)
const sendTwilioSMS = async ({ to, message }) => {
  try {
    const client = await getTwilioClient();
    
    // Ensure phone number is in E.164 format
    let phoneNumber = to;
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+1' + phoneNumber.replace(/\D/g, '');
    }
    console.log(`📞 Formatted phone number: ${phoneNumber}`);
    
    const result = await client.messages.create({
      body: message,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber
    });
    
    console.log(`✅ Twilio SMS sent: ${result.sid}`);
    console.log(`📊 Twilio Response Details:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Direction: ${result.direction}`);
    console.log(`   Error Code: ${result.errorCode || 'None'}`);
    console.log(`   Error Message: ${result.errorMessage || 'None'}`);
    console.log(`   Price: ${result.price || 'Unknown'}`);
    console.log(`   Account SID: ${result.accountSid}`);
    console.log(`   From: ${result.from}`);
    console.log(`   To: ${result.to}`);
    console.log(`   Body: ${result.body}`);
    console.log(`   Date Created: ${result.dateCreated}`);
    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid,
      phone: to,
      message: message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Twilio SMS failed:', error);
    throw error;
  }
};

// Carrier email-to-SMS gateways (updated with comprehensive list)
const CARRIER_GATEWAYS = {
  'verizon': '@vtext.com', // Primary Verizon gateway
  'verizon_alt': '@vzwpix.com', // Alternative Verizon gateway (for MMS/longer messages)
  'verizon_alt2': '@vtext.com', // Backup Verizon gateway
  'att': '@txt.att.net',
  'tmobile': '@tmomail.net',
  'sprint': '@messaging.sprintpcs.com',
  'boost': '@myboostmobile.com',
  'cricket': '@sms.cricketwireless.net',
  'uscellular': '@email.uscc.net',
  'metropcs': '@mymetropcs.com',
  'virgin': '@vmobl.com',
  'tracfone': '@mmst5.tracfone.com',
  'charter': '@msg.charter.net',
  'spectrum': '@msg.charter.net',
  'comcast': '@comcastpcs.textmsg.com',
  'cox': '@cox.net',
  'frontier': '@txt.frontier.com'
};

// Carrier-specific SMTP configurations for better delivery
const CARRIER_SMTP_CONFIG = {
  'verizon': {
    host: 'smtp.verizon.net',
    port: 465,
    secure: true,
    priority: 1 // Highest priority for Verizon numbers
  },
  'att': {
    host: 'smtp.mail.att.net',
    port: 465,
    secure: true,
    priority: 2
  },
  'gmail': {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    priority: 3 // Good fallback
  },
  'default': {
    host: process.env.MAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true,
    priority: 4
  }
};

// Get carrier for phone number (placeholder - returns 'auto' for now)
const getCarrier = (phoneNumber) => {
  // TODO: Implement carrier lookup API
  // For now, return 'auto' to try all carriers
  return 'auto';
};

// Create email transporter with carrier-specific configuration
const createTransporter = (carrierConfig = null) => {
  const config = carrierConfig || CARRIER_SMTP_CONFIG.default;
  
  // Try Gmail first if configured (more reliable for SMS)
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS && !carrierConfig) {
    console.log('📧 Using Gmail SMTP for SMS delivery');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS // Use App Password, not regular password
      }
    });
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add timeout and connection options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,     // 5 seconds
    socketTimeout: 10000       // 10 seconds
  });
};

// Detect carrier from phone number (basic detection)
const detectCarrier = (phoneNumber) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const phone10 = cleanPhone.length === 11 && cleanPhone.startsWith('1') ? 
                 cleanPhone.substring(1) : cleanPhone;
  
  // Basic area code to carrier mapping (simplified)
  const areaCode = phone10.substring(0, 3);
  
  // Verizon area codes (expanded list for California and other states)
  const verizonCodes = [
    // California
    '760', '619', '858', '442', '951', '909', '626', '818', '323', '213',
    '805', '559', '661', '747', '424', '310', '562', '714', '949', '657',
    // Other states with strong Verizon presence
    '201', '551', '732', '848', '908', '973', // New Jersey
    '212', '646', '917', '347', '718', '929', // New York
    '703', '571', '540', '276', // Virginia
    '302', '484', '610', '215', '267', // Delaware/Pennsylvania
    '410', '443', '240', '301' // Maryland
  ];
  
  // AT&T area codes (common ones)
  const attCodes = [
    '214', '469', '972', '945', // Texas (Dallas)
    '713', '281', '832', '346', // Texas (Houston)
    '512', '737', // Texas (Austin)
    '404', '470', '678', '770', // Georgia (Atlanta)
    '205', '659', '938', '256', // Alabama
    '334', '251' // Alabama
  ];
  
  // T-Mobile area codes (common ones)
  const tmobileCodes = [
    '206', '253', '425', '564', // Washington
    '503', '971', '458', // Oregon
    '702', '725', // Nevada (Las Vegas)
    '480', '602', '623', '928' // Arizona
  ];
  
  if (verizonCodes.includes(areaCode)) {
    return 'verizon';
  }
  
  if (attCodes.includes(areaCode)) {
    return 'att';
  }
  
  if (tmobileCodes.includes(areaCode)) {
    return 'tmobile';
  }
  
  // Default to auto-detect if we can't determine carrier
  return 'auto';
};

// SMS sending function - tries Twilio first, falls back to email-to-SMS
export const sendSMS = async ({ to, message, carrier = 'auto' }) => {
  try {
    // Check Esendex configuration first
    const esendexConfigured = isEsendexConfigured();
    console.log(`🔍 Esendex configured: ${esendexConfigured}`);
    console.log(`🔍 ESENDEX_API_TOKEN: ${process.env.ESENDEX_API_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`🔍 ESENDEX_ACCOUNT_REFERENCE: ${process.env.ESENDEX_ACCOUNT_REFERENCE ? 'SET' : 'NOT SET'}`);
    
    // Try Esendex first if configured (reliable SMS service)
    if (esendexConfigured) {
      console.log('📱 Using Esendex SMS service');
      return await sendEsendexSMS({ to, message });
    }
    
    // Check Twilio configuration
    const twilioConfigured = isTwilioConfigured();
    console.log(`🔍 Twilio configured: ${twilioConfigured}`);
    
    // Try Twilio if configured
    if (twilioConfigured) {
      console.log('📱 Using Twilio SMS service');
      return await sendTwilioSMS({ to, message });
    }
    
    // Check for phone-based SMS API
    if (process.env.PHONE_SMS_API_URL && process.env.PHONE_SMS_API_KEY) {
      console.log('📱 Using phone-based SMS API');
      return await sendPhoneSMS({ to, message });
    }
    
    // Check for manual SMS mode (email you the SMS to send)
    if (process.env.MANUAL_SMS_MODE === 'true' && process.env.YOUR_EMAIL) {
      console.log('📧 Sending SMS request to your email for manual sending');
      return await sendManualSMSRequest({ to, message });
    }
    
    // Check if we should bypass email-to-SMS due to SMTP issues
    if (process.env.SMS_BYPASS_MODE === 'true') {
      console.log('📱 SMS_BYPASS_MODE enabled - simulating SMS delivery');
      console.log(`📱 Would send SMS to: ${to}`);
      console.log(`📱 Message: ${message}`);
      
      return {
        success: true,
        phone: to.replace(/\D/g, '').substring(-10),
        message: message,
        provider: 'bypass-mode',
        results: [{
          carrier: 'simulated',
          status: 'sent',
          timestamp: new Date().toISOString()
        }],
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('📱 Using email-to-SMS gateway (Twilio not configured)');
    
    const cleanPhone = to.replace(/\D/g, ''); // Remove non-digits
    const phone10 = cleanPhone.length === 11 && cleanPhone.startsWith('1') ? 
                   cleanPhone.substring(1) : cleanPhone;
    
    if (phone10.length !== 10) {
      throw new Error(`Invalid phone number format: ${to}`);
    }

    const results = [];
    
    if (carrier === 'auto') {
      // Detect carrier first, then try multiple gateways with prioritized SMTP
      const detectedCarrier = detectCarrier(to);
      console.log(`🔍 Detected carrier: ${detectedCarrier} for ${phone10}`);
      
      // Prioritize carriers based on detection and SMTP config
      let carriers = ['verizon', 'verizon_alt', 'att', 'tmobile', 'sprint', 'boost', 'cricket'];
      if (detectedCarrier !== 'auto') {
        // Move detected carrier to front, and add its alternative right after
        if (detectedCarrier === 'verizon') {
          carriers = ['verizon', 'verizon_alt', ...carriers.filter(c => c !== 'verizon' && c !== 'verizon_alt')];
        } else {
          carriers = [detectedCarrier, ...carriers.filter(c => c !== detectedCarrier)];
        }
      }
      
      // Skip carriers that require their own SMTP (use default SMTP only)
      const skipCarrierSMTP = ['verizon', 'att']; // These need their own email accounts
      
      let successfulSend = false;
      
      for (const carrierName of carriers) {
        const gateway = CARRIER_GATEWAYS[carrierName];
        const emailAddress = `${phone10}${gateway}`;
        
        // Use carrier-specific SMTP if available, but skip problematic ones
        const useDefaultSMTP = skipCarrierSMTP.includes(carrierName);
        const smtpConfig = useDefaultSMTP ? CARRIER_SMTP_CONFIG.default : (CARRIER_SMTP_CONFIG[carrierName] || CARRIER_SMTP_CONFIG.default);
        const transporter = createTransporter(smtpConfig);
        
        console.log(`📧 Trying ${carrierName} via ${smtpConfig.host}:${smtpConfig.port} ${useDefaultSMTP ? '(using default SMTP)' : ''}`);
        
        try {
          // Use Gmail address if Gmail is configured, otherwise use default
          const senderEmail = process.env.GMAIL_USER || process.env.EMAIL_FROM || process.env.EMAIL_USER;
          
          console.log(`📧 Sending email-to-SMS:`);
          console.log(`   From: ${senderEmail}`);
          console.log(`   To: ${emailAddress}`);
          console.log(`   Message: ${message}`);
          
          await transporter.sendMail({
            from: senderEmail,
            to: emailAddress,
            subject: '', // Empty subject for SMS
            text: message
          });
          
          results.push({
            carrier: carrierName,
            email: emailAddress,
            status: 'sent',
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ SMS sent via ${carrierName} to ${phone10}`);
          successfulSend = true;
          
          // If we successfully sent via the detected carrier, stop trying others
          if (carrierName === detectedCarrier) {
            console.log(`🎯 Successfully sent via detected carrier (${detectedCarrier}), stopping additional attempts`);
            break;
          }
          
          // If we sent via any carrier and it's the first successful attempt, try one more (the detected carrier if we haven't tried it)
          if (carrierName !== detectedCarrier && detectedCarrier !== 'auto') {
            continue; // Try the detected carrier too
          } else {
            break; // Stop after first successful send if no specific carrier detected
          }
          
        } catch (error) {
          results.push({
            carrier: carrierName,
            email: emailAddress,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          console.log(`❌ SMS failed via ${carrierName}: ${error.message}`);
          
          // If this was the detected carrier and it failed, continue trying others
          // Otherwise, if we've tried a few carriers without success, continue
        }
      }
    } else {
      // Send to specific carrier
      const gateway = CARRIER_GATEWAYS[carrier.toLowerCase()];
      if (!gateway) {
        throw new Error(`Unsupported carrier: ${carrier}`);
      }
      
      const emailAddress = `${phone10}${gateway}`;
      
      // Use carrier-specific SMTP if available
      const smtpConfig = CARRIER_SMTP_CONFIG[carrier.toLowerCase()] || CARRIER_SMTP_CONFIG.default;
      const transporter = createTransporter(smtpConfig);
      
      console.log(`📧 Sending via ${carrier} using ${smtpConfig.host}:${smtpConfig.port}`);
      
      // Use Gmail address if Gmail is configured, otherwise use default
      const senderEmail = process.env.GMAIL_USER || process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      await transporter.sendMail({
        from: senderEmail,
        to: emailAddress,
        subject: '', // Empty subject for SMS
        text: message
      });
      
      results.push({
        carrier: carrier,
        email: emailAddress,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ SMS sent via ${carrier} to ${phone10}`);
    }
    
    // Enhanced debug logging
    const successfulSends = results.filter(r => r.status === 'sent');
    const failedSends = results.filter(r => r.status === 'failed');
    
    console.log(`📊 SMS Debug Summary:`);
    console.log(`   Phone: ${phone10}`);
    console.log(`   Successful sends: ${successfulSends.length}`);
    console.log(`   Failed sends: ${failedSends.length}`);
    console.log(`   Results:`, JSON.stringify(results, null, 2));
    
    return {
      success: successfulSends.length > 0,
      phone: phone10,
      message: message,
      results: results,
      successfulSends: successfulSends.length,
      failedSends: failedSends.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
    throw error;
  }
};

// Phone number formatting utility
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as +1XXXXXXXXXX (no spaces) for email-to-SMS compatibility
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phoneNumber; // Return as-is if format is unclear
};

// Phone number validation
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Valid if 10 digits (US) or 11 digits starting with 1 (US with country code)
  return (cleaned.length === 10) || (cleaned.length === 11 && cleaned.startsWith('1'));
};

// Check if SMS is configured for real sending
export const isSMSConfigured = () => {
  return isTwilioConfigured();
};

// Environment variables required for Twilio SMS:
// TWILIO_ACCOUNT_SID - Your Twilio Account SID
// TWILIO_AUTH_TOKEN - Your Twilio Auth Token
// TWILIO_MESSAGING_SERVICE_SID - Your Twilio Messaging Service SID
