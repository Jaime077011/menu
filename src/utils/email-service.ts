// Basic email service - in production, integrate with services like SendGrid, Mailgun, etc.

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  restaurantName: string;
  ownerName: string;
  email: string;
  subdomain: string;
  tempPassword: string;
  loginUrl: string;
}

/**
 * Generate welcome email template
 */
export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const { restaurantName, ownerName, email, subdomain, tempPassword, loginUrl } = data;

  const subject = `Welcome to AI Menu Assistant - ${restaurantName} is ready!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to AI Menu Assistant</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to AI Menu Assistant!</h1>
          <p>Your restaurant is now live and ready to serve customers</p>
        </div>
        
        <div class="content">
          <h2>Hi ${ownerName},</h2>
          
          <p>Congratulations! Your restaurant <strong>${restaurantName}</strong> has been successfully set up on AI Menu Assistant. Your AI waiter is ready to start taking orders and engaging with customers.</p>
          
          <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            <p><strong>Restaurant URL:</strong> ${subdomain}.yourdomain.com</p>
            <p><strong>Admin Dashboard:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            <p style="color: #e65100; font-size: 14px;"><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
          </div>
          
          <a href="${loginUrl}" class="button">Access Your Dashboard</a>
          
          <h3>🚀 What's Next?</h3>
          <ol>
            <li><strong>Login to your dashboard</strong> using the credentials above</li>
            <li><strong>Customize your menu</strong> - Add your actual menu items, prices, and photos</li>
            <li><strong>Configure your AI waiter</strong> - Set personality, responses, and specialties</li>
            <li><strong>Generate QR codes</strong> - Place them on tables for customers to access</li>
            <li><strong>Start serving customers</strong> - Your AI waiter will handle orders automatically</li>
          </ol>
          
          <h3>📋 What's Already Set Up</h3>
          <ul>
            <li>✅ Sample menu items (replace with your actual menu)</li>
            <li>✅ AI waiter personality (customize to match your brand)</li>
            <li>✅ Order management system</li>
            <li>✅ Admin dashboard with analytics</li>
            <li>✅ QR code generator for tables</li>
          </ul>
          
          <h3>🆘 Need Help?</h3>
          <p>Our support team is here to help you get the most out of AI Menu Assistant:</p>
          <ul>
            <li>📧 Email: <a href="mailto:support@yourdomain.com">support@yourdomain.com</a></li>
            <li>📚 Documentation: <a href="/docs">Setup Guide & Tutorials</a></li>
            <li>💬 Live Chat: Available in your admin dashboard</li>
          </ul>
          
          <p>Thank you for choosing AI Menu Assistant. We're excited to help you transform your restaurant experience!</p>
          
          <p>Best regards,<br>The AI Menu Assistant Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to ${email} because you signed up for AI Menu Assistant.</p>
          <p>If you didn't sign up for this service, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to AI Menu Assistant!

Hi ${ownerName},

Congratulations! Your restaurant ${restaurantName} has been successfully set up on AI Menu Assistant.

Your Login Credentials:
- Restaurant URL: ${subdomain}.yourdomain.com
- Admin Dashboard: ${loginUrl}
- Email: ${email}
- Temporary Password: ${tempPassword}

⚠️ Important: Please change your password after your first login for security.

What's Next?
1. Login to your dashboard using the credentials above
2. Customize your menu - Add your actual menu items, prices, and photos
3. Configure your AI waiter - Set personality, responses, and specialties
4. Generate QR codes - Place them on tables for customers to access
5. Start serving customers - Your AI waiter will handle orders automatically

Need Help?
- Email: support@yourdomain.com
- Documentation: /docs
- Live Chat: Available in your admin dashboard

Thank you for choosing AI Menu Assistant!

Best regards,
The AI Menu Assistant Team
  `;

  return {
    to: email,
    subject,
    html,
    text
  };
}

/**
 * Send email (placeholder - integrate with actual email service)
 */
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    // In production, integrate with email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    console.log('📧 Email would be sent:', {
      to: template.to,
      subject: template.subject,
      // Don't log full content in production
    });
    
    // For now, just log success
    console.log(`✅ Welcome email prepared for ${template.to}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email to new restaurant owner
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const template = generateWelcomeEmail(data);
  return await sendEmail(template);
} 