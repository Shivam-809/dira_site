import nodemailer from 'nodemailer';

// Create SMTP transporter using Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailProps) {
  try {
    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Using SMTP:', process.env.SMTP_HOST);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Dira Tarot <malhotrashivam809@gmail.com>',
      to,
      subject,
      html,
      text: text || subject,
    });

    console.log('✅ Email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('✅ To:', to);
    console.log('✅ Subject:', subject);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
}

// Send verification email helper
export async function sendVerificationEmail(email: string, token: string, url: string) {
  const verificationUrl = `${url}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Dira Tarot</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px;">
                    <h1 style="margin: 0; color: #6b21a8; font-size: 28px; font-family: 'Georgia', serif;">
                      ✨ Dira Tarot
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Verify Your Email Address</h2>
                    <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Thank you for signing up! Please verify your email address to complete your registration and access all features.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 30px 0;">
                          <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background-color: #6b21a8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0 0; color: #999; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; color: #6b21a8; font-size: 14px; word-break: break-all;">
                      ${verificationUrl}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                      If you didn't create an account with Dira Tarot, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 20px 40px; background-color: #f9f9f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      © ${new Date().getFullYear()} Dira Tarot. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✨ Verify Your Email - Dira Tarot',
    html,
    text: `Verify your email address by clicking this link: ${verificationUrl}`,
  });
}

// Send order status update email
interface OrderStatusEmailProps {
  to: string;
  userName: string;
  orderId: number;
  newStatus: string;
  trackingLink?: string;
}

export async function sendOrderStatusUpdateEmail({
  to,
  userName,
  orderId,
  newStatus,
  trackingLink,
}: OrderStatusEmailProps) {
  const statusColors: Record<string, string> = {
    confirmed: '#0ea5e9',
    processing: '#6366f1',
    shipped: '#2563eb',
    delivered: '#059669',
    cancelled: '#dc2626',
    refunded: '#db2777',
  };

  const color = statusColors[newStatus.toLowerCase()] || '#6b21a8';
  const displayStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Updated - Dira Tarot</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: 'Georgia', serif;">
                      ✨ Dira Tarot
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Hi ${userName},</h2>
                    <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Your order <strong>#${orderId}</strong> status has been updated.
                    </p>

                    <div style="background-color: ${color}10; border-left: 4px solid ${color}; padding: 20px; margin-bottom: 25px; border-radius: 4px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: ${color}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Current Status</p>
                      <p style="margin: 10px 0 0 0; font-size: 24px; color: ${color}; font-weight: bold;">${displayStatus}</p>
                    </div>

                    <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.6;">
                      You can track your order's journey in real-time on our website.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px 0;">
                          <a href="${trackingLink || 'https://diratarot.com/track-order'}" style="display: inline-block; padding: 16px 40px; background-color: #6b21a8; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                            Track Your Order
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; color: #6b21a8; font-size: 16px; font-weight: bold;">
                      The Dira Tarot Team ✨
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 25px 40px; background-color: #f9fafb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Dira Tarot. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `✨ Order #${orderId} Update: ${displayStatus} - Dira Tarot`,
    html,
  });
}

export async function sendSessionBookingEmail({
  to,
  userName,
  sessionType,
  date,
  time,
  duration,
  notes,
}: SessionBookingEmailProps) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session Booking Confirmed - Dira Tarot</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #6b21a8 0%, #9333ea 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: 'Georgia', serif;">
                      ✨ Dira Tarot
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px; font-weight: bold;">
                      ✓ Session Confirmed
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Dear ${userName},</h2>
                    <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.6;">
                      Thank you for booking a session with Dira Tarot! We're excited to guide you on your spiritual journey. Your session has been successfully confirmed with the following details:
                    </p>

                    <!-- Session Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">SESSION TYPE</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #111827; font-weight: 500;">${sessionType}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">📅 DATE & TIME</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #111827; font-weight: 500;">${formattedDate}</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #111827; font-weight: 500;">⏰ ${time}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">⏱️ DURATION</p>
                                <p style="margin: 5px 0 0 0; font-size: 16px; color: #111827; font-weight: 500;">${duration} minutes</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${notes ? `
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin-bottom: 25px; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">📝 YOUR NOTES:</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #78350f; line-height: 1.6; font-style: italic;">${notes}</p>
                      </div>
                    ` : ''}

                    <!-- Instructions -->
                    <div style="background-color: #ede9fe; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                      <h3 style="margin: 0 0 15px 0; color: #6b21a8; font-size: 18px;">Important Instructions:</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4c1d95; line-height: 1.8;">
                        <li style="margin-bottom: 8px;">Please arrive 5 minutes early to prepare for your session</li>
                        <li style="margin-bottom: 8px;">Find a quiet, comfortable space where you won't be disturbed</li>
                        <li style="margin-bottom: 8px;">Have a glass of water nearby and any questions you'd like to explore</li>
                        <li style="margin-bottom: 8px;">We'll send you a reminder 24 hours before your session</li>
                        <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
                      </ul>
                    </div>

                    <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.6;">
                      If you have any questions or need to make changes to your booking, please don't hesitate to reach out to us. We're here to ensure you have the best possible experience.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                    <p style="margin: 0 0 5px 0; color: #333; font-size: 16px;">
                      Looking forward to connecting with you,
                    </p>
                    <p style="margin: 0; color: #6b21a8; font-size: 16px; font-weight: bold;">
                      The Dira Tarot Team ✨
                    </p>

                    <p style="margin: 25px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      💜 Thank you for choosing Dira Tarot for your spiritual guidance. We honor the trust you've placed in us and look forward to this sacred experience together.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 25px 40px; background-color: #f9fafb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                      Need help? Contact us at <a href="mailto:support@diratarot.com" style="color: #6b21a8; text-decoration: none;">support@diratarot.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Dira Tarot. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const textContent = `
Dear ${userName},

Your Tarot Session has been confirmed!

Session Details:
- Session Type: ${sessionType}
- Date: ${formattedDate}
- Time: ${time}
- Duration: ${duration} minutes

${notes ? `Your Notes: ${notes}\n\n` : ''}
Important Instructions:
- Please arrive 5 minutes early to prepare for your session
- Find a quiet, comfortable space where you won't be disturbed
- Have a glass of water nearby and any questions you'd like to explore
- We'll send you a reminder 24 hours before your session
- If you need to reschedule, please contact us at least 24 hours in advance

Looking forward to connecting with you,
The Dira Tarot Team ✨

© ${new Date().getFullYear()} Dira Tarot. All rights reserved.
  `;

  return sendEmail({
    to,
    subject: `✨ Your ${sessionType} Session is Confirmed - Dira Tarot`,
    html,
    text: textContent,
  });
}