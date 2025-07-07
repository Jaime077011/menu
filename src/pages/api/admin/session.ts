import { type NextApiRequest, type NextApiResponse } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const cookies = req.headers.cookie || "";
    const session = getAdminSessionFromCookies(cookies);

    if (!session?.restaurantId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return session data for AdminLayout
    return res.status(200).json({
      email: session.email,
      restaurantName: session.restaurantName || "Restaurant",
      restaurantId: session.restaurantId,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
} 