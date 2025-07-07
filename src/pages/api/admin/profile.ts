import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";
import { getAdminSessionFromCookies } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get session from cookies
    const cookies = req.headers.cookie || "";
    const session = getAdminSessionFromCookies(cookies);

    if (!session?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const adminEmail = session.email;

    const adminUser = await db.adminUser.findUnique({
      where: { email: adminEmail },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            createdAt: true
          }
        }
      }
    });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // Get additional profile data from registration if available
    const registration = await db.restaurantRegistration.findUnique({
      where: { email: adminEmail }
    });

    const profile = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      createdAt: adminUser.createdAt,
      ownerName: registration?.ownerName || '',
      phone: registration?.phone || '',
      address: registration?.address || '',
      restaurant: adminUser.restaurant
    };

    return res.status(200).json({ profile });

  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} 