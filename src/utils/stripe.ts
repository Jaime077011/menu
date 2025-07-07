import Stripe from "stripe";
import { env } from "@/env.js";

// Initialize Stripe with secret key
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export interface CreateCustomerParams {
  email: string;
  name: string;
  restaurantId: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  restaurantId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}

export class StripeManager {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          restaurantId: params.restaurantId,
          ...params.metadata,
        },
      });

      console.log(`✅ Created Stripe customer: ${customer.id} for restaurant: ${params.restaurantId}`);
      return customer;
    } catch (error) {
      console.error("❌ Failed to create Stripe customer:", error);
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          restaurantId: params.restaurantId,
          ...params.metadata,
        },
      };

      // Add trial period if specified
      if (params.trialDays && params.trialDays > 0) {
        subscriptionData.trial_period_days = params.trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      console.log(`✅ Created Stripe subscription: ${subscription.id} for restaurant: ${params.restaurantId}`);
      return subscription;
    } catch (error) {
      console.error("❌ Failed to create Stripe subscription:", error);
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Update subscription to new plan
   */
  static async updateSubscription(params: UpdateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      // Get current subscription
      const currentSubscription = await stripe.subscriptions.retrieve(params.subscriptionId);
      
      if (!currentSubscription.items.data[0]) {
        throw new Error("No subscription items found");
      }

      const subscription = await stripe.subscriptions.update(params.subscriptionId, {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: params.newPriceId,
          },
        ],
        proration_behavior: params.prorationBehavior || "create_prorations",
      });

      console.log(`✅ Updated Stripe subscription: ${subscription.id} to price: ${params.newPriceId}`);
      return subscription;
    } catch (error) {
      console.error("❌ Failed to update Stripe subscription:", error);
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      console.log(`✅ ${cancelAtPeriodEnd ? 'Scheduled cancellation' : 'Cancelled'} Stripe subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      console.error("❌ Failed to cancel Stripe subscription:", error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Immediately cancel subscription
   */
  static async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);

      console.log(`✅ Immediately cancelled Stripe subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      console.error("❌ Failed to immediately cancel Stripe subscription:", error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  static async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      console.log(`✅ Reactivated Stripe subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      console.error("❌ Failed to reactivate Stripe subscription:", error);
      throw new Error(`Failed to reactivate subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create payment intent for setup
   */
  static async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
      });

      return setupIntent;
    } catch (error) {
      console.error("❌ Failed to create setup intent:", error);
      throw new Error(`Failed to create setup intent: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get customer's payment methods
   */
  static async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      return paymentMethods.data;
    } catch (error) {
      console.error("❌ Failed to get payment methods:", error);
      throw new Error(`Failed to get payment methods: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return customer;
    } catch (error) {
      console.error("❌ Failed to set default payment method:", error);
      throw new Error(`Failed to set default payment method: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["latest_invoice", "customer", "items.data.price"],
      });
    } catch (error) {
      console.error("❌ Failed to get subscription:", error);
      throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get customer billing history
   */
  static async getBillingHistory(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
        expand: ["data.subscription"],
      });

      return invoices.data;
    } catch (error) {
      console.error("❌ Failed to get billing history:", error);
      throw new Error(`Failed to get billing history: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create billing portal session
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error("❌ Failed to create billing portal session:", error);
      throw new Error(`Failed to create billing portal session: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      
      console.log(`📨 Received Stripe webhook: ${event.type}`);
      return event;
    } catch (error) {
      console.error("❌ Failed to verify webhook signature:", error);
      throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get upcoming invoice preview
   */
  static async getUpcomingInvoice(
    customerId: string,
    subscriptionId?: string
  ): Promise<Stripe.Invoice> {
    try {
      const params: Stripe.InvoiceRetrieveUpcomingParams = {
        customer: customerId,
      };

      if (subscriptionId) {
        params.subscription = subscriptionId;
      }

      return await stripe.invoices.retrieveUpcoming(params);
    } catch (error) {
      console.error("❌ Failed to get upcoming invoice:", error);
      if (error instanceof Error && error.message.includes('subscription')) {
        throw new Error(`No upcoming invoice found for subscription: ${subscriptionId}`);
      }
      throw new Error(`Failed to get upcoming invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Stripe price utilities
export const STRIPE_PRICE_IDS = {
  STARTER_MONTHLY: env.STRIPE_STARTER_PRICE_ID,
  PROFESSIONAL_MONTHLY: env.STRIPE_PROFESSIONAL_PRICE_ID,
  ENTERPRISE_MONTHLY: env.STRIPE_ENTERPRISE_PRICE_ID,
} as const;

// Helper function to get price ID from plan name
export function getPriceIdFromPlan(planName: string): string {
  switch (planName.toLowerCase()) {
    case "starter":
      return STRIPE_PRICE_IDS.STARTER_MONTHLY;
    case "professional":
      return STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY;
    case "enterprise":
      return STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY;
    default:
      throw new Error(`Unknown plan name: ${planName}`);
  }
}

// Helper function to get plan name from price ID
export function getPlanNameFromPriceId(priceId: string): string {
  switch (priceId) {
    case STRIPE_PRICE_IDS.STARTER_MONTHLY:
      return "STARTER";
    case STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY:
      return "PROFESSIONAL";
    case STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY:
      return "ENTERPRISE";
    default:
      throw new Error(`Unknown price ID: ${priceId}`);
  }
} 