import { type NextApiRequest, type NextApiResponse } from "next";
import { createOnboardingCheckoutSession } from "@/utils/stripe-onboarding";
import { z } from "zod";

const createCheckoutSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  planId: z.string().min(1, "Plan ID is required"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const { registrationId, planId } = createCheckoutSchema.parse(req.body);

    // Get the base URL for redirect URLs
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const successUrl = `${baseUrl}/checkout/success`;
    const cancelUrl = `${baseUrl}/checkout/cancel`;

    // Create checkout session
    const checkoutSession = await createOnboardingCheckoutSession({
      registrationId,
      planId,
      successUrl,
      cancelUrl
    });

    return res.status(200).json({
      success: true,
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
      customerId: checkoutSession.customerId
    });

  } catch (error) {
    console.error("Create checkout session error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(500).json({
      error: "Internal server error"
    });
  }
} 