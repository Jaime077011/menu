import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Registration ID is required" });
  }

  try {
    const registration = await db.restaurantRegistration.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        restaurantName: true,
        ownerName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        subdomain: true,
        selectedPlan: true,
        status: true,
        verifiedAt: true,
        createdAt: true
      }
    });

    if (!registration) {
      return res.status(404).json({ 
        error: "Registration not found" 
      });
    }

    return res.status(200).json({
      success: true,
      registration
    });

  } catch (error) {
    console.error("Get registration error:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
} 