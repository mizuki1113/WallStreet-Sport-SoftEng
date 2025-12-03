import { Resend } from 'resend';
import { Booking } from '../entities/Booking';

export class EmailService {
  private resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendBookingConfirmation(booking: Booking, transactionId?: string) {
    const emailHtml = this.generateConfirmationEmail(booking);

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'WallStreet Sport <no-reply@houriji.xyz>',
        to: 'gamalo.precious13@gmail.com',
        subject: "Booking Confirmation - WallStreet Sport",
        html: emailHtml,
      });

      if (error) {
        console.error("❌ Email sending failed:", error);
        throw new Error("Failed to send confirmation email");
      }

      console.log("✅ Email sent:", data?.id || "No ID returned");
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error("❌ Email sending error:", err.message || err);
      throw new Error("Failed to send confirmation email");
    }
  }

  private generateConfirmationEmail(booking: Booking): string {
    const bookingDateStr = String(booking.bookingDate);
    const [year, month, day] = bookingDateStr.split('-').map(Number);
    const dateForFormatting = new Date(year, month - 1, day);

    const formattedDate = dateForFormatting.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .logo {
      text-align: left;
      margin-bottom: 20px;
    }
    .logo img {
      max-width: 600px;
      height: auto;
    }
    p {
      margin: 10px 0;
    }
    .content {
      padding: 30px;
      max-width: 600px;
      height: auto;
    }
    .booking-details {
      max-width: 580px;
      height: auto;
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-label {
      font-weight: bold;
      color: #495057;
    }
    .detail-value {
      color: #212529;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .tagline {
      color: #ffd700;
      font-style: italic;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="logo">
      <img
  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABdwAAAH0CAIAAACo53h7AACAAElEQVR4nGz9Z3s...sqjoC+lBdLO2hDSFaaP9h53p3R6cJ6uKF18pEeJxyf3q2l/4FICHpMxWvYFnqkx"
  alt="WallStreet Sport Logo"
  style="max-width:600px;height:auto;"
/>

    </div>
    
    <div class="content">
      <h2 style="color: #667eea;">Good day, ${booking.customerName}!</h2>
      
      <p>Thank you for booking with <strong>WallStreet Sport</strong>! This email is sent for your booking confirmation.</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #667eea;">Booking Details:</h3>
        
        <div class="detail-row">
          <span class="detail-label">Booking Reference:</span>
          <span class="detail-value">${booking.bookingReference}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${booking.displayTime}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Payment:</span>
          <span class="detail-value">GCash</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value">PHP ${booking.rate}</span>
        </div>
      </div>
      
      <p><strong>Important Reminders:</strong></p>
      <ul>
        <li>Please arrive at least <strong>10-15 minutes</strong> before your scheduled time to check in.</li>
        <li>Bring this email confirmation or your booking reference number.</li>
        <li>If you need to reschedule or cancel, kindly contact us at <a href="mailto:srhjncmb@gmail.com">srhjncmb@gmail.com</a> at least <strong>3 days</strong> before your booking.</li>
      </ul>
      
      <p style="text-align: center; margin-top: 30px;">
        <strong>We look forward to seeing you!</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Best regards,</strong><br>
      WallStreet Sport Team</p>
      
      <p style="margin-top: 20px; font-size: 11px; color: #999;">
        Please do not reply to this message as this is auto-generated.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async testConnection() {
    // Resend does not need SMTP verification
    return true;
  }
}
