/**
 * Super Admin Subscription Management tRPC Router
 * 
 * Comprehensive API endpoints for managing subscription plans,
 * restaurant subscriptions, analytics, and bulk operations.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { requireViewBilling, requireManagePlans, requireManageSubscriptions } from "@/utils/superAdminAuth";
import { StripeManager } from "@/utils/stripe";
import {
  CreatePlanSchema,
  UpdatePlanSchema,
  BulkOperationSchema,
  SubscriptionFilterSchema,
  type SubscriptionPlanAdmin,
  type RestaurantSubscriptionAdmin,
  type SubscriptionAnalytics,
  type BulkOperationResult,
  type RevenueForecasting,
  SUBSCRIPTION_STATUSES,
} from "@/types/subscriptionAdmin";

const stripeManager = new StripeManager();

// Permission-based procedures will be used directly in each endpoint

export const superAdminSubscriptionsRouter = createTRPCRouter({
  
  // ===== SUBSCRIPTION PLANS MANAGEMENT =====
  
  /**
   * Get all subscription plans with statistics
   */
  getPlans: publicProcedure
    .query(async ({ ctx }): Promise<SubscriptionPlanAdmin[]> => {
      const superAdmin = await requireManagePlans(ctx);
      
      try {
        const plans = await ctx.db.subscriptionPlan.findMany({
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                subscriptions: {
                  where: {
                    status: {
                      in: ["TRIAL", "ACTIVE", "PAST_DUE"]
                    }
                  }
                }
              }
            }
          }
        });

        // Calculate metrics for each plan
        const plansWithMetrics = await Promise.all(
          plans.map(async (plan) => {
            // Get subscriptions for this plan with restaurant data
            const subscriptions = await ctx.db.restaurantSubscription.findMany({
              where: {
                planId: plan.id,
                status: {
                  in: ["TRIAL", "ACTIVE", "PAST_DUE"]
                }
              },
              include: {
                restaurant: {
                  include: {
                    orders: {
                      where: {
                        status: "COMPLETED",
                        createdAt: {
                          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                        }
                      }
                    }
                  }
                }
              }
            });

            // Calculate metrics
            const totalRestaurants = subscriptions.length;
            const activeSubscriptions = subscriptions.filter(s => s.status === "ACTIVE");
            const trialSubscriptions = subscriptions.filter(s => s.status === "TRIAL");
            
            const monthlyRevenue = activeSubscriptions.reduce((sum, subscription) => {
              const monthlyOrders = subscription.restaurant.orders.filter(o => 
                o.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              );
              return sum + monthlyOrders.reduce((oSum, order) => oSum + Number(order.total), 0);
            }, 0);

            const annualRevenue = subscriptions.reduce((sum, subscription) => {
              return sum + subscription.restaurant.orders.reduce((oSum, order) => oSum + Number(order.total), 0);
            }, 0);

            // Calculate conversion rate (trials that became active)
            const totalTrials = await ctx.db.restaurantSubscription.count({
              where: {
                planId: plan.id,
                status: "TRIAL"
              }
            });
            
            const convertedTrials = await ctx.db.restaurantSubscription.count({
              where: {
                planId: plan.id,
                status: "ACTIVE",
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                }
              }
            });

            const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

            // Calculate churn rate
            const cancelledThisMonth = await ctx.db.restaurantSubscription.count({
              where: {
                planId: plan.id,
                status: "CANCELLED",
                updatedAt: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
              }
            });

            const activeAtStartOfMonth = await ctx.db.restaurantSubscription.count({
              where: {
                planId: plan.id,
                status: "ACTIVE",
                createdAt: {
                  lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
              }
            });

            const churnRate = activeAtStartOfMonth > 0 ? (cancelledThisMonth / activeAtStartOfMonth) * 100 : 0;

            // Calculate average lifetime value
            const averageLifetimeValue = totalRestaurants > 0 ? annualRevenue / totalRestaurants : 0;

            return {
              ...plan,
              totalRestaurants,
              monthlyRevenue, // Already in dollars from orders
              annualRevenue, // Already in dollars from orders
              conversionRate,
              churnRate,
              averageLifetimeValue, // Already in dollars
              activeTrials: trialSubscriptions.length,
              trialConversions: convertedTrials,
              isActive: plan.isActive ?? true,
            } as SubscriptionPlanAdmin;
          })
        );

        return plansWithMetrics;
      } catch (error) {
        console.error("[SuperAdmin] Error fetching plans:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription plans"
        });
      }
    }),

  /**
   * Create new subscription plan
   */
  createPlan: publicProcedure
    .input(CreatePlanSchema)
    .mutation(async ({ ctx, input }): Promise<SubscriptionPlanAdmin> => {
      const superAdmin = await requireManagePlans(ctx);
      
      try {
        // Create Stripe products and prices
        const stripeProduct = await stripeManager.createProduct({
          name: input.name,
          description: input.description || undefined,
        });

        const stripePriceMonthly = await stripeManager.createPrice({
          product: stripeProduct.id,
          amount: Math.round(input.priceMonthly * 100), // Convert to cents
          currency: input.currency,
          interval: 'month',
        });

        const stripePriceAnnual = await stripeManager.createPrice({
          product: stripeProduct.id,
          amount: Math.round(input.priceAnnual * 100), // Convert to cents
          currency: input.currency,
          interval: 'year',
        });

        // Create plan in database
        const plan = await ctx.db.subscriptionPlan.create({
          data: {
            name: input.name,
            description: input.description,
            priceMonthly: input.priceMonthly,
            priceAnnual: input.priceAnnual,
            currency: input.currency,
            features: input.features,
            trialDays: input.trialDays,
            isPopular: input.isPopular,
            isActive: input.isActive,
            displayOrder: input.displayOrder,
            stripeProductId: stripeProduct.id,
            stripePriceMonthlyId: stripePriceMonthly.id,
            stripePriceAnnualId: stripePriceAnnual.id,
          }
        });

        return {
          ...plan,
          totalRestaurants: 0,
          monthlyRevenue: 0,
          annualRevenue: 0,
          conversionRate: 0,
          churnRate: 0,
          averageLifetimeValue: 0,
          activeTrials: 0,
          trialConversions: 0,
          isActive: plan.isActive ?? true,
        } as SubscriptionPlanAdmin;
      } catch (error) {
        console.error("[SuperAdmin] Error creating plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subscription plan"
        });
      }
    }),

  /**
   * Update existing subscription plan
   */
  updatePlan: publicProcedure
    .input(UpdatePlanSchema)
    .mutation(async ({ ctx, input }): Promise<SubscriptionPlanAdmin> => {
      const superAdmin = await requireManagePlans(ctx);
      
      try {
        const existingPlan = await ctx.db.subscriptionPlan.findUnique({
          where: { id: input.id }
        });

        if (!existingPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription plan not found"
          });
        }

        // Update Stripe product if name or description changed
        if (input.name || input.description) {
          await stripeManager.updateProduct(existingPlan.stripeProductId!, {
            name: input.name || existingPlan.name,
            description: input.description || existingPlan.description || undefined,
          });
        }

        // Update database
        const updatedPlan = await ctx.db.subscriptionPlan.update({
          where: { id: input.id },
          data: {
            ...input,
            updatedAt: new Date(),
          }
        });

        // Return with metrics (simplified for update)
        return {
          ...updatedPlan,
          totalRestaurants: 0,
          monthlyRevenue: 0,
          annualRevenue: 0,
          conversionRate: 0,
          churnRate: 0,
          averageLifetimeValue: 0,
          activeTrials: 0,
          trialConversions: 0,
          isActive: updatedPlan.isActive ?? true,
        } as SubscriptionPlanAdmin;
      } catch (error) {
        console.error("[SuperAdmin] Error updating plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update subscription plan"
        });
      }
    }),

  /**
   * Soft delete subscription plan
   */
  deletePlan: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
      const superAdmin = await requireManagePlans(ctx);
      
      try {
        const plan = await ctx.db.subscriptionPlan.findUnique({
          where: { id: input.id },
          include: {
            _count: {
              select: {
                restaurants: {
                  where: {
                    subscriptionStatus: {
                      in: ["ACTIVE", "TRIAL", "PAST_DUE"]
                    }
                  }
                }
              }
            }
          }
        });

        if (!plan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription plan not found"
          });
        }

        if (plan._count.restaurants > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete plan with active subscriptions"
          });
        }

        // Soft delete by marking as inactive
        await ctx.db.subscriptionPlan.update({
          where: { id: input.id },
          data: {
            isActive: false,
            updatedAt: new Date(),
          }
        });

        // Archive Stripe product
        if (plan.stripeProductId) {
          await stripeManager.archiveProduct(plan.stripeProductId);
        }

        return { success: true };
      } catch (error) {
        console.error("[SuperAdmin] Error deleting plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete subscription plan"
        });
      }
    }),

  // ===== RESTAURANT SUBSCRIPTIONS MANAGEMENT =====

  /**
   * Get all restaurant subscriptions with filtering
   */
  getAllSubscriptions: publicProcedure
    .input(SubscriptionFilterSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewBilling(ctx);
      
      try {
        const where: any = {};

        // Apply filters
        if (input.status?.length) {
          where.status = { in: input.status };
        }

        if (input.planIds?.length) {
          where.planId = { in: input.planIds };
        }

        if (input.searchTerm) {
          where.restaurant = {
            OR: [
              { name: { contains: input.searchTerm, mode: 'insensitive' } },
              { subdomain: { contains: input.searchTerm, mode: 'insensitive' } },
              { adminUsers: { some: { email: { contains: input.searchTerm, mode: 'insensitive' } } } }
            ]
          };
        }

        if (input.signupDateRange) {
          where.createdAt = {
            gte: input.signupDateRange.from,
            lte: input.signupDateRange.to,
          };
        }

        // Get total count
        const totalCount = await ctx.db.restaurantSubscription.count({ where });

        // Get paginated results
        const subscriptions = await ctx.db.restaurantSubscription.findMany({
          where,
          include: {
            restaurant: {
              include: {
                adminUsers: true,
                menuItems: true,
                orders: {
                  where: {
                    createdAt: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                  }
                }
              }
            },
            plan: true
          },
          orderBy: input.sortBy === 'name' ? { restaurant: { name: input.sortOrder } } :
                   input.sortBy === 'signupDate' ? { createdAt: input.sortOrder } :
                   { createdAt: input.sortOrder },
          take: input.limit,
          skip: input.offset,
        });

        // Transform to RestaurantSubscriptionAdmin format
        const subscriptionData: RestaurantSubscriptionAdmin[] = subscriptions.map(subscription => {
          const restaurant = subscription.restaurant;
          const plan = subscription.plan;
          
          // Calculate revenue from orders (since we don't have payments table)
          const totalRevenue = restaurant.orders.reduce((sum, order) => sum + Number(order.total), 0);

          const monthsActive = Math.ceil(
            (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );

          // Calculate usage metrics
          const usageMetrics = {
            restaurantId: restaurant.id,
            period: "CURRENT_MONTH" as const,
            menuItemsCount: restaurant.menuItems.length,
            menuItemsLimit: plan.maxMenuItems,
            adminsCount: restaurant.adminUsers.length,
            adminsLimit: plan.maxUsers,
            ordersCount: restaurant.orders.length,
            ordersLimit: plan.maxOrders,
            aiChatSessions: 0, // TODO: Implement AI chat session tracking
            aiChatLimit: -1, // TODO: Get from plan features
            storageUsed: 0, // TODO: Calculate storage usage
            storageLimit: 1000, // TODO: Get from plan features
            apiCallsCount: 0, // TODO: Track API calls
            apiCallsLimit: -1, // TODO: Get from plan features
            lastUpdated: new Date(),
          };

          // Determine if at risk
          const isAtRisk = 
            subscription.status === "PAST_DUE" ||
            (subscription.status === "TRIAL" && 
             subscription.trialEnd && 
             subscription.trialEnd < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

          return {
            id: subscription.id,
            restaurant: {
              ...restaurant,
              admins: restaurant.adminUsers,
            },
            subscriptionStatus: subscription.status as any,
            currentPlan: plan,
            stripeCustomerId: subscription.stripeCustomerId || undefined,
            stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
            trialEndsAt: subscription.trialEnd || undefined,
            subscriptionEndsAt: subscription.currentPeriodEnd || undefined,
            nextBillingDate: subscription.currentPeriodEnd || undefined,
            billingCycle: "MONTHLY" as const, // TODO: Get from plan
            usageMetrics,
            paymentHistory: [], // TODO: Implement payment history
            lifetimeValue: totalRevenue,
            monthsActive,
            lastPaymentDate: undefined, // TODO: Get from payment history
            paymentMethod: undefined, // TODO: Get from payment history
            isAtRisk,
            supportTickets: 0, // TODO: Implement support ticket tracking
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
          };
        });

        // Calculate aggregations
        const totalRevenue = subscriptionData.reduce((sum, sub) => sum + sub.lifetimeValue, 0);
        const averageRevenue = subscriptionData.length > 0 ? totalRevenue / subscriptionData.length : 0;

        const statusBreakdown = subscriptionData.reduce((acc, sub) => {
          acc[sub.subscriptionStatus] = (acc[sub.subscriptionStatus] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const planBreakdown = subscriptionData.reduce((acc, sub) => {
          const planName = sub.currentPlan.name;
          acc[planName] = (acc[planName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          subscriptions: subscriptionData,
          totalCount,
          filteredCount: subscriptionData.length,
          hasMore: input.offset + input.limit < totalCount,
          aggregations: {
            totalRevenue,
            averageRevenue,
            statusBreakdown,
            planBreakdown,
          },
        };
      } catch (error) {
        console.error("[SuperAdmin] Error fetching subscriptions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch restaurant subscriptions"
        });
      }
    }),

  /**
   * Get detailed subscription information
   */
  getSubscriptionDetails: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewBilling(ctx);
      try {
        const restaurant = await ctx.db.restaurant.findUnique({
          where: { id: input.restaurantId },
          include: {
            adminUsers: true,
            subscription: {
              include: {
                plan: true
              }
            },
            menuItems: true,
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 20 // Limit recent orders
            },
          }
        });

        if (!restaurant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found"
          });
        }

        // TODO: Transform to detailed format with all metrics
        return restaurant;
      } catch (error) {
        console.error("[SuperAdmin] Error fetching subscription details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to fetch subscription details"
        });
      }
    }),

  // ===== SUBSCRIPTION STATUS MANAGEMENT =====

  /**
   * Update subscription status
   */
  updateSubscriptionStatus: publicProcedure
    .input(z.object({
      restaurantId: z.string().uuid(),
      status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "UNPAID"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageSubscriptions(ctx);
      
      try {
        const restaurant = await ctx.db.restaurant.findUnique({
          where: { id: input.restaurantId },
        });

        if (!restaurant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found"
          });
        }

        // Update subscription status
        await ctx.db.restaurant.update({
          where: { id: input.restaurantId },
          data: {
            subscriptionStatus: input.status,
            updatedAt: new Date(),
          }
        });

        // Log the status change in SuperAdmin audit log
        const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
        await logSuperAdminActivity(superAdmin.id, "UPDATE_SUBSCRIPTION_STATUS", {
          restaurantId: input.restaurantId,
          oldStatus: restaurant.subscriptionStatus,
          newStatus: input.status,
          reason: input.reason,
        });

        // TODO: Handle Stripe subscription updates if needed

        return { success: true };
      } catch (error) {
        console.error("[SuperAdmin] Error updating subscription status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update subscription status"
        });
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: publicProcedure
    .input(z.object({
      restaurantId: z.string().uuid(),
      reason: z.string().optional(),
      immediate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageSubscriptions(ctx);
      
      try {
        const restaurant = await ctx.db.restaurant.findUnique({
          where: { id: input.restaurantId },
          include: {
            subscription: true
          }
        });

        if (!restaurant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found"
          });
        }

        // Cancel Stripe subscription if exists
        if (restaurant.subscription?.stripeSubscriptionId) {
          await stripeManager.cancelSubscription(
            restaurant.subscription.stripeSubscriptionId,
            input.immediate
          );
        }

        // Update restaurant status
        await ctx.db.restaurant.update({
          where: { id: input.restaurantId },
          data: {
            subscriptionStatus: "CANCELLED",
          }
        });
        
        // Also update the subscription record if it exists
        const subscription = await ctx.db.restaurantSubscription.findUnique({
          where: { restaurantId: input.restaurantId }
        });
        
        if (subscription) {
          await ctx.db.restaurantSubscription.update({
            where: { id: subscription.id },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
              cancelAtPeriodEnd: input.immediate ? false : true,
            }
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[SuperAdmin] Error cancelling subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel subscription"
        });
      }
    }),

  /**
   * Extend trial period
   */
  extendTrial: publicProcedure
    .input(z.object({
      restaurantId: z.string().uuid(),
      extensionDays: z.number().min(1).max(90),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageSubscriptions(ctx);
      
      try {
        const restaurant = await ctx.db.restaurant.findUnique({
          where: { id: input.restaurantId },
        });

        if (!restaurant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found"
          });
        }

        const currentTrialEnd = restaurant.trialEndsAt || new Date();
        const newTrialEnd = new Date(currentTrialEnd.getTime() + input.extensionDays * 24 * 60 * 60 * 1000);

        await ctx.db.restaurant.update({
          where: { id: input.restaurantId },
          data: {
            trialEndsAt: newTrialEnd,
            subscriptionStatus: "TRIAL",
            updatedAt: new Date(),
          }
        });

        return { success: true, newTrialEnd };
      } catch (error) {
        console.error("[SuperAdmin] Error extending trial:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to extend trial"
        });
      }
    }),

  // ===== BULK OPERATIONS =====

  /**
   * Perform bulk operations on multiple subscriptions
   */
  performBulkOperation: publicProcedure
    .input(BulkOperationSchema)
    .mutation(async ({ ctx, input }): Promise<BulkOperationResult> => {
      const superAdmin = await requireManageSubscriptions(ctx);
      
      const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const results: BulkOperationResult['results'] = [];
      
      try {
        for (const restaurantId of input.restaurantIds) {
          try {
            const restaurant = await ctx.db.restaurant.findUnique({
              where: { id: restaurantId },
              select: { id: true, name: true, subscriptionStatus: true }
            });

            if (!restaurant) {
              results.push({
                restaurantId,
                restaurantName: "Unknown",
                success: false,
                error: "Restaurant not found"
              });
              continue;
            }

            switch (input.operation) {
              case "CANCEL":
                await ctx.db.restaurant.update({
                  where: { id: restaurantId },
                  data: { subscriptionStatus: "CANCELLED" }
                });
                break;

              case "EXTEND_TRIAL":
                if (input.trialExtensionDays) {
                  const newTrialEnd = new Date(Date.now() + input.trialExtensionDays * 24 * 60 * 60 * 1000);
                  await ctx.db.restaurant.update({
                    where: { id: restaurantId },
                    data: {
                      trialEndsAt: newTrialEnd,
                      subscriptionStatus: "TRIAL"
                    }
                  });
                }
                break;

              case "UPGRADE":
              case "DOWNGRADE":
                if (input.targetPlanId) {
                  const subscription = await ctx.db.restaurantSubscription.findUnique({
                    where: { restaurantId: restaurantId }
                  });
                  
                  if (subscription) {
                    await ctx.db.restaurantSubscription.update({
                      where: { id: subscription.id },
                      data: { planId: input.targetPlanId }
                    });
                  }
                }
                break;

              case "CHANGE_BILLING":
                // Note: Billing cycle is not stored in the database schema
                // This would require updating the Stripe subscription
                // For now, we'll skip this operation
                break;

              case "REACTIVATE":
                await ctx.db.restaurant.update({
                  where: { id: restaurantId },
                  data: { subscriptionStatus: "ACTIVE" }
                });
                break;
            }

            results.push({
              restaurantId,
              restaurantName: restaurant.name,
              success: true,
              newStatus: input.operation === "CANCEL" ? "CANCELLED" : 
                        input.operation === "REACTIVATE" ? "ACTIVE" :
                        input.operation === "EXTEND_TRIAL" ? "TRIAL" : 
                        restaurant.subscriptionStatus,
            });
          } catch (error) {
            results.push({
              restaurantId,
              restaurantName: "Unknown",
              success: false,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return {
          operationId,
          totalRequested: input.restaurantIds.length,
          successful,
          failed,
          results,
          startedAt: new Date(),
          completedAt: new Date(),
          status: "COMPLETED"
        };
      } catch (error) {
        console.error("[SuperAdmin] Error performing bulk operation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to perform bulk operation"
        });
      }
    }),

  // ===== ANALYTICS AND REPORTING =====

  /**
   * Get comprehensive subscription analytics
   */
  getSubscriptionAnalytics: publicProcedure
    .query(async ({ ctx }): Promise<SubscriptionAnalytics> => {
      const superAdmin = await requireViewBilling(ctx);
      
      try {
        // Get all restaurants with subscription and order data
        const restaurants = await ctx.db.restaurant.findMany({
          include: {
            orders: {
              where: { 
                status: "SERVED",
                createdAt: {
                  gte: new Date(new Date().getFullYear(), 0, 1) // This year
                }
              }
            },
            subscription: {
              include: {
                plan: true
              }
            }
          }
        });

        const totalRevenue = restaurants.reduce((sum, restaurant) => 
          sum + restaurant.orders.reduce((oSum, order) => oSum + Number(order.total), 0), 0
        );

        const activeSubscriptions = restaurants.filter(r => r.subscriptionStatus === "ACTIVE").length;
        const trialSubscriptions = restaurants.filter(r => r.subscriptionStatus === "TRIAL").length;
        const cancelledSubscriptions = restaurants.filter(r => r.subscriptionStatus === "CANCELLED").length;

        // Calculate MRR (simplified - based on orders from active restaurants)
        const monthlyRevenue = restaurants
          .filter(r => r.subscriptionStatus === "ACTIVE")
          .reduce((sum, restaurant) => {
            const monthlyOrders = restaurant.orders.filter(o => 
              o.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            );
            return sum + monthlyOrders.reduce((oSum, order) => oSum + Number(order.total), 0);
          }, 0);

        const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

        // Revenue breakdown by plan
        const revenueByPlan = restaurants.reduce((acc, restaurant) => {
          if (restaurant.subscription?.plan) {
            const planRevenue = restaurant.orders.reduce((sum, order) => sum + Number(order.total), 0);
            const existing = acc.find(item => item.planName === restaurant.subscription!.plan.name);
            if (existing) {
              existing.revenue += planRevenue;
              existing.subscribers += 1;
            } else {
              acc.push({
                planName: restaurant.subscription.plan.name,
                revenue: planRevenue,
                subscribers: 1,
                percentage: 0, // Will calculate after
              });
            }
          }
          return acc;
        }, [] as Array<{ planName: string; revenue: number; subscribers: number; percentage: number }>);

        // Calculate percentages
        revenueByPlan.forEach(plan => {
          plan.percentage = totalRevenue > 0 ? (plan.revenue / totalRevenue) * 100 : 0;
        });

        return {
          overview: {
            totalRevenue,
            monthlyRecurringRevenue: monthlyRevenue,
            annualRecurringRevenue: monthlyRevenue * 12,
            totalActiveSubscriptions: activeSubscriptions,
            totalTrialSubscriptions: trialSubscriptions,
            totalCancelledSubscriptions: cancelledSubscriptions,
            averageRevenuePerUser,
            customerLifetimeValue: averageRevenuePerUser * 12, // Simplified calculation
            churnRate: 0, // TODO: Calculate actual churn rate
            conversionRate: 0, // TODO: Calculate conversion rate
            growthRate: 0, // TODO: Calculate growth rate
          },
          revenueBreakdown: {
            byPlan: revenueByPlan,
            byMonth: [], // TODO: Implement monthly breakdown
            byStatus: [], // TODO: Implement status breakdown
          },
          conversionFunnel: {
            registrations: restaurants.length,
            trialsStarted: trialSubscriptions,
            trialsConverted: activeSubscriptions,
            subscriptionsActive: activeSubscriptions,
            subscriptionsCancelled: cancelledSubscriptions,
            conversionRate: trialSubscriptions > 0 ? (activeSubscriptions / trialSubscriptions) * 100 : 0,
            dropoffPoints: [],
          },
          churnAnalysis: {
            overallChurnRate: 0,
            churnByPlan: [],
            churnReasons: [],
            atRiskCustomers: [],
          },
          paymentAnalysis: {
            paymentSuccessRate: 0,
            averagePaymentAmount: 0,
            paymentFailureReasons: [],
            recoveryRate: 0,
            dunningEffectiveness: 0,
          },
        };
      } catch (error) {
        console.error("[SuperAdmin] Error fetching analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription analytics"
        });
      }
    }),

  /**
   * Get revenue forecasting
   */
  getRevenueForecasting: publicProcedure
    .query(async ({ ctx }): Promise<RevenueForecasting> => {
      const superAdmin = await requireViewBilling(ctx);
      
      try {
        // TODO: Implement sophisticated revenue forecasting
        // For now, return basic projection based on current MRR
        
        const currentMRR = 0; // TODO: Calculate actual MRR
        
        return {
          projectedMRR: Array.from({ length: 12 }, (_, i) => ({
            month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
            projected: currentMRR * (1 + 0.05) ** i, // 5% monthly growth assumption
            confidence: Math.max(0.5, 0.9 - i * 0.05), // Decreasing confidence over time
            factors: ["Historical growth", "Market trends", "Seasonal adjustments"],
          })),
          projectedARR: currentMRR * 12,
          growthProjection: {
            conservative: currentMRR * 12 * 1.2,
            realistic: currentMRR * 12 * 1.5,
            optimistic: currentMRR * 12 * 2.0,
          },
          seasonalityFactors: [],
        };
      } catch (error) {
        console.error("[SuperAdmin] Error generating revenue forecast:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate revenue forecast"
        });
      }
    }),
}); 