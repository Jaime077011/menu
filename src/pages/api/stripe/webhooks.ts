import { type NextApiRequest, type NextApiResponse } from "next";
import { stripe } from "@/utils/stripe";
import { db } from "@/server/db";
import { env } from "@/env.js";
import type Stripe from "stripe";

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    req.on('error', reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      console.error("❌ Missing Stripe signature");
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`📨 Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`🔔 Unhandled webhook event: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(400).json({ 
      error: "Webhook signature verification failed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const restaurantId = session.metadata?.restaurantId;
    const planName = session.metadata?.planName;

    if (!restaurantId || !planName) {
      console.error("❌ Missing metadata in checkout session");
      return;
    }

    console.log(`✅ Checkout completed for restaurant: ${restaurantId}, plan: ${planName}`);

    // The subscription will be handled by the subscription.created event
    // This is just for logging and potential additional processing

  } catch (error) {
    console.error("❌ Error handling checkout completed:", error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const restaurantId = subscription.metadata?.restaurantId;
    const planName = subscription.metadata?.planName;

    if (!restaurantId || !planName) {
      console.error("❌ Missing metadata in subscription");
      return;
    }

    // Get subscription plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { name: planName as any },
    });

    if (!plan) {
      console.error(`❌ Plan not found: ${planName}`);
      return;
    }

    // Create or update restaurant subscription
    await db.restaurantSubscription.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: subscription.status === "active" ? "ACTIVE" : "TRIAL",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
      update: {
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status === "active" ? "ACTIVE" : "TRIAL",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelledAt: null,
      },
    });

    // Update restaurant subscription status
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: subscription.status === "active" ? "ACTIVE" : "TRIAL",
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    console.log(`✅ Created subscription for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error("❌ Error handling subscription created:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const restaurantId = subscription.metadata?.restaurantId;

    if (!restaurantId) {
      console.error("❌ Missing restaurantId in subscription metadata");
      return;
    }

    // Update subscription status
    const status = subscription.status === "active" ? "ACTIVE" : 
                  subscription.status === "trialing" ? "TRIAL" :
                  subscription.status === "past_due" ? "PAST_DUE" :
                  subscription.status === "canceled" ? "CANCELLED" : "INACTIVE";

    await db.restaurantSubscription.update({
      where: { restaurantId },
      data: {
        status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    });

    // Update restaurant subscription status
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: status,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    console.log(`✅ Updated subscription for restaurant: ${restaurantId}, status: ${status}`);

  } catch (error) {
    console.error("❌ Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const restaurantId = subscription.metadata?.restaurantId;

    if (!restaurantId) {
      console.error("❌ Missing restaurantId in subscription metadata");
      return;
    }

    // Update subscription status to cancelled
    await db.restaurantSubscription.update({
      where: { restaurantId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Update restaurant subscription status
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: "CANCELLED",
      },
    });

    console.log(`✅ Cancelled subscription for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error("❌ Error handling subscription deleted:", error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) {
      return; // Not a subscription invoice
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const restaurantId = subscription.metadata?.restaurantId;

    if (!restaurantId) {
      console.error("❌ Missing restaurantId in subscription metadata");
      return;
    }

    // Update subscription status to active if it was past due
    await db.restaurantSubscription.update({
      where: { restaurantId },
      data: {
        status: "ACTIVE",
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // Update restaurant subscription status
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: "ACTIVE",
      },
    });

    console.log(`✅ Payment succeeded for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error("❌ Error handling payment succeeded:", error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) {
      return; // Not a subscription invoice
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const restaurantId = subscription.metadata?.restaurantId;

    if (!restaurantId) {
      console.error("❌ Missing restaurantId in subscription metadata");
      return;
    }

    // Update subscription status to past due
    await db.restaurantSubscription.update({
      where: { restaurantId },
      data: {
        status: "PAST_DUE",
      },
    });

    // Update restaurant subscription status
    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: "PAST_DUE",
      },
    });

    console.log(`❌ Payment failed for restaurant: ${restaurantId}`);

  } catch (error) {
    console.error("❌ Error handling payment failed:", error);
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const restaurantId = subscription.metadata?.restaurantId;

    if (!restaurantId) {
      console.error("❌ Missing restaurantId in subscription metadata");
      return;
    }

    console.log(`⏰ Trial will end soon for restaurant: ${restaurantId}`);
    
    // Here you could send notification emails, etc.
    // For now, just log the event

  } catch (error) {
    console.error("❌ Error handling trial will end:", error);
  }
} 