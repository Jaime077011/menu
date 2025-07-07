import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { stripe, getPriceIdFromPlan } from "@/utils/stripe";
import { db } from "@/server/db";
import { env } from "@/env.js";

const createCheckoutSchema = z.object({
  planName: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  restaurantId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  trialDays: z.number().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { planName, restaurantId, successUrl, cancelUrl, trialDays } = 
      createCheckoutSchema.parse(req.body);

    // Get restaurant details
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { 
        subscription: true,
        adminUsers: {
          where: { role: "ADMIN" },
          take: 1
        }
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (!restaurant.adminUsers[0]) {
      return res.status(400).json({ error: "Restaurant has no admin user" });
    }

    // Check if restaurant already has an active subscription
    if (restaurant.subscription?.status === "ACTIVE") {
      return res.status(400).json({ 
        error: "Restaurant already has an active subscription" 
      });
    }

    const adminUser = restaurant.adminUsers[0];
    const priceId = getPriceIdFromPlan(planName);

    // Create or get Stripe customer
    let customerId = restaurant.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: adminUser.email,
        name: restaurant.name,
        metadata: {
          restaurantId: restaurant.id,
          planName,
        },
      });

      customerId = customer.id;

      // Update restaurant with Stripe customer ID
      await db.restaurant.update({
        where: { id: restaurantId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays || 14, // Default 14-day trial
        metadata: {
          restaurantId: restaurant.id,
          planName,
        },
      },
      metadata: {
        restaurantId: restaurant.id,
        planName,
      },
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
    });

    console.log(`✅ Created checkout session: ${session.id} for restaurant: ${restaurantId}`);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error("❌ Failed to create checkout session:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: error.errors 
      });
    }

    return res.status(500).json({ 
      error: "Failed to create checkout session",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 