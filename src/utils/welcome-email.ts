import { db } from '@/server/db';

export interface WelcomeEmailData {
  restaurantName: string;
  ownerName: string;
  email: string;
  subdomain: string;
  adminPassword: string;
  loginUrl: string;
}

/**
 * Send welcome email with login credentials
 */
export async function sendWelcomeEmail(registrationId: string): Promise<boolean> {
  try {
    // Get registration data
    const registration = await db.restaurantRegistration.findUnique({
      where: { id: registrationId },
      include: {
        restaurant: true
      }
    });

    if (!registration || !registration.adminPassword) {
      console.error('Registration or admin password not found');
      return false;
    }

    const emailData: WelcomeEmailData = {
      restaurantName: registration.restaurantName,
      ownerName: registration.ownerName,
      email: registration.email,
      subdomain: registration.subdomain,
      adminPassword: registration.adminPassword,
      loginUrl: `http://${registration.subdomain}.localhost:3000/admin/login`
    };

    // For now, just log the credentials (in production, send actual email)
    console.log('🎉 WELCOME EMAIL CREDENTIALS 🎉');
    console.log('===============================');
    console.log(`Restaurant: ${emailData.restaurantName}`);
    console.log(`Owner: ${emailData.ownerName}`);
    console.log(`Email: ${emailData.email}`);
    console.log(`Admin Login URL: ${emailData.loginUrl}`);
    console.log(`Temporary Password: ${emailData.adminPassword}`);
    console.log('===============================');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');

    // TODO: Implement actual email sending with your email service
    // await sendEmailWithTemplate(emailData);

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  try {
    const adminUser = await db.adminUser.findUnique({
      where: { email }
    });

    if (!adminUser) {
      return null;
    }

    // Generate reset token (you might want to store this in database with expiry)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);

    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    return resetToken;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    return null;
  }
}

/**
 * Create a manual password setup page URL
 */
export function getPasswordSetupUrl(registrationId: string, token?: string): string {
  const baseUrl = `http://localhost:3000/admin/setup-password`;
  return token ? `${baseUrl}?registration=${registrationId}&token=${token}` : `${baseUrl}?registration=${registrationId}`;
} 