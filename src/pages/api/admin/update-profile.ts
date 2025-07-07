import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";
import { getAdminSessionFromCookies } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { restaurantName, ownerName, email, phone, address } = req.body;

    // Get session from cookies
    const cookies = req.headers.cookie || "";
    const session = getAdminSessionFromCookies(cookies);

    if (!session?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const currentAdminEmail = session.email;

    if (!restaurantName || !email) {
      return res.status(400).json({ error: "Restaurant name and email are required" });
    }

    // Get the admin user
    const adminUser = await db.adminUser.findUnique({
      where: { email: currentAdminEmail },
      include: { restaurant: true }
    });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // Update restaurant name if changed
    if (adminUser.restaurant && adminUser.restaurant.name !== restaurantName) {
      await db.restaurant.update({
        where: { id: adminUser.restaurant.id },
        data: { name: restaurantName }
      });
    }

    // Update admin email if changed
    if (adminUser.email !== email) {
      await db.adminUser.update({
        where: { id: adminUser.id },
        data: { email }
      });
    }

    // Update registration record with additional profile info
    const registration = await db.restaurantRegistration.findUnique({
      where: { email: currentAdminEmail }
    });

    if (registration) {
      await db.restaurantRegistration.update({
        where: { id: registration.id },
        data: {
          ownerName: ownerName || registration.ownerName,
          email: email,
          phone: phone || '',
          address: address || '',
          updatedAt: new Date()
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully" 
    });

  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 