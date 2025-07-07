import { db } from '@/server/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface ProvisioningResult {
  success: boolean;
  restaurantId?: string;
  adminUserId?: string;
  errors?: string[];
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  return crypto.randomBytes(12).toString('base64').slice(0, 16);
}

/**
 * Create default menu categories and sample items
 */
async function createDefaultMenuContent(restaurantId: string): Promise<void> {
  const defaultCategories = [
    {
      category: "Appetizers",
      items: [
        {
          name: "House Salad",
          description: "Fresh mixed greens with your choice of dressing",
          price: 8.99
        },
        {
          name: "Garlic Bread",
          description: "Crispy bread with garlic butter and herbs",
          price: 6.99
        }
      ]
    },
    {
      category: "Main Courses",
      items: [
        {
          name: "Grilled Chicken",
          description: "Seasoned grilled chicken breast with vegetables",
          price: 18.99
        },
        {
          name: "Pasta Primavera",
          description: "Fresh pasta with seasonal vegetables in a light sauce",
          price: 16.99
        }
      ]
    },
    {
      category: "Beverages",
      items: [
        {
          name: "Coffee",
          description: "Freshly brewed coffee",
          price: 3.99
        },
        {
          name: "Soft Drinks",
          description: "Coca-Cola, Sprite, Orange, etc.",
          price: 2.99
        }
      ]
    },
    {
      category: "Desserts",
      items: [
        {
          name: "Chocolate Cake",
          description: "Rich chocolate cake with vanilla ice cream",
          price: 7.99
        }
      ]
    }
  ];

  for (const categoryData of defaultCategories) {
    for (const item of categoryData.items) {
      await db.menuItem.create({
        data: {
          restaurantId,
          name: item.name,
          description: item.description,
          category: categoryData.category,
          price: item.price,
          available: true
        }
      });
    }
  }
}

/**
 * Set up default waiter personality
 */
function getDefaultWaiterSettings(restaurantName: string) {
  return {
    waiterName: "Alex",
    waiterPersonality: "FRIENDLY",
    welcomeMessage: `Welcome to ${restaurantName}! I'm Alex, your AI assistant. I'm here to help you explore our menu and place your order. What can I get started for you today?`,
    conversationTone: "BALANCED",
    responseStyle: "HELPFUL",
    specialtyKnowledge: `${restaurantName} specializes in fresh, quality ingredients and exceptional service. Our menu features a variety of dishes made with care and attention to detail.`
  };
}

/**
 * Create subscription record for the restaurant
 */
async function createRestaurantSubscription(
  restaurantId: string,
  planId: string,
  stripeSubscriptionId: string,
  stripeCustomerId: string
): Promise<void> {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  // Calculate trial and current period dates
  const now = new Date();
  const trialEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
  const currentPeriodEnd = new Date(trialEnd.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days after trial

  await db.restaurantSubscription.create({
    data: {
      restaurantId,
      planId,
      status: 'TRIAL',
      currentPeriodStart: now,
      currentPeriodEnd,
      trialEnd,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId: `price_${plan.name.toLowerCase()}`, // This would be actual Stripe price ID in production
    }
  });
}

/**
 * Main restaurant provisioning function
 */
export async function provisionRestaurant(registrationId: string): Promise<ProvisioningResult> {
  const errors: string[] = [];
  let restaurantId: string | undefined;
  let adminUserId: string | undefined;

  try {
    // Get registration details
    const registration = await db.restaurantRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      return { success: false, errors: ['Registration not found'] };
    }

    if (registration.status !== 'PAYMENT_COMPLETED') {
      return { success: false, errors: ['Payment not completed'] };
    }

    // Mark provisioning as started
    await db.restaurantRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'PROVISIONING',
        provisioningStartedAt: new Date()
      }
    });

    // Step 1: Create Restaurant record
    try {
      const waiterSettings = getDefaultWaiterSettings(registration.restaurantName);
      
      const restaurant = await db.restaurant.create({
        data: {
          name: registration.restaurantName,
          subdomain: registration.subdomain,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: registration.trialEndsAt,
          stripeCustomerId: registration.stripeCustomerId,
          ...waiterSettings
        }
      });

      restaurantId = restaurant.id;
      console.log(`Created restaurant: ${restaurantId}`);

    } catch (error) {
      errors.push(`Failed to create restaurant: ${String(error)}`);
      console.error('Restaurant creation error:', error);
    }

    // Step 2: Generate admin credentials and create admin user
    if (restaurantId) {
      try {
        const tempPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const adminUser = await db.adminUser.create({
          data: {
            restaurantId,
            email: registration.email,
            passwordHash: hashedPassword,
            role: 'ADMIN'
          }
        });

        adminUserId = adminUser.id;

        // Store temporary password in registration for welcome email
        await db.restaurantRegistration.update({
          where: { id: registrationId },
          data: { adminPassword: tempPassword }
        });

        console.log(`Created admin user: ${adminUserId}`);

      } catch (error) {
        errors.push(`Failed to create admin user: ${String(error)}`);
        console.error('Admin user creation error:', error);
      }
    }

    // Step 3: Create default menu content
    if (restaurantId) {
      try {
        await createDefaultMenuContent(restaurantId);
        console.log('Created default menu content');
      } catch (error) {
        errors.push(`Failed to create menu content: ${String(error)}`);
        console.error('Menu creation error:', error);
      }
    }

    // Step 4: Create subscription record
    if (restaurantId && registration.stripeSubscriptionId) {
      try {
        await createRestaurantSubscription(
          restaurantId,
          registration.selectedPlan,
          registration.stripeSubscriptionId,
          registration.stripeCustomerId!
        );
        console.log('Created subscription record');
      } catch (error) {
        errors.push(`Failed to create subscription: ${String(error)}`);
        console.error('Subscription creation error:', error);
      }
    }

    // Step 5: Update registration with restaurant link and completion status
    if (restaurantId && errors.length === 0) {
      try {
        await db.restaurantRegistration.update({
          where: { id: registrationId },
          data: {
            restaurantId,
            status: 'COMPLETED',
            provisioningCompletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`Provisioning completed for registration: ${registrationId}`);

        return {
          success: true,
          restaurantId,
          adminUserId
        };

      } catch (error) {
        errors.push(`Failed to update registration: ${String(error)}`);
        console.error('Registration update error:', error);
      }
    }

    // If we have errors, update registration with error status
    if (errors.length > 0) {
      await db.restaurantRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'FAILED',
          provisioningErrors: JSON.stringify(errors.map(error => ({
            type: 'provisioning_error',
            message: error,
            timestamp: new Date().toISOString()
          }))),
          updatedAt: new Date()
        }
      });
    }

    return {
      success: false,
      errors,
      restaurantId,
      adminUserId
    };

  } catch (error) {
    console.error('Provisioning error:', error);
    
    // Update registration with failure status
    try {
      await db.restaurantRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'FAILED',
          provisioningErrors: JSON.stringify([{
            type: 'critical_error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }]),
          updatedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('Failed to update registration with error status:', updateError);
    }

    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      restaurantId,
      adminUserId
    };
  }
}

/**
 * Retry failed provisioning
 */
export async function retryProvisioning(registrationId: string): Promise<ProvisioningResult> {
  try {
    // Reset status to allow retry
    await db.restaurantRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'PAYMENT_COMPLETED',
        provisioningErrors: null,
        provisioningStartedAt: null,
        provisioningCompletedAt: null
      }
    });

    return await provisionRestaurant(registrationId);
  } catch (error) {
    console.error('Retry provisioning error:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Failed to retry provisioning']
    };
  }
} 