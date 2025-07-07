import { PrismaClient } from "@prisma/client";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PlanMetrics {
  planId: string;
  planName: string;
  planDisplayName: string;
  
  // Revenue Metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  
  // Subscription Metrics
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  
  // Conversion Metrics
  trialToActiveConversions: number;
  conversionRate: number;
  churnRate: number;
  
  // Usage Metrics
  totalOrders: number;
  totalMenuItems: number;
  totalRestaurants: number;
  averageOrdersPerRestaurant: number;
  
  // Growth Metrics
  newSubscriptionsThisMonth: number;
  revenueGrowth: number;
  subscriptionGrowth: number;
}

export interface PlanAnalyticsParams {
  planId?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  endDate?: Date;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  subscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
}

export interface UsageBreakdown {
  planId: string;
  planName: string;
  restaurants: Array<{
    id: string;
    name: string;
    subdomain: string;
    subscriptionStatus: string;
    orders: number;
    menuItems: number;
    revenue: number;
    usagePercentage: {
      orders: number;
      menuItems: number;
      users: number;
    };
  }>;
}

// ============================================================================
// PLAN ANALYTICS MANAGER CLASS
// ============================================================================

export class PlanAnalyticsManager {
  private static instance: PlanAnalyticsManager;
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  public static getInstance(db: PrismaClient): PlanAnalyticsManager {
    if (!PlanAnalyticsManager.instance) {
      PlanAnalyticsManager.instance = new PlanAnalyticsManager(db);
    }
    return PlanAnalyticsManager.instance;
  }

  /**
   * Get comprehensive metrics for a specific plan or all plans
   */
  async getPlanMetrics(planId?: string): Promise<PlanMetrics[]> {
    try {
      const whereClause = planId ? { id: planId } : {};
      
      const plans = await this.db.subscriptionPlan.findMany({
        where: whereClause,
        include: {
          subscriptions: {
            include: {
              restaurant: {
                include: {
                  orders: {
                    where: {
                      status: { not: "CANCELLED" },
                    },
                  },
                  menuItems: true,
                  adminUsers: true,
                },
              },
            },
          },
        },
      });

      const metricsPromises = plans.map(async (plan) => {
        const subscriptions = plan.subscriptions;
        const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
        const trialSubscriptions = subscriptions.filter(s => s.status === 'TRIAL');
        
        // Calculate revenue metrics
        const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
          return sum + Number(plan.price);
        }, 0);

        const averageRevenuePerUser = activeSubscriptions.length > 0 
          ? monthlyRevenue / activeSubscriptions.length 
          : 0;

        // Calculate usage metrics
        const totalOrders = subscriptions.reduce((sum, sub) => {
          return sum + (sub.restaurant?.orders?.length || 0);
        }, 0);

        const totalMenuItems = subscriptions.reduce((sum, sub) => {
          return sum + (sub.restaurant?.menuItems?.length || 0);
        }, 0);

        const averageOrdersPerRestaurant = subscriptions.length > 0 
          ? totalOrders / subscriptions.length 
          : 0;

        // Calculate conversion metrics
        const trialConversions = await this.getTrialConversions(plan.id);
        const conversionRate = trialSubscriptions.length > 0 
          ? (trialConversions / trialSubscriptions.length) * 100 
          : 0;

        // Calculate churn rate
        const churnRate = await this.calculateChurnRate(plan.id);

        // Calculate growth metrics
        const newSubscriptionsThisMonth = await this.getNewSubscriptions(plan.id);
        const revenueGrowth = await this.calculateRevenueGrowth(plan.id);
        const subscriptionGrowth = await this.calculateSubscriptionGrowth(plan.id);

        return {
          planId: plan.id,
          planName: plan.name,
          planDisplayName: plan.displayName,
          
          // Revenue Metrics
          totalRevenue: monthlyRevenue,
          monthlyRecurringRevenue: monthlyRevenue,
          averageRevenuePerUser,
          
          // Subscription Metrics
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: activeSubscriptions.length,
          trialSubscriptions: trialSubscriptions.length,
          cancelledSubscriptions: subscriptions.filter(s => s.status === 'CANCELLED').length,
          
          // Conversion Metrics
          trialToActiveConversions: trialConversions,
          conversionRate,
          churnRate,
          
          // Usage Metrics
          totalOrders,
          totalMenuItems,
          totalRestaurants: subscriptions.length,
          averageOrdersPerRestaurant,
          
          // Growth Metrics
          newSubscriptionsThisMonth,
          revenueGrowth,
          subscriptionGrowth,
        };
      });

      return Promise.all(metricsPromises);
    } catch (error) {
      console.error("❌ Failed to get plan metrics:", error);
      throw new Error(`Failed to get plan metrics: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get detailed usage breakdown by restaurant
   */
  async getUsageBreakdown(planId: string): Promise<UsageBreakdown> {
    try {
      const plan = await this.db.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          subscriptions: {
            include: {
              restaurant: {
                include: {
                  orders: {
                    where: {
                      status: { not: "CANCELLED" },
                    },
                  },
                  menuItems: true,
                  adminUsers: true,
                },
              },
            },
          },
        },
      });

      if (!plan) {
        throw new Error("Plan not found");
      }

      const restaurants = plan.subscriptions.map((subscription) => {
        const restaurant = subscription.restaurant;
        if (!restaurant) return null;

        const orders = restaurant.orders?.length || 0;
        const menuItems = restaurant.menuItems?.length || 0;
        const users = restaurant.adminUsers?.length || 0;

        // Calculate usage percentages based on plan limits
        const usagePercentage = {
          orders: plan.maxOrders > 0 ? (orders / plan.maxOrders) * 100 : 0,
          menuItems: plan.maxMenuItems > 0 ? (menuItems / plan.maxMenuItems) * 100 : 0,
          users: plan.maxUsers > 0 ? (users / plan.maxUsers) * 100 : 0,
        };

        // Calculate revenue contribution
        const revenue = subscription.status === 'ACTIVE' ? Number(plan.price) : 0;

        return {
          id: restaurant.id,
          name: restaurant.name,
          subdomain: restaurant.subdomain,
          subscriptionStatus: subscription.status,
          orders,
          menuItems,
          revenue,
          usagePercentage,
        };
      }).filter(Boolean) as UsageBreakdown['restaurants'];

      return {
        planId: plan.id,
        planName: plan.name,
        restaurants,
      };
    } catch (error) {
      console.error("❌ Failed to get usage breakdown:", error);
      throw new Error(`Failed to get usage breakdown: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Record analytics data for a specific period
   */
  async recordPlanAnalytics(planId: string, period: Date, periodType: string): Promise<void> {
    try {
      const metrics = await this.getPlanMetrics(planId);
      const planMetric = metrics[0];

      if (!planMetric) {
        throw new Error("Plan not found");
      }

      await this.db.planAnalytics.upsert({
        where: {
          planId_period_periodType: {
            planId,
            period,
            periodType,
          },
        },
        update: {
          totalRevenue: planMetric.totalRevenue,
          monthlyRecurringRevenue: planMetric.monthlyRecurringRevenue,
          averageRevenuePerUser: planMetric.averageRevenuePerUser,
          newSubscriptions: planMetric.newSubscriptionsThisMonth,
          cancelledSubscriptions: planMetric.cancelledSubscriptions,
          activeSubscriptions: planMetric.activeSubscriptions,
          trialSubscriptions: planMetric.trialSubscriptions,
          trialToActiveConversions: planMetric.trialToActiveConversions,
          conversionRate: planMetric.conversionRate,
          churnRate: planMetric.churnRate,
          totalOrders: planMetric.totalOrders,
          totalMenuItems: planMetric.totalMenuItems,
          totalRestaurants: planMetric.totalRestaurants,
          averageOrdersPerRestaurant: planMetric.averageOrdersPerRestaurant,
          activeRestaurants: planMetric.activeSubscriptions,
        },
        create: {
          planId,
          period,
          periodType,
          totalRevenue: planMetric.totalRevenue,
          monthlyRecurringRevenue: planMetric.monthlyRecurringRevenue,
          averageRevenuePerUser: planMetric.averageRevenuePerUser,
          newSubscriptions: planMetric.newSubscriptionsThisMonth,
          cancelledSubscriptions: planMetric.cancelledSubscriptions,
          activeSubscriptions: planMetric.activeSubscriptions,
          trialSubscriptions: planMetric.trialSubscriptions,
          trialToActiveConversions: planMetric.trialToActiveConversions,
          conversionRate: planMetric.conversionRate,
          churnRate: planMetric.churnRate,
          totalOrders: planMetric.totalOrders,
          totalMenuItems: planMetric.totalMenuItems,
          totalRestaurants: planMetric.totalRestaurants,
          averageOrdersPerRestaurant: planMetric.averageOrdersPerRestaurant,
          activeRestaurants: planMetric.activeSubscriptions,
        },
      });

      console.log(`✅ Recorded analytics for plan ${planId} for period ${period.toISOString()}`);
    } catch (error) {
      console.error("❌ Failed to record plan analytics:", error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getTrialConversions(planId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const conversions = await this.db.restaurantSubscription.count({
      where: {
        planId,
        status: 'ACTIVE',
        createdAt: { gte: startOfMonth },
      },
    });

    return conversions;
  }

  private async calculateChurnRate(planId: string): Promise<number> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const activeLastMonth = await this.db.restaurantSubscription.count({
      where: {
        planId,
        status: 'ACTIVE',
        createdAt: { lt: startOfCurrentMonth },
      },
    });

    const churnedThisMonth = await this.db.restaurantSubscription.count({
      where: {
        planId,
        status: 'CANCELLED',
        cancelledAt: {
          gte: startOfCurrentMonth,
        },
      },
    });

    return activeLastMonth > 0 ? (churnedThisMonth / activeLastMonth) * 100 : 0;
  }

  private async getNewSubscriptions(planId: string): Promise<number> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.db.restaurantSubscription.count({
      where: {
        planId,
        createdAt: { gte: startOfCurrentMonth },
      },
    });
  }

  private async calculateRevenueGrowth(planId: string): Promise<number> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return 0;

    const currentMonthActive = await this.db.restaurantSubscription.count({
      where: {
        planId,
        status: 'ACTIVE',
        createdAt: { gte: startOfCurrentMonth },
      },
    });

    const lastMonthActive = await this.db.restaurantSubscription.count({
      where: {
        planId,
        status: 'ACTIVE',
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const currentRevenue = currentMonthActive * Number(plan.price);
    const lastRevenue = lastMonthActive * Number(plan.price);

    return lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  }

  private async calculateSubscriptionGrowth(planId: string): Promise<number> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthSubs = await this.db.restaurantSubscription.count({
      where: {
        planId,
        createdAt: { gte: startOfCurrentMonth },
      },
    });

    const lastMonthSubs = await this.db.restaurantSubscription.count({
      where: {
        planId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    return lastMonthSubs > 0 ? ((currentMonthSubs - lastMonthSubs) / lastMonthSubs) * 100 : 0;
  }
}

export default PlanAnalyticsManager;
