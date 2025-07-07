import Stripe from 'stripe';
import { db } from '@/server/db';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export interface CreateCheckoutSessionParams {
  registrationId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  customerId: string;
}

/**
 * Convert database billing interval to Stripe interval
 */
function mapBillingInterval(dbInterval: string): 'month' | 'year' | 'week' | 'day' {
  switch (dbInterval.toUpperCase()) {
    case 'MONTHLY':
      return 'month';
    case 'YEARLY':
      return 'year';
    case 'WEEKLY':
      return 'week';
    case 'DAILY':
      return 'day';
    default:
      console.warn(`Unknown billing interval: ${dbInterval}, defaulting to month`);
      return 'month';
  }
}

/**
 * Create a Stripe customer for the registration
 */
export async function createStripeCustomer(
  email: string,
  restaurantName: string,
  ownerName: string
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: ownerName,
      description: `Restaurant: ${restaurantName}`,
      metadata: {
        restaurantName,
        ownerName,
        source: 'onboarding'
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Create a checkout session for restaurant onboarding
 */
export async function createOnboardingCheckoutSession({
  registrationId,
  planId,
  successUrl,
  cancelUrl
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  try {
    // Get registration details
    const registration = await db.restaurantRegistration.findUnique({
      where: { id: registrationId },
      include: {
        restaurant: true
      }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status !== 'VERIFIED') {
      throw new Error('Registration must be verified before payment');
    }

    // Get plan details
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Create or get Stripe customer
    let customerId = registration.stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer(
        registration.email,
        registration.restaurantName,
        registration.ownerName
      );

      // Update registration with customer ID
      await db.restaurantRegistration.update({
        where: { id: registrationId },
        data: { stripeCustomerId: customerId }
      });
    }

    // Calculate trial end date (14 days from now)
    const trialEnd = Math.floor((Date.now() + (14 * 24 * 60 * 60 * 1000)) / 1000);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.displayName,
              description: plan.description || `${plan.displayName} subscription for ${registration.restaurantName}`,
              metadata: {
                planId: plan.id,
                planName: plan.name,
                restaurantName: registration.restaurantName
              }
            },
            unit_amount: Math.round(Number(plan.price) * 100), // Convert to cents
            recurring: {
              interval: mapBillingInterval(plan.billingInterval)
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}`,
      cancel_url: `${cancelUrl}?registration_id=${registrationId}`,
      subscription_data: {
        trial_end: trialEnd,
        metadata: {
          registrationId,
          planId,
          restaurantName: registration.restaurantName,
          subdomain: registration.subdomain
        }
      },
      metadata: {
        registrationId,
        planId,
        restaurantName: registration.restaurantName,
        subdomain: registration.subdomain,
        type: 'restaurant_onboarding'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    // Update registration with checkout session
    await db.restaurantRegistration.update({
      where: { id: registrationId },
      data: {
        stripeCheckoutSessionId: session.id,
        status: 'PAYMENT_PENDING',
        trialEndsAt: new Date(trialEnd * 1000)
      }
    });

    return {
      sessionId: session.id,
      url: session.url,
      customerId
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error('Failed to retrieve checkout session');
  }
}

/**
 * Handle successful payment completion
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    const session = await getCheckoutSession(sessionId);
    
    if (!session.metadata?.registrationId) {
      throw new Error('Registration ID not found in session metadata');
    }

    const registrationId = session.metadata.registrationId;
    const subscription = session.subscription as Stripe.Subscription;

    // Update registration with payment details
    await db.restaurantRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'PAYMENT_COMPLETED',
        paymentCompleted: true,
        paymentCompletedAt: new Date(),
        stripeSubscriptionId: subscription.id,
        paymentMethod: 'card', // Could be enhanced to detect actual method
        updatedAt: new Date()
      }
    });

    console.log(`Payment completed for registration ${registrationId}`);
    
    // TODO: Trigger restaurant provisioning
    // await triggerRestaurantProvisioning(registrationId);

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailure(sessionId: string, reason?: string): Promise<void> {
  try {
    const session = await getCheckoutSession(sessionId);
    
    if (!session.metadata?.registrationId) {
      throw new Error('Registration ID not found in session metadata');
    }

    const registrationId = session.metadata.registrationId;

    // Update registration status
    await db.restaurantRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'VERIFIED', // Back to verified so they can try payment again
        provisioningErrors: JSON.stringify([{
          type: 'payment_failed',
          reason: reason || 'Payment was not completed',
          timestamp: new Date().toISOString()
        }]),
        updatedAt: new Date()
      }
    });

    console.log(`Payment failed for registration ${registrationId}: ${reason}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

/**
 * Get subscription details for a customer
 */
export async function getCustomerSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    console.error('Error getting customer subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

export { stripe }; 