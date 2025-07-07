/**
 * Super Admin Subscription Management Types
 * 
 * Extended types and interfaces for comprehensive subscription management
 * in the super admin dashboard.
 */

import { z } from "zod";
import type { Restaurant, RestaurantAdmin, SubscriptionPlan } from "@prisma/client";

// ===== EXTENDED SUBSCRIPTION PLAN TYPES =====

export interface SubscriptionPlanAdmin extends SubscriptionPlan {
  totalRestaurants: number;
  monthlyRevenue: number;
  annualRevenue: number;
  conversionRate: number;
  churnRate: number;
  averageLifetimeValue: number;
  activeTrials: number;
  trialConversions: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SubscriptionPlanMetrics {
  planId: string;
  planName: string;
  totalSubscribers: number;
  activeSubscribers: number;
  trialSubscribers: number;
  monthlyRevenue: number;
  annualRevenue: number;
  conversionRate: number;
  churnRate: number;
  averageLifetimeValue: number;
  growthRate: number;
  retentionRate: number;
}

// ===== RESTAURANT SUBSCRIPTION MANAGEMENT =====

export interface RestaurantSubscriptionAdmin {
  id: string;
  restaurant: Restaurant & {
    admins: RestaurantAdmin[];
  };
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "UNPAID";
  currentPlan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  nextBillingDate?: Date;
  billingCycle: "MONTHLY" | "ANNUAL";
  usageMetrics: RestaurantUsageMetrics;
  paymentHistory: PaymentRecord[];
  lifetimeValue: number;
  monthsActive: number;
  lastPaymentDate?: Date;
  paymentMethod?: PaymentMethodInfo;
  isAtRisk: boolean;
  supportTickets: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantUsageMetrics {
  restaurantId: string;
  period: "CURRENT_MONTH" | "LAST_MONTH" | "CURRENT_YEAR";
  menuItemsCount: number;
  menuItemsLimit: number;
  adminsCount: number;
  adminsLimit: number;
  ordersCount: number;
  ordersLimit: number;
  aiChatSessions: number;
  aiChatLimit: number;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  apiCallsCount: number;
  apiCallsLimit: number;
  lastUpdated: Date;
}

export interface PaymentRecord {
  id: string;
  restaurantId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING" | "CANCELLED" | "REFUNDED";
  paymentMethod: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  invoiceUrl?: string;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface PaymentMethodInfo {
  type: "card" | "bank_account" | "paypal";
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// ===== ANALYTICS AND REPORTING =====

export interface SubscriptionAnalytics {
  overview: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    totalActiveSubscriptions: number;
    totalTrialSubscriptions: number;
    totalCancelledSubscriptions: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
    conversionRate: number;
    growthRate: number;
  };
  
  revenueBreakdown: {
    byPlan: Array<{
      planName: string;
      revenue: number;
      subscribers: number;
      percentage: number;
    }>;
    byMonth: Array<{
      month: string;
      revenue: number;
      newSubscriptions: number;
      cancellations: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
      revenue: number;
    }>;
  };
  
  conversionFunnel: {
    registrations: number;
    trialsStarted: number;
    trialsConverted: number;
    subscriptionsActive: number;
    subscriptionsCancelled: number;
    conversionRate: number;
    dropoffPoints: Array<{
      stage: string;
      dropoffRate: number;
      suggestions: string[];
    }>;
  };
  
  churnAnalysis: {
    overallChurnRate: number;
    churnByPlan: Array<{
      planName: string;
      churnRate: number;
      avgTimeToChurn: number;
    }>;
    churnReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
    atRiskCustomers: Array<{
      restaurantId: string;
      restaurantName: string;
      riskScore: number;
      riskFactors: string[];
    }>;
  };
  
  paymentAnalysis: {
    paymentSuccessRate: number;
    averagePaymentAmount: number;
    paymentFailureReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
    recoveryRate: number;
    dunningEffectiveness: number;
  };
}

export interface RevenueForecasting {
  projectedMRR: Array<{
    month: string;
    projected: number;
    confidence: number;
    factors: string[];
  }>;
  projectedARR: number;
  growthProjection: {
    conservative: number;
    realistic: number;
    optimistic: number;
  };
  seasonalityFactors: Array<{
    month: string;
    factor: number;
  }>;
}

// ===== BULK OPERATIONS =====

export interface BulkOperationRequest {
  operation: "UPGRADE" | "DOWNGRADE" | "CANCEL" | "EXTEND_TRIAL" | "REACTIVATE" | "CHANGE_BILLING";
  restaurantIds: string[];
  targetPlanId?: string;
  reason?: string;
  trialExtensionDays?: number;
  billingCycle?: "MONTHLY" | "ANNUAL";
  notifyCustomers: boolean;
  scheduledDate?: Date;
}

export interface BulkOperationResult {
  operationId: string;
  totalRequested: number;
  successful: number;
  failed: number;
  results: Array<{
    restaurantId: string;
    restaurantName: string;
    success: boolean;
    error?: string;
    newStatus?: string;
    newPlan?: string;
  }>;
  startedAt: Date;
  completedAt?: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

// ===== SEARCH AND FILTERING =====

export interface SubscriptionFilter {
  status?: Array<"TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "UNPAID">;
  planIds?: string[];
  billingCycle?: Array<"MONTHLY" | "ANNUAL">;
  paymentStatus?: Array<"CURRENT" | "OVERDUE" | "FAILED">;
  usageLevel?: Array<"LOW" | "MEDIUM" | "HIGH" | "OVER_LIMIT">;
  signupDateRange?: {
    from: Date;
    to: Date;
  };
  revenueRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
  isAtRisk?: boolean;
  hasPaymentIssues?: boolean;
  sortBy?: "name" | "revenue" | "signupDate" | "lastPayment" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SubscriptionSearchResult {
  subscriptions: RestaurantSubscriptionAdmin[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
  aggregations: {
    totalRevenue: number;
    averageRevenue: number;
    statusBreakdown: Record<string, number>;
    planBreakdown: Record<string, number>;
  };
}

// ===== VALIDATION SCHEMAS =====

export const CreatePlanSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  description: z.string().optional(),
  priceMonthly: z.number().min(0, "Price must be non-negative"),
  priceAnnual: z.number().min(0, "Price must be non-negative"),
  currency: z.string().default("USD"),
  features: z.object({
    menuItemsLimit: z.number().min(1, "Must allow at least 1 menu item"),
    adminsLimit: z.number().min(1, "Must allow at least 1 admin"),
    ordersLimit: z.number().min(-1, "Use -1 for unlimited"),
    aiChatLimit: z.number().min(-1, "Use -1 for unlimited"),
    storageLimit: z.number().min(1, "Must allow at least 1MB storage"),
    apiCallsLimit: z.number().min(-1, "Use -1 for unlimited"),
    customPersonality: z.boolean().default(false),
    advancedAnalytics: z.boolean().default(false),
    prioritySupport: z.boolean().default(false),
    whiteLabel: z.boolean().default(false),
    customDomain: z.boolean().default(false),
    apiAccess: z.boolean().default(false),
    webhooks: z.boolean().default(false),
    ssoIntegration: z.boolean().default(false),
  }),
  trialDays: z.number().min(0, "Trial days must be non-negative").default(14),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().min(0, "Display order must be non-negative").default(0),
});

export const UpdatePlanSchema = CreatePlanSchema.partial().extend({
  id: z.string().uuid("Invalid plan ID"),
});

export const BulkOperationSchema = z.object({
  operation: z.enum(["UPGRADE", "DOWNGRADE", "CANCEL", "EXTEND_TRIAL", "REACTIVATE", "CHANGE_BILLING"]),
  restaurantIds: z.array(z.string().uuid()).min(1, "At least one restaurant must be selected"),
  targetPlanId: z.string().uuid().optional(),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
  trialExtensionDays: z.number().min(1).max(90).optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional(),
  notifyCustomers: z.boolean().default(true),
  scheduledDate: z.date().optional(),
});

export const SubscriptionFilterSchema = z.object({
  status: z.array(z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "UNPAID"])).optional(),
  planIds: z.array(z.string().uuid()).optional(),
  billingCycle: z.array(z.enum(["MONTHLY", "ANNUAL"])).optional(),
  paymentStatus: z.array(z.enum(["CURRENT", "OVERDUE", "FAILED"])).optional(),
  usageLevel: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "OVER_LIMIT"])).optional(),
  signupDateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).optional(),
  revenueRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  searchTerm: z.string().max(100).optional(),
  isAtRisk: z.boolean().optional(),
  hasPaymentIssues: z.boolean().optional(),
  sortBy: z.enum(["name", "revenue", "signupDate", "lastPayment", "status"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ===== UTILITY TYPES =====

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>;
export type SubscriptionFilterInput = z.infer<typeof SubscriptionFilterSchema>;

// ===== CONSTANTS =====

export const SUBSCRIPTION_STATUSES = {
  TRIAL: { label: "Trial", color: "yellow", description: "Free trial period" },
  ACTIVE: { label: "Active", color: "green", description: "Paid and active" },
  PAST_DUE: { label: "Past Due", color: "orange", description: "Payment failed, grace period" },
  CANCELLED: { label: "Cancelled", color: "red", description: "Subscription cancelled" },
  UNPAID: { label: "Unpaid", color: "red", description: "Extended non-payment" },
} as const;

export const BILLING_CYCLES = {
  MONTHLY: { label: "Monthly", description: "Billed every month" },
  ANNUAL: { label: "Annual", description: "Billed every year" },
} as const;

export const USAGE_LEVELS = {
  LOW: { label: "Low", color: "green", threshold: 0.25 },
  MEDIUM: { label: "Medium", color: "yellow", threshold: 0.75 },
  HIGH: { label: "High", color: "orange", threshold: 0.95 },
  OVER_LIMIT: { label: "Over Limit", color: "red", threshold: 1.0 },
} as const;

export const RISK_FACTORS = {
  PAYMENT_FAILED: "Recent payment failure",
  HIGH_USAGE: "Usage approaching limits",
  SUPPORT_TICKETS: "Multiple support tickets",
  LOW_ENGAGEMENT: "Low platform engagement",
  TRIAL_ENDING: "Trial ending soon",
  COMPETITOR_ACTIVITY: "Competitor activity detected",
} as const; 