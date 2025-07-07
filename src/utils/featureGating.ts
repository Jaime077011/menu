import { type PrismaClient } from "@prisma/client";
import { db } from "@/server/db";

export interface FeatureFlags {
  basicAI: boolean;
  qrOrdering: boolean;
  basicAnalytics: boolean;
  emailSupport: boolean;
  customPersonality: boolean;
  advancedAnalytics: boolean;
  phoneSupport: boolean;
  customBranding: boolean;
  multiLocation: boolean;
  staffManagement: boolean;
  advancedReporting: boolean;
  webhooks: boolean;
  apiAccess: boolean;
  integrations: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
  customDevelopment: boolean;
  slaGuarantee: boolean;
  dataExport: boolean;
}

export interface SubscriptionLimits {
  maxLocations: number; // -1 for unlimited
  maxMenuItems: number; // -1 for unlimited
  maxAdminUsers: number; // -1 for unlimited
  maxApiCalls: number; // -1 for unlimited
}

export class FeatureGate {
  private static prisma: PrismaClient = db;

  /**
   * Check if a restaurant has access to a specific feature
   */
  static async checkFeature(
    restaurantId: string,
    featureName: keyof FeatureFlags
  ): Promise<boolean> {
    try {
      // Get restaurant's subscription
      const subscription = await this.getRestaurantSubscription(restaurantId);
      
      if (!subscription) {
        // No subscription - only basic trial features
        return this.getTrialFeatures()[featureName] ?? false;
      }

      // Parse feature flags from subscription plan
      const features = this.parseFeatures(subscription.plan.features);
      return features[featureName] ?? false;
    } catch (error) {
      console.error(`Error checking feature ${featureName} for restaurant ${restaurantId}:`, error);
      return false;
    }
  }

  /**
   * Check multiple features at once
   */
  static async checkFeatures(
    restaurantId: string,
    featureNames: Array<keyof FeatureFlags>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const featureName of featureNames) {
      results[featureName] = await this.checkFeature(restaurantId, featureName);
    }
    
    return results;
  }

  /**
   * Get all available features for a restaurant
   */
  static async getRestaurantFeatures(restaurantId: string): Promise<FeatureFlags> {
    try {
      const subscription = await this.getRestaurantSubscription(restaurantId);
      
      if (!subscription) {
        return this.getTrialFeatures();
      }

      return this.parseFeatures(subscription.plan.features);
    } catch (error) {
      console.error(`Error getting features for restaurant ${restaurantId}:`, error);
      return this.getTrialFeatures();
    }
  }

  /**
   * Enforce subscription limits (menu items, locations, etc.)
   */
  static async enforceLimit(
    restaurantId: string,
    limitType: 'MENU_ITEMS' | 'LOCATIONS' | 'ADMIN_USERS' | 'API_CALLS',
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    try {
      const limits = await this.getRestaurantLimits(restaurantId);
      const limit = this.getLimitValue(limits, limitType);
      
      // -1 means unlimited
      const allowed = limit === -1 || currentCount < limit;
      
      return {
        allowed,
        limit,
        current: currentCount
      };
    } catch (error) {
      console.error(`Error enforcing limit ${limitType} for restaurant ${restaurantId}:`, error);
      return { allowed: false, limit: 0, current: currentCount };
    }
  }

  /**
   * Check if restaurant can add more menu items
   */
  static async canAddMenuItem(restaurantId: string): Promise<boolean> {
    const currentCount = await this.prisma.menuItem.count({
      where: { restaurantId }
    });
    
    const result = await this.enforceLimit(restaurantId, 'MENU_ITEMS', currentCount);
    return result.allowed;
  }

  /**
   * Check if restaurant can create more admin users
   */
  static async canAddAdminUser(restaurantId: string): Promise<boolean> {
    const currentCount = await this.prisma.adminUser.count({
      where: { restaurantId }
    });
    
    const result = await this.enforceLimit(restaurantId, 'ADMIN_USERS', currentCount);
    return result.allowed;
  }

  /**
   * Get subscription status and trial info
   */
  static async getSubscriptionStatus(restaurantId: string) {
    const subscription = await this.getRestaurantSubscription(restaurantId);
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { subscriptionStatus: true, trialEndsAt: true }
    });

    if (!subscription || !restaurant) {
      return null;
    }

    const now = new Date();
    const isTrialActive = restaurant.subscriptionStatus === 'TRIAL' && 
                         restaurant.trialEndsAt && 
                         restaurant.trialEndsAt > now;

    return {
      status: subscription.status,
      planName: subscription.plan.displayName,
      planPrice: subscription.plan.price,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      isTrialActive,
      daysLeftInTrial: isTrialActive && restaurant.trialEndsAt ? 
        Math.ceil((restaurant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    };
  }

  /**
   * Track usage metrics
   */
  static async trackUsage(
    restaurantId: string,
    metricType: 'ORDERS' | 'MENU_ITEMS' | 'API_CALLS' | 'STORAGE_MB' | 'ADMIN_USERS',
    value: number = 1
  ): Promise<void> {
    try {
      const period = this.getCurrentPeriod();
      
      await this.prisma.usageMetric.upsert({
        where: {
          restaurantId_metricType_period: {
            restaurantId,
            metricType,
            period
          }
        },
        update: {
          value: {
            increment: value
          }
        },
        create: {
          restaurantId,
          metricType,
          value,
          period
        }
      });
    } catch (error) {
      console.error(`Error tracking usage for restaurant ${restaurantId}:`, error);
    }
  }

  /**
   * Get usage metrics for a restaurant
   */
  static async getUsageMetrics(restaurantId: string, months: number = 3) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await this.prisma.usageMetric.findMany({
      where: {
        restaurantId,
        period: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: [
        { period: 'desc' },
        { metricType: 'asc' }
      ]
    });
  }

  // Private helper methods

  private static async getRestaurantSubscription(restaurantId: string) {
    return await this.prisma.restaurantSubscription.findUnique({
      where: { restaurantId },
      include: {
        plan: true
      }
    });
  }

  private static async getRestaurantLimits(restaurantId: string): Promise<SubscriptionLimits> {
    const subscription = await this.getRestaurantSubscription(restaurantId);
    
    if (!subscription) {
      return this.getTrialLimits();
    }

    return {
      maxLocations: subscription.plan.maxLocations,
      maxMenuItems: subscription.plan.maxMenuItems,
      maxAdminUsers: 5, // Default limit for admin users
      maxApiCalls: -1 // Unlimited for now
    };
  }

  private static getLimitValue(limits: SubscriptionLimits, limitType: string): number {
    switch (limitType) {
      case 'MENU_ITEMS':
        return limits.maxMenuItems;
      case 'LOCATIONS':
        return limits.maxLocations;
      case 'ADMIN_USERS':
        return limits.maxAdminUsers;
      case 'API_CALLS':
        return limits.maxApiCalls;
      default:
        return 0;
    }
  }

  private static parseFeatures(featuresJson: string | null): FeatureFlags {
    if (!featuresJson) {
      return this.getTrialFeatures();
    }

    try {
      return JSON.parse(featuresJson) as FeatureFlags;
    } catch (error) {
      console.error('Error parsing feature flags:', error);
      return this.getTrialFeatures();
    }
  }

  private static getTrialFeatures(): FeatureFlags {
    return {
      basicAI: true,
      qrOrdering: true,
      basicAnalytics: true,
      emailSupport: true,
      customPersonality: false,
      advancedAnalytics: false,
      phoneSupport: false,
      customBranding: false,
      multiLocation: false,
      staffManagement: false,
      advancedReporting: false,
      webhooks: false,
      apiAccess: false,
      integrations: false,
      whiteLabel: false,
      prioritySupport: false,
      dedicatedManager: false,
      customDevelopment: false,
      slaGuarantee: false,
      dataExport: false
    };
  }

  private static getTrialLimits(): SubscriptionLimits {
    return {
      maxLocations: 1,
      maxMenuItems: 50,
      maxAdminUsers: 2,
      maxApiCalls: 1000
    };
  }

  private static getCurrentPeriod(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  }
}

// Utility functions for easy feature checking
export const hasFeature = (restaurantId: string, feature: keyof FeatureFlags) => 
  FeatureGate.checkFeature(restaurantId, feature);

export const canAddMenuItem = (restaurantId: string) => 
  FeatureGate.canAddMenuItem(restaurantId);

export const canAddAdminUser = (restaurantId: string) => 
  FeatureGate.canAddAdminUser(restaurantId);

export const trackUsage = (
  restaurantId: string, 
  metric: 'ORDERS' | 'MENU_ITEMS' | 'API_CALLS' | 'STORAGE_MB' | 'ADMIN_USERS',
  value?: number
) => FeatureGate.trackUsage(restaurantId, metric, value);

export const getSubscriptionStatus = (restaurantId: string) => 
  FeatureGate.getSubscriptionStatus(restaurantId);

export const getUsageMetrics = (restaurantId: string, months?: number) => 
  FeatureGate.getUsageMetrics(restaurantId, months); 