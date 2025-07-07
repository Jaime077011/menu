import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { stripe } from "@/utils/stripe";
import { db } from "@/server/db";

const billingPortalSchema = z.object({
  restaurantId: z.string().min(1),
  returnUrl: z.string().url(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { restaurantId, returnUrl } = billingPortalSchema.parse(req.body);

    // Get restaurant with subscription
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (!restaurant.stripeCustomerId) {
      return res.status(400).json({ 
        error: "Restaurant has no Stripe customer ID" 
      });
    }

    if (!restaurant.subscription || restaurant.subscription.status !== "ACTIVE") {
      return res.status(400).json({ 
        error: "Restaurant has no active subscription" 
      });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: restaurant.stripeCustomerId,
      return_url: returnUrl,
    });

    console.log(`✅ Created billing portal session for restaurant: ${restaurantId}`);

    return res.status(200).json({
      url: session.url,
    });

  } catch (error) {
    console.error("❌ Failed to create billing portal session:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: error.errors 
      });
    }

    return res.status(500).json({ 
      error: "Failed to create billing portal session",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 