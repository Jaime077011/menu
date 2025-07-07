import Stripe from "stripe";
import { stripe } from "@/utils/stripe";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CreateStripePlanParams {
  name: string;
  displayName: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface UpdateStripePlanParams {
  stripeProductId: string;
  name?: string;
  displayName?: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  metadata?: Record<string, string>;
}

export interface StripePlanResult {
  product: Stripe.Product;
  monthlyPrice: Stripe.Price;
  yearlyPrice?: Stripe.Price;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const PlanValidationSchema = z.object({
  name: z.string()
    .min(1, "Plan name is required")
    .max(50, "Plan name must be less than 50 characters")
    .regex(/^[A-Z_][A-Z0-9_]*$/, "Plan name must be uppercase with underscores only"),
  
  displayName: z.string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  
  price: z.number()
    .min(0, "Price must be non-negative")
    .max(10000, "Price must be less than $10,000")
    .multipleOf(0.01, "Price must be a valid currency amount"),
  
  yearlyPrice: z.number()
    .min(0, "Yearly price must be non-negative")
    .max(120000, "Yearly price must be less than $120,000")
    .multipleOf(0.01, "Yearly price must be a valid currency amount")
    .optional(),
  
  billingInterval: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  
  maxLocations: z.number()
    .min(1, "Must allow at least 1 location")
    .max(1000, "Maximum 1000 locations allowed"),
  
  maxMenuItems: z.number()
    .min(-1, "Use -1 for unlimited")
    .max(100000, "Maximum 100,000 menu items allowed"),
  
  maxOrders: z.number()
    .min(-1, "Use -1 for unlimited")
    .max(1000000, "Maximum 1,000,000 orders allowed"),
  
  maxUsers: z.number()
    .min(1, "Must allow at least 1 user")
    .max(1000, "Maximum 1000 users allowed"),
  
  maxWaiters: z.number()
    .min(1, "Must allow at least 1 waiter")
    .max(100, "Maximum 100 waiters allowed"),
  
  features: z.string()
    .refine((val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    }, "Features must be valid JSON")
    .optional(),
  
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0).default(0),
});

export const FeaturesSchema = z.object({
  customBranding: z.boolean().default(false),
  apiAccess: z.boolean().default(false),
  advancedAnalytics: z.boolean().default(false),
  prioritySupport: z.boolean().default(false),
  whiteLabel: z.boolean().default(false),
  integrations: z.boolean().default(false),
  multiLocation: z.boolean().default(false),
  advancedReporting: z.boolean().default(false),
  customDomain: z.boolean().default(false),
  sso: z.boolean().default(false),
}).catchall(z.boolean());

// ============================================================================
// STRIPE PLAN MANAGER CLASS
// ============================================================================

export class StripePlanManager {
  private static instance: StripePlanManager;
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  public static getInstance(db: PrismaClient): StripePlanManager {
    if (!StripePlanManager.instance) {
      StripePlanManager.instance = new StripePlanManager(db);
    }
    return StripePlanManager.instance;
  }

  /**
   * Create a new plan in Stripe with monthly and yearly pricing
   */
  async createStripePlan(params: CreateStripePlanParams): Promise<StripePlanResult> {
    try {
      // Validate input
      const validatedParams = this.validateCreateParams(params);
      
      // Create Stripe product
      const product = await stripe.products.create({
        name: validatedParams.displayName,
        description: validatedParams.description || undefined,
        metadata: {
          planName: validatedParams.name,
          ...validatedParams.metadata,
        },
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(validatedParams.monthlyPrice * 100), // Convert to cents
        currency: validatedParams.currency || 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          planName: validatedParams.name,
          billing: 'monthly',
        },
      });

      // Create yearly price if specified
      let yearlyPrice: Stripe.Price | undefined;
      if (validatedParams.yearlyPrice) {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(validatedParams.yearlyPrice * 100), // Convert to cents
          currency: validatedParams.currency || 'usd',
          recurring: {
            interval: 'year',
          },
          metadata: {
            planName: validatedParams.name,
            billing: 'yearly',
          },
        });
      }

      console.log(`✅ Created Stripe plan: ${product.id} (${validatedParams.name})`);
      
      return {
        product,
        monthlyPrice,
        yearlyPrice,
      };
    } catch (error) {
      console.error("❌ Failed to create Stripe plan:", error);
      throw new Error(`Failed to create Stripe plan: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Update existing Stripe plan
   */
  async updateStripePlan(params: UpdateStripePlanParams): Promise<Stripe.Product> {
    try {
      const updateData: Stripe.ProductUpdateParams = {};

      if (params.name || params.displayName) {
        updateData.name = params.displayName || params.name;
      }

      if (params.description !== undefined) {
        updateData.description = params.description;
      }

      if (params.metadata) {
        updateData.metadata = params.metadata;
      }

      const product = await stripe.products.update(params.stripeProductId, updateData);

      console.log(`✅ Updated Stripe product: ${product.id}`);
      return product;
    } catch (error) {
      console.error("❌ Failed to update Stripe plan:", error);
      throw new Error(`Failed to update Stripe plan: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Archive Stripe plan (soft delete)
   */
  async archiveStripePlan(stripeProductId: string): Promise<Stripe.Product> {
    try {
      const product = await stripe.products.update(stripeProductId, {
        active: false,
      });

      console.log(`✅ Archived Stripe product: ${product.id}`);
      return product;
    } catch (error) {
      console.error("❌ Failed to archive Stripe plan:", error);
      throw new Error(`Failed to archive Stripe plan: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Validate plan creation parameters
   */
  private validateCreateParams(params: CreateStripePlanParams): CreateStripePlanParams {
    // Validate basic structure
    if (!params.name || !params.displayName || typeof params.monthlyPrice !== 'number') {
      throw new Error("Missing required parameters: name, displayName, or monthlyPrice");
    }

    // Validate price ranges
    if (params.monthlyPrice < 0 || params.monthlyPrice > 10000) {
      throw new Error("Monthly price must be between $0 and $10,000");
    }

    if (params.yearlyPrice && (params.yearlyPrice < 0 || params.yearlyPrice > 120000)) {
      throw new Error("Yearly price must be between $0 and $120,000");
    }

    // Validate yearly price makes sense
    if (params.yearlyPrice && params.yearlyPrice < params.monthlyPrice * 12 * 0.5) {
      throw new Error("Yearly price seems too low compared to monthly price");
    }

    return params;
  }

  /**
   * Update plan prices - creates new Stripe prices and returns the IDs
   */
  async updatePlanPrices(
    productId: string,
    monthlyPrice?: number,
    yearlyPrice?: number
  ): Promise<{ monthlyPriceId?: string; yearlyPriceId?: string }> {
    try {
      const result: { monthlyPriceId?: string; yearlyPriceId?: string } = {};

      // Create new monthly price if provided
      if (monthlyPrice !== undefined) {
        const newMonthlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(monthlyPrice * 100),
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: {
            billing: 'monthly',
            updated: new Date().toISOString(),
          },
        });
        result.monthlyPriceId = newMonthlyPrice.id;
        console.log(`✅ Created new monthly price: ${newMonthlyPrice.id} ($${monthlyPrice})`);
      }

      // Create new yearly price if provided
      if (yearlyPrice !== undefined) {
        const newYearlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(yearlyPrice * 100),
          currency: 'usd',
          recurring: {
            interval: 'year',
          },
          metadata: {
            billing: 'yearly',
            updated: new Date().toISOString(),
          },
        });
        result.yearlyPriceId = newYearlyPrice.id;
        console.log(`✅ Created new yearly price: ${newYearlyPrice.id} ($${yearlyPrice})`);
      }

      return result;
    } catch (error) {
      console.error("❌ Failed to update plan prices:", error);
      throw new Error(`Failed to update plan prices: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Sync all plans with Stripe (useful for initial setup or migration)
   */
  async syncAllPlansWithStripe(): Promise<void> {
    try {
      const plans = await this.db.subscriptionPlan.findMany({
        where: { isActive: true },
      });

      console.log(`🔄 Syncing ${plans.length} plans with Stripe...`);

      const syncPromises = plans.map(async (plan) => {
        try {
          if (!plan.stripeProductId) {
            // Create new Stripe product for plans without one
            const stripeResult = await this.createStripePlan({
              name: plan.name,
              displayName: plan.displayName,
              description: plan.description || undefined,
              monthlyPrice: Number(plan.price),
              yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : undefined,
            });

            // Update plan with Stripe IDs
            await this.db.subscriptionPlan.update({
              where: { id: plan.id },
              data: {
                stripeProductId: stripeResult.product.id,
                stripePriceMonthlyId: stripeResult.monthlyPrice.id,
                stripePriceYearlyId: stripeResult.yearlyPrice?.id,
              },
            });

            console.log(`✅ Synced plan ${plan.name} with Stripe`);
          } else {
            console.log(`ℹ️ Plan ${plan.name} already has Stripe product: ${plan.stripeProductId}`);
          }
        } catch (error) {
          console.error(`❌ Failed to sync plan ${plan.name}:`, error);
        }
      });

      await Promise.all(syncPromises);
      console.log("✅ Completed Stripe synchronization");
    } catch (error) {
      console.error("❌ Failed to sync plans with Stripe:", error);
      throw error;
    }
  }

  /**
   * Validate features JSON
   */
  validateFeatures(featuresJson: string): boolean {
    try {
      const features = JSON.parse(featuresJson);
      FeaturesSchema.parse(features);
      return true;
    } catch (error) {
      console.error("❌ Features validation failed:", error);
      return false;
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Enhanced plan validation with business rules
 */
export function validatePlanData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    PlanValidationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message));
    }
  }

  // Business logic validation
  if (data.yearlyPrice && data.price && data.yearlyPrice < data.price * 12 * 0.7) {
    errors.push("Yearly price should be at least 70% of monthly price * 12");
  }

  if (data.maxLocations > 1 && data.price < 50) {
    errors.push("Multi-location plans require pricing of at least $50/month");
  }

  if (data.features) {
    try {
      const features = JSON.parse(data.features);
      FeaturesSchema.parse(features);
    } catch {
      errors.push("Features must be valid JSON matching the features schema");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default StripePlanManager;
