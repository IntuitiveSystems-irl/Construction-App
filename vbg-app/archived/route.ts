import { NextRequest, NextResponse } from 'next/server';

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

      // Extract user details
      const userEmail = attendees?.[0]?.email || '';
      const userName = attendees?.[0]?.name || '';
      const userPhone = attendees?.[0]?.phoneNumber || '';
      
      const adminEmails = ['niko@veribuilds.com', 'info@veribuilds.com'];
      const adminName = organizer?.name || 'Niko';

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

      // Send email to both admin emails
      for (const adminEmail of adminEmails) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002'}/api/send-appointment-email`, {
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
      }

      // Send confirmation email to user
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002'}/api/send-appointment-email`, {
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
