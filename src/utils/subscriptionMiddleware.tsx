import { type NextApiRequest, type NextApiResponse } from "next";
import { FeatureGate } from "./featureGating";
import { getAdminSessionFromCookies } from "./auth";

export interface SubscriptionMiddlewareOptions {
  requiredFeature?: keyof import("./featureGating").FeatureFlags;
  requiredPlan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  limitCheck?: {
    type: "MENU_ITEMS" | "ADMIN_USERS" | "API_CALLS";
    action: "ADD" | "CHECK";
  };
}

/**
 * Middleware to check subscription features and limits
 */
export function withSubscriptionCheck(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: SubscriptionMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get session and restaurant ID
      const cookies = req.headers.cookie || "";
      const session = getAdminSessionFromCookies(cookies);
      
      if (!session?.restaurantId) {
        return res.status(401).json({ 
          error: "Unauthorized",
          code: "NO_SESSION"
        });
      }

      const restaurantId = session.restaurantId;

      // Check required feature
      if (options.requiredFeature) {
        const hasFeature = await FeatureGate.checkFeature(restaurantId, options.requiredFeature);
        
        if (!hasFeature) {
          return res.status(403).json({
            error: "Feature not available in your current plan",
            code: "FEATURE_NOT_AVAILABLE",
            feature: options.requiredFeature,
            upgradeRequired: true
          });
        }
      }

      // Check required plan level
      if (options.requiredPlan) {
        const subscriptionStatus = await FeatureGate.getSubscriptionStatus(restaurantId);
        
        if (!subscriptionStatus) {
          return res.status(403).json({
            error: "Active subscription required",
            code: "NO_SUBSCRIPTION",
            upgradeRequired: true
          });
        }

        const planHierarchy = { "STARTER": 1, "PROFESSIONAL": 2, "ENTERPRISE": 3 };
        const currentPlanLevel = planHierarchy[subscriptionStatus.planName as keyof typeof planHierarchy] || 0;
        const requiredPlanLevel = planHierarchy[options.requiredPlan];

        if (currentPlanLevel < requiredPlanLevel) {
          return res.status(403).json({
            error: `${options.requiredPlan} plan or higher required`,
            code: "PLAN_UPGRADE_REQUIRED",
            currentPlan: subscriptionStatus.planName,
            requiredPlan: options.requiredPlan,
            upgradeRequired: true
          });
        }
      }

      // Check limits
      if (options.limitCheck) {
        let currentCount = 0;
        
        switch (options.limitCheck.type) {
          case "MENU_ITEMS":
            if (options.limitCheck.action === "ADD") {
              const canAdd = await FeatureGate.canAddMenuItem(restaurantId);
              if (!canAdd) {
                return res.status(403).json({
                  error: "Menu item limit reached for your current plan",
                  code: "MENU_ITEM_LIMIT_REACHED",
                  upgradeRequired: true
                });
              }
            }
            break;

          case "ADMIN_USERS":
            if (options.limitCheck.action === "ADD") {
              const canAdd = await FeatureGate.canAddAdminUser(restaurantId);
              if (!canAdd) {
                return res.status(403).json({
                  error: "Admin user limit reached for your current plan",
                  code: "ADMIN_USER_LIMIT_REACHED",
                  upgradeRequired: true
                });
              }
            }
            break;

          case "API_CALLS":
            // Track API call usage
            await FeatureGate.trackUsage(restaurantId, "API_CALLS", 1);
            break;
        }
      }

      // If all checks pass, proceed to the handler
      return await handler(req, res);

    } catch (error) {
      console.error("Subscription middleware error:", error);
      return res.status(500).json({
        error: "Internal server error",
        code: "MIDDLEWARE_ERROR"
      });
    }
  };
}

/**
 * React hook to check subscription features on the client side
 */
export function useSubscriptionFeatures() {
  // This would typically use tRPC or React Query to fetch subscription data
  // For now, we'll create a simple hook structure
  
  return {
    hasFeature: (feature: keyof import("./featureGating").FeatureFlags) => {
      // This would make an API call to check the feature
      // For now, return true as a placeholder
      return true;
    },
    
    canAddMenuItem: () => {
      // Check if restaurant can add more menu items
      return true;
    },
    
    canAddAdminUser: () => {
      // Check if restaurant can add more admin users
      return true;
    },
    
    getUsageLimits: () => {
      // Get current usage and limits
      return {
        menuItems: { current: 0, limit: -1 },
        adminUsers: { current: 0, limit: -1 },
        apiCalls: { current: 0, limit: -1 }
      };
    }
  };
}

/**
 * Higher-order component to wrap components with subscription checks
 */
export function withSubscriptionFeature<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  requiredFeature: keyof import("./featureGating").FeatureFlags,
  fallback?: React.ComponentType<T>
) {
  return function SubscriptionGatedComponent(props: T) {
    const { hasFeature } = useSubscriptionFeatures();
    
    if (!hasFeature(requiredFeature)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Feature Not Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This feature requires a higher subscription plan. 
                  <a href="/admin/subscription" className="font-medium underline">
                    Upgrade your plan
                  </a> to access this feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

/**
 * Utility function to check if a restaurant is on trial
 */
export async function isRestaurantOnTrial(restaurantId: string): Promise<boolean> {
  const status = await FeatureGate.getSubscriptionStatus(restaurantId);
  return status?.isTrialActive ?? false;
}

/**
 * Utility function to get days remaining in trial
 */
export async function getTrialDaysRemaining(restaurantId: string): Promise<number> {
  const status = await FeatureGate.getSubscriptionStatus(restaurantId);
  return status?.daysLeftInTrial ?? 0;
}

/**
 * Utility function to check if subscription is past due
 */
export async function isSubscriptionPastDue(restaurantId: string): Promise<boolean> {
  const status = await FeatureGate.getSubscriptionStatus(restaurantId);
  return status?.status === "PAST_DUE";
}

/**
 * Utility function to get subscription upgrade URL
 */
export function getUpgradeUrl(currentPlan?: string): string {
  return `/admin/subscription${currentPlan ? `?from=${currentPlan}` : ""}`;
}

/**
 * Error codes for subscription-related errors
 */
export const SUBSCRIPTION_ERROR_CODES = {
  NO_SESSION: "NO_SESSION",
  NO_SUBSCRIPTION: "NO_SUBSCRIPTION",
  FEATURE_NOT_AVAILABLE: "FEATURE_NOT_AVAILABLE",
  PLAN_UPGRADE_REQUIRED: "PLAN_UPGRADE_REQUIRED",
  MENU_ITEM_LIMIT_REACHED: "MENU_ITEM_LIMIT_REACHED",
  ADMIN_USER_LIMIT_REACHED: "ADMIN_USER_LIMIT_REACHED",
  API_LIMIT_REACHED: "API_LIMIT_REACHED",
  TRIAL_EXPIRED: "TRIAL_EXPIRED",
  SUBSCRIPTION_PAST_DUE: "SUBSCRIPTION_PAST_DUE",
  MIDDLEWARE_ERROR: "MIDDLEWARE_ERROR"
} as const;

export type SubscriptionErrorCode = typeof SUBSCRIPTION_ERROR_CODES[keyof typeof SUBSCRIPTION_ERROR_CODES]; 