import { NextRequest, NextResponse } from 'next/server';

/**
 * Helper function to add delay between requests
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Cal.com Webhook Handler
 * Receives booking notifications and sends emails via Resend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📅 Cal.com webhook received:', body);

    // Cal.com sends different event types
    const { triggerEvent, payload } = body;
    
    if (triggerEvent === 'BOOKING_CREATED') {
      const {
        title,
        startTime,
        endTime,
        attendees,
        organizer,
        metadata,
        uid
      } = payload;

      // Extract user details from Cal.com
      const calEmail = attendees?.[0]?.email || '';
      const userName = attendees?.[0]?.name || '';
      const userPhone = attendees?.[0]?.phoneNumber || '';
      
      const adminEmails = ['niko@veribuilds.com', 'info@veribuilds.com'];
      const adminName = organizer?.name || 'Niko';

      // Look up user in VBG database to get their registered email
      let userEmail = calEmail;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.veribuilds.com';
      try {
        const userResponse = await fetch(`${API_URL}/api/user-by-email?email=${encodeURIComponent(calEmail)}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData && userData.email) {
            userEmail = userData.email;
            console.log(`📧 Found VBG user account: ${userEmail}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not look up user in database, using Cal.com email:', error);
      }

      // Format dates
      const bookingDate = new Date(startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const bookingTime = new Date(startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Send email to both admin emails with delay to respect rate limits
      // Resend free tier allows 2 requests per second
      for (let i = 0; i < adminEmails.length; i++) {
        const adminEmail = adminEmails[i];
        await fetch(`${API_URL}/api/send-appointment-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            type: 'admin',
            appointment: {
              title,
              userName,
              userEmail,
              userPhone,
              date: bookingDate,
              time: bookingTime,
              uid
            }
          })
        });
        
        // Add 600ms delay between emails to stay under 2 requests/second
        if (i < adminEmails.length - 1) {
          await delay(600);
        }
      }

      // Wait before sending customer email
      await delay(600);

      // Send confirmation email to user
      await fetch(`${API_URL}/api/send-appointment-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          type: 'user',
          appointment: {
            title,
            userName,
            userEmail,
            date: bookingDate,
            time: bookingTime,
            adminName,
            adminEmail: 'info@veribuilds.com'
          }
        })
      });

      console.log('✅ Appointment emails sent successfully');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Cal.com webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Verify webhook signature (optional but recommended)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Cal.com webhook endpoint is active',
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/cal-webhook`
  });
}
