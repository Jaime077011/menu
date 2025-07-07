import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    // For now, we'll get the admin user by email from the session
    // In a real implementation, you'd get this from the session/JWT
    const adminEmail = req.headers['x-admin-email'] as string;
    
    if (!adminEmail) {
      return res.status(401).json({ error: "Admin email not found in session" });
    }

    // Get admin user
    const adminUser = await db.adminUser.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    // Clear the temporary password from registration if it exists
    const registration = await db.restaurantRegistration.findUnique({
      where: { email: adminEmail }
    });

    if (registration && registration.adminPassword) {
      await db.restaurantRegistration.update({
        where: { id: registration.id },
        data: {
          adminPassword: null // Clear temporary password
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Password changed successfully" 
    });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 