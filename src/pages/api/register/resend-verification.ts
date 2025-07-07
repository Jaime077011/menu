import { type NextApiRequest, type NextApiResponse } from "next";
import { db } from "@/server/db";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find pending registration
    const registration = await db.restaurantRegistration.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!registration) {
      return res.status(404).json({ 
        error: "No pending registration found for this email" 
      });
    }

    if (registration.status !== "PENDING") {
      return res.status(400).json({ 
        error: "Email is already verified or registration is complete" 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update registration with new token
    await db.restaurantRegistration.update({
      where: { id: registration.id },
      data: {
        verificationToken,
        updatedAt: new Date()
      }
    });

    // TODO: Send verification email
    // await sendVerificationEmail(registration.email, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

// TODO: Implement email sending
async function sendVerificationEmail(email: string, token: string) {
  // This will be implemented in Phase 5
  console.log(`Verification email would be sent to ${email} with token ${token}`);
} 