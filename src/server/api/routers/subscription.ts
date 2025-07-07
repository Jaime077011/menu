import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { FeatureGate } from "@/utils/featureGating";
import { StripeManager, getPriceIdFromPlan } from "@/utils/stripe";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = createTRPCRouter({
  // Get all available subscription plans
  getPlans: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        price: true,
        billingInterval: true,
        maxLocations: true,
        maxMenuItems: true,
        features: true,
        sortOrder: true,
      },
    });
  }),

  // Get current restaurant's subscription
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.session.restaurantId;

    const subscription = await ctx.db.restaurantSubscription.findUnique({
      where: { restaurantId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            price: true,
            billingInterval: true,
            maxLocations: true,
            maxMenuItems: true,
            features: true,
          },
        },
      },
    });

    if (!subscription) {
      // Return trial information if no subscription exists
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          subscriptionStatus: true,
          trialEndsAt: true,
        },
      });

      return {
        status: "TRIAL" as const,
        isTrialActive: restaurant?.subscriptionStatus === "TRIAL",
        trialEndsAt: restaurant?.trialEndsAt,
        plan: null,
        subscription: null,
      };
    }

    return {
      status: subscription.status,
      isTrialActive: subscription.status === "TRIAL",
      trialEndsAt: subscription.trialEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      plan: subscription.plan,
      subscription: {
        id: subscription.id,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    };
  }),

  // Get restaurant features and limits
  getFeatures: protectedProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.session.restaurantId;
    
    const features = await FeatureGate.getRestaurantFeatures(restaurantId);
    const subscriptionStatus = await FeatureGate.getSubscriptionStatus(restaurantId);
    
    // Get current usage counts
    const [menuItemCount, adminUserCount] = await Promise.all([
      ctx.db.menuItem.count({ where: { restaurantId } }),
      ctx.db.adminUser.count({ where: { restaurantId } }),
    ]);

    // Get limits
    const [menuItemLimit, adminUserLimit] = await Promise.all([
      FeatureGate.enforceLimit(restaurantId, "MENU_ITEMS", menuItemCount),
      FeatureGate.enforceLimit(restaurantId, "ADMIN_USERS", adminUserCount),
    ]);

    return {
      features,
      subscriptionStatus,
      usage: {
        menuItems: menuItemLimit,
        adminUsers: adminUserLimit,
      },
    };
  }),

  // Get usage metrics
  getUsage: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).optional().default(3),
      })
    )
    .query(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;
      return await FeatureGate.getUsageMetrics(restaurantId, input.months);
    }),

  // Check if restaurant can perform a specific action
  canPerformAction: protectedProcedure
    .input(
      z.object({
        action: z.enum(["ADD_MENU_ITEM", "ADD_ADMIN_USER", "USE_CUSTOM_BRANDING", "ACCESS_API"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;

      switch (input.action) {
        case "ADD_MENU_ITEM":
          return { allowed: await FeatureGate.canAddMenuItem(restaurantId) };
        
        case "ADD_ADMIN_USER":
          return { allowed: await FeatureGate.canAddAdminUser(restaurantId) };
        
        case "USE_CUSTOM_BRANDING":
          return { allowed: await FeatureGate.checkFeature(restaurantId, "customBranding") };
        
        case "ACCESS_API":
          return { allowed: await FeatureGate.checkFeature(restaurantId, "apiAccess") };
        
        default:
          return { allowed: false };
      }
    }),

  // Start a subscription (placeholder for Stripe integration)
  subscribe: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        paymentMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;

      // Check if restaurant already has an active subscription
      const existingSubscription = await ctx.db.restaurantSubscription.findUnique({
        where: { restaurantId },
      });

      if (existingSubscription && existingSubscription.status === "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant already has an active subscription",
        });
      }

      // Get the plan
      const plan = await ctx.db.subscriptionPlan.findUnique({
        where: { id: input.planId },
      });

      if (!plan || !plan.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found or inactive",
        });
      }

      // TODO: Integrate with Stripe
      // For now, create a trial subscription
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

      const subscription = await ctx.db.restaurantSubscription.upsert({
        where: { restaurantId },
        update: {
          planId: input.planId,
          status: "TRIAL",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialEnd: trialEnd,
        },
        create: {
          restaurantId,
          planId: input.planId,
          status: "TRIAL",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialEnd: trialEnd,
        },
        include: {
          plan: true,
        },
      });

      // Update restaurant subscription status
      await ctx.db.restaurant.update({
        where: { id: restaurantId },
        data: {
          subscriptionStatus: "TRIAL",
          trialEndsAt: trialEnd,
        },
      });

      // Track usage
      await FeatureGate.trackUsage(restaurantId, "API_CALLS");

      return subscription;
    }),

  // Cancel subscription
  cancel: protectedProcedure
    .input(
      z.object({
        cancelAtPeriodEnd: z.boolean().optional().default(true),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;

      const subscription = await ctx.db.restaurantSubscription.findUnique({
        where: { restaurantId },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No subscription found",
        });
      }

      if (subscription.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription is already cancelled",
        });
      }

      // TODO: Cancel Stripe subscription
      
      const updatedSubscription = await ctx.db.restaurantSubscription.update({
        where: { restaurantId },
        data: {
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          cancelledAt: input.cancelAtPeriodEnd ? undefined : new Date(),
          status: input.cancelAtPeriodEnd ? subscription.status : "CANCELLED",
        },
        include: {
          plan: true,
        },
      });

      // If cancelling immediately, update restaurant status
      if (!input.cancelAtPeriodEnd) {
        await ctx.db.restaurant.update({
          where: { id: restaurantId },
          data: {
            subscriptionStatus: "CANCELLED",
          },
        });
      }

      // Track usage
      await FeatureGate.trackUsage(restaurantId, "API_CALLS");

      return updatedSubscription;
    }),

  // Change subscription plan
  changePlan: protectedProcedure
    .input(
      z.object({
        newPlanName: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;

      const [currentSubscription, newPlan] = await Promise.all([
        ctx.db.restaurantSubscription.findUnique({
          where: { restaurantId },
          include: { plan: true },
        }),
        ctx.db.subscriptionPlan.findUnique({
          where: { name: input.newPlanName },
        }),
      ]);

      if (!currentSubscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No current subscription found",
        });
      }

      if (!newPlan || !newPlan.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "New subscription plan not found or inactive",
        });
      }

      if (currentSubscription.planId === newPlan.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already subscribed to this plan",
        });
      }

      // Check if downgrading and validate limits
      const isDowngrade = newPlan.price < currentSubscription.plan.price;
      
      if (isDowngrade) {
        // Check if current usage exceeds new plan limits
        const [menuItemCount, adminUserCount] = await Promise.all([
          ctx.db.menuItem.count({ where: { restaurantId } }),
          ctx.db.adminUser.count({ where: { restaurantId } }),
        ]);

        if (newPlan.maxMenuItems !== -1 && menuItemCount > newPlan.maxMenuItems) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot downgrade: You have ${menuItemCount} menu items but the new plan allows only ${newPlan.maxMenuItems}`,
          });
        }

        if (newPlan.maxLocations !== -1 && newPlan.maxLocations < currentSubscription.plan.maxLocations) {
          // Check if restaurant has multiple locations (when that feature is implemented)
          // For now, assume single location
        }
      }

      // TODO: Update Stripe subscription
      
      const updatedSubscription = await ctx.db.restaurantSubscription.update({
        where: { restaurantId },
        data: {
          planId: newPlan.id,
        },
        include: {
          plan: true,
        },
      });

      // Track usage
      await FeatureGate.trackUsage(restaurantId, "API_CALLS");

      return updatedSubscription;
    }),

  // Reactivate cancelled subscription
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const restaurantId = ctx.session.restaurantId;

    const subscription = await ctx.db.restaurantSubscription.findUnique({
      where: { restaurantId },
    });

    if (!subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    if (subscription.status !== "CANCELLED" && !subscription.cancelAtPeriodEnd) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Subscription is not cancelled",
      });
    }

    // TODO: Reactivate Stripe subscription
    
    const updatedSubscription = await ctx.db.restaurantSubscription.update({
      where: { restaurantId },
      data: {
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
    });

    // Update restaurant status
    await ctx.db.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: "ACTIVE",
      },
    });

    // Track usage
    await FeatureGate.trackUsage(restaurantId, "API_CALLS");

    return updatedSubscription;
  }),

  // Get billing history from Stripe
  getBillingHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;
      
      // Get restaurant subscription
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: restaurantId },
        include: { subscription: { include: { plan: true } } },
      });

      if (!restaurant?.subscription || !restaurant.stripeCustomerId) {
        return [];
      }

      try {
        // Get billing history from Stripe
        const invoices = await StripeManager.getBillingHistory(
          restaurant.stripeCustomerId,
          input.limit
        );

        return invoices.map(invoice => ({
          id: invoice.id,
          date: new Date(invoice.created * 1000),
          amount: invoice.amount_paid / 100, // Convert from cents
          status: invoice.status,
          description: invoice.description || `${restaurant.subscription!.plan.displayName} Plan`,
          currency: invoice.currency,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
        }));
      } catch (error) {
        console.error("Error fetching billing history:", error);
        // Return empty array on error
        return [];
      }
    }),

  // Create Stripe checkout session for subscription
  createCheckoutSession: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      planName: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      trialDays: z.number().optional().default(14),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get restaurant details
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
        include: { 
          subscription: true,
          adminUsers: { where: { role: "ADMIN" }, take: 1 }
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      if (!restaurant.adminUsers[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant has no admin user",
        });
      }

      // Check if restaurant already has an active subscription
      if (restaurant.subscription?.status === "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant already has an active subscription",
        });
      }

      try {
        const adminUser = restaurant.adminUsers[0];
        const priceId = getPriceIdFromPlan(input.planName);

        // Create or get Stripe customer
        let customerId = restaurant.stripeCustomerId;
        
        if (!customerId) {
          const customer = await StripeManager.createCustomer({
            email: adminUser.email,
            name: restaurant.name,
            restaurantId: restaurant.id,
            metadata: { planName: input.planName },
          });

          customerId = customer.id;

          // Update restaurant with Stripe customer ID
          await ctx.db.restaurant.update({
            where: { id: input.restaurantId },
            data: { stripeCustomerId: customerId },
          });
        }

        // Create subscription directly with Stripe
        const subscription = await StripeManager.createSubscription({
          customerId,
          priceId,
          restaurantId: restaurant.id,
          trialDays: input.trialDays,
          metadata: { planName: input.planName },
        });

        // Get the payment intent from the subscription
        const paymentIntent = subscription.latest_invoice?.payment_intent;
        
        return {
          subscriptionId: subscription.id,
          clientSecret: typeof paymentIntent === "object" ? paymentIntent?.client_secret : null,
          status: subscription.status,
        };

      } catch (error) {
        console.error("Error creating subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subscription",
        });
      }
    }),

  // Create billing portal session
  createBillingPortal: protectedProcedure
    .input(z.object({
      returnUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;
      
      // Get restaurant with subscription
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: restaurantId },
        include: { subscription: true },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      if (!restaurant.stripeCustomerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant has no Stripe customer ID",
        });
      }

      if (!restaurant.subscription || restaurant.subscription.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant has no active subscription",
        });
      }

      try {
        const session = await StripeManager.createBillingPortalSession(
          restaurant.stripeCustomerId,
          input.returnUrl
        );

        return { url: session.url };

      } catch (error) {
        console.error("Error creating billing portal session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create billing portal session",
        });
      }
    }),

  // Get upcoming invoice preview
  getUpcomingInvoice: protectedProcedure.query(async ({ ctx }) => {
    const restaurantId = ctx.session.restaurantId;
    
    // Get restaurant subscription
    const restaurant = await ctx.db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    });

    if (!restaurant?.subscription || !restaurant.stripeCustomerId) {
      return null;
    }

    try {
      const invoice = await StripeManager.getUpcomingInvoice(
        restaurant.stripeCustomerId,
        restaurant.subscription.stripeSubscriptionId
      );

      return {
        amount: invoice.amount_due / 100, // Convert from cents to dollars
        currency: invoice.currency,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      };

    } catch (error) {
      console.error("Error fetching upcoming invoice:", error);
      return null;
    }
  }),

  // Get usage metrics
  getUsageMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(3),
      })
    )
    .query(async ({ ctx, input }) => {
      const restaurantId = ctx.session.restaurantId;

      // Get current subscription and limits
      const subscription = await ctx.db.restaurantSubscription.findUnique({
        where: { restaurantId },
        include: { plan: true },
      });

      // Get current counts
      const [menuItemCount, adminUserCount, orderCount] = await Promise.all([
        ctx.db.menuItem.count({ where: { restaurantId } }),
        ctx.db.adminUser.count({ where: { restaurantId } }),
        ctx.db.order.count({
          where: {
            restaurantId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

      // Get usage metrics from database
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const usageMetrics = await ctx.db.usageMetric.findMany({
        where: {
          restaurantId,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate API calls usage
      const apiCallsUsage = usageMetrics
        .filter(metric => metric.metricType === 'API_CALLS')
        .reduce((sum, metric) => sum + metric.value, 0);

      // Get limits from subscription plan
      const limits = {
        menuItems: subscription?.plan?.maxMenuItems ?? 50,
        adminUsers: subscription?.plan?.maxAdminUsers ?? 3,
        apiCalls: subscription?.plan?.maxApiCalls ?? 1000,
      };

      // Calculate previous period for trend analysis
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - input.months);

      const previousOrderCount = await ctx.db.order.count({
        where: {
          restaurantId,
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      });

      const orderTrend = previousOrderCount > 0 
        ? ((orderCount - previousOrderCount) / previousOrderCount) * 100 
        : 0;

      return {
        menuItems: {
          current: menuItemCount,
          limit: limits.menuItems,
        },
        adminUsers: {
          current: adminUserCount,
          limit: limits.adminUsers,
        },
        apiCalls: {
          current: apiCallsUsage,
          limit: limits.apiCalls,
        },
        orders: {
          current: orderCount,
          trend: orderTrend > 0 ? 'up' : 'down',
          changePercent: Math.abs(Math.round(orderTrend)),
        },
      };
    }),
});
