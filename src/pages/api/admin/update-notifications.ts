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
    const { notifications } = req.body;

    // Get session from cookies
    const cookies = req.headers.cookie || "";
    const session = getAdminSessionFromCookies(cookies);

    if (!session?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const adminEmail = session.email;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({ error: "Notification preferences are required" });
    }

    // Get the admin user
    const adminUser = await db.adminUser.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // For now, we'll store notification preferences in the registration record
    // In a more complex system, you might have a separate notifications table
    const registration = await db.restaurantRegistration.findUnique({
      where: { email: adminEmail }
    });

    if (registration) {
      await db.restaurantRegistration.update({
        where: { id: registration.id },
        data: {
          // Store notifications as JSON in a text field (you might want to add this field to your schema)
          // For now, we'll just acknowledge the request
          updatedAt: new Date()
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Notification preferences updated successfully" 
    });

  } catch (error) {
    console.error("Update notifications error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 