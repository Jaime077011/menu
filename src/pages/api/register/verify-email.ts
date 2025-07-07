import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    // Find registration by verification token
    const registration = await db.restaurantRegistration.findUnique({
      where: { verificationToken: token }
    });

    if (!registration) {
      return res.status(404).json({ 
        error: "Invalid or expired verification token" 
      });
    }

    // Check if already verified
    if (registration.status !== "PENDING") {
      if (registration.status === "VERIFIED") {
        // Already verified, redirect to payment
        return res.redirect(302, `/checkout/${registration.id}`);
      } else {
        return res.status(400).json({ 
          error: "Registration is no longer pending verification" 
        });
      }
    }

    // Update registration status to verified
    await db.restaurantRegistration.update({
      where: { id: registration.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verificationToken: null // Clear the token
      }
    });

    // Return success response for API calls, or redirect for browser
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('curl') || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        registrationId: registration.id,
        redirectUrl: `/checkout/${registration.id}`
      });
    }

    // Redirect to payment setup for browser requests
    return res.redirect(302, `/checkout/${registration.id}`);

  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 