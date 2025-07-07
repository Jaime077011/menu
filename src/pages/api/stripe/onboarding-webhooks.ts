import { type NextApiRequest, type NextApiResponse } from "next";
import { stripe } from "@/utils/stripe-onboarding";
import { handlePaymentSuccess, handlePaymentFailure } from "@/utils/stripe-onboarding";
import { provisionRestaurant } from "@/utils/restaurant-provisioning";
import { sendWelcomeEmail } from "@/utils/welcome-email";
import { buffer } from "micro";

// Disable Next.js body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await buffer(req);
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      console.error("No Stripe signature found");
      return res.status(400).json({ error: "No signature" });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(`Received webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: any) {
  try {
    console.log("Processing checkout completion:", session.id);

    if (session.metadata?.type === "restaurant_onboarding") {
      // Handle payment success
      await handlePaymentSuccess(session.id);

      // Trigger restaurant provisioning
      const registrationId = session.metadata.registrationId;
      if (registrationId) {
        console.log(`Starting provisioning for registration: ${registrationId}`);
        
        // Run provisioning asynchronously to avoid webhook timeout
        setImmediate(async () => {
          try {
            const result = await provisionRestaurant(registrationId);
            if (result.success) {
              console.log(`Provisioning completed successfully for ${registrationId}`);
              
              // Send welcome email with credentials
              const emailSent = await sendWelcomeEmail(registrationId);
              if (emailSent) {
                console.log(`Welcome email sent for registration: ${registrationId}`);
              } else {
                console.error(`Failed to send welcome email for: ${registrationId}`);
              }
            } else {
              console.error(`Provisioning failed for ${registrationId}:`, result.errors);
              // TODO: Send error notification
            }
          } catch (error) {
            console.error(`Provisioning error for ${registrationId}:`, error);
          }
        });
      }
    }
  } catch (error) {
    console.error("Error handling checkout completion:", error);
    throw error;
  }
}

/**
 * Handle expired checkout sessions
 */
async function handleCheckoutExpired(session: any) {
  try {
    console.log("Processing checkout expiration:", session.id);

    if (session.metadata?.type === "restaurant_onboarding") {
      await handlePaymentFailure(session.id, "Checkout session expired");
    }
  } catch (error) {
    console.error("Error handling checkout expiration:", error);
    throw error;
  }
}

/**
 * Handle successful payment (for ongoing subscriptions)
 */
async function handlePaymentSucceeded(invoice: any) {
  try {
    console.log("Processing successful payment:", invoice.id);

    if (invoice.subscription) {
      // Update subscription status in database
      // This handles ongoing subscription payments after the initial setup
      // TODO: Implement subscription payment tracking
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: any) {
  try {
    console.log("Processing failed payment:", invoice.id);

    if (invoice.subscription) {
      // Handle failed subscription payment
      // TODO: Implement failed payment handling (email notifications, grace period, etc.)
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log("Processing subscription creation:", subscription.id);
    
    // This is handled in the checkout completion, but we can add
    // additional logic here if needed
  } catch (error) {
    console.error("Error handling subscription creation:", error);
    throw error;
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log("Processing subscription update:", subscription.id);
    
    // Handle subscription changes (plan upgrades, downgrades, etc.)
    // TODO: Implement subscription update handling
  } catch (error) {
    console.error("Error handling subscription update:", error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log("Processing subscription deletion:", subscription.id);
    
    // Handle subscription cancellation
    // TODO: Implement subscription cancellation handling
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
} 