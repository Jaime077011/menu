/**
 * AI Analytics tRPC Router
 * Provides endpoints for AI performance monitoring and analytics
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { aiPerformanceMonitor } from "@/utils/aiPerformanceMetrics";
import { conversationMemoryManager } from "@/utils/conversationMemory";
import { requireViewAnalytics } from "@/utils/superAdminAuth";

// Input schemas
const timeRangeSchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  restaurantId: z.string().optional()
});

const sessionAnalyticsSchema = z.object({
  sessionId: z.string(),
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h')
});

export const aiAnalyticsRouter = createTRPCRouter({
  
  /**
   * Get comprehensive AI performance metrics
   */
  getAIPerformanceMetrics: publicProcedure
    .input(timeRangeSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now - in production this would query actual metrics
        return {
          totalDecisions: 1247,
          successRate: 0.87,
          averageConfidence: 0.82,
          averageResponseTime: 1450,
          fallbackRate: 0.08,
          memoryUtilization: 0.65,
          activeConversations: 23,
          dailyInteractions: 156
        };
        
      } catch (error) {
        console.error("❌ Failed to get AI performance metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve AI performance metrics"
        });
      }
    }),

  /**
   * Get confidence score distribution
   */
  getConfidenceDistribution: publicProcedure
    .input(timeRangeSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now
        return [
          { range: '0.9-1.0', count: 450, percentage: 36 },
          { range: '0.8-0.9', count: 380, percentage: 30 },
          { range: '0.7-0.8', count: 280, percentage: 22 },
          { range: '0.6-0.7', count: 100, percentage: 8 },
          { range: '0.0-0.6', count: 37, percentage: 4 }
        ];
        
      } catch (error) {
        console.error("❌ Failed to get confidence distribution:", error);
        return [];
      }
    }),

  /**
   * Get AI function call statistics
   */
  getFunctionCallStats: publicProcedure
    .input(timeRangeSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now
        return [
          { functionName: 'place_order', count: 450, successRate: 0.92, averageConfidence: 0.85 },
          { functionName: 'request_recommendations', count: 320, successRate: 0.88, averageConfidence: 0.82 },
          { functionName: 'provide_information', count: 280, successRate: 0.95, averageConfidence: 0.89 },
          { functionName: 'modify_order', count: 120, successRate: 0.78, averageConfidence: 0.75 },
          { functionName: 'no_action_needed', count: 77, successRate: 0.96, averageConfidence: 0.91 }
        ];
        
      } catch (error) {
        console.error("❌ Failed to get function call stats:", error);
        return [];
      }
    }),

  /**
   * Get performance trends over time
   */
  getPerformanceTrends: publicProcedure
    .input(timeRangeSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now
        return [
          { timestamp: '12:00', confidence: 0.85, responseTime: 1200, successRate: 0.89 },
          { timestamp: '13:00', confidence: 0.82, responseTime: 1350, successRate: 0.87 },
          { timestamp: '14:00', confidence: 0.88, responseTime: 1100, successRate: 0.91 },
          { timestamp: '15:00', confidence: 0.84, responseTime: 1450, successRate: 0.88 },
          { timestamp: '16:00', confidence: 0.86, responseTime: 1320, successRate: 0.90 }
        ];
        
      } catch (error) {
        console.error("❌ Failed to get performance trends:", error);
        return [];
      }
    }),

  /**
   * Get conversation insights and analytics
   */
  getConversationInsights: publicProcedure
    .input(timeRangeSchema)
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now
        return {
          avgSessionLength: 8,
          satisfactionRate: 92,
          memoryUsage: 65,
          topTopics: [
            { topic: 'pizza', count: 145 },
            { topic: 'recommendations', count: 98 },
            { topic: 'vegetarian', count: 67 },
            { topic: 'spicy', count: 45 },
            { topic: 'dessert', count: 32 }
          ]
        };
        
      } catch (error) {
        console.error("❌ Failed to get conversation insights:", error);
        return {
          avgSessionLength: 0,
          satisfactionRate: 0,
          memoryUsage: 0,
          topTopics: []
        };
      }
    }),

  /**
   * Get real-time AI status
   */
  getAIStatus: publicProcedure
    .query(async ({ ctx }) => {
      const superAdmin = await requireViewAnalytics(ctx);
      
      try {
        // Mock data for now
        return {
          status: 'healthy',
          recentDecisions: 23,
          averageResponseTime: 1450,
          lastDecisionAt: new Date(),
          memoryStats: { 
            totalSessions: 45, 
            averageMessageCount: 8.2, 
            topTopics: [
              { topic: 'pizza', count: 12 },
              { topic: 'recommendations', count: 8 }
            ] 
          }
        };
        
      } catch (error) {
        console.error("❌ Failed to get AI status:", error);
        return {
          status: 'error',
          recentDecisions: 0,
          averageResponseTime: 0,
          lastDecisionAt: null,
          memoryStats: { totalSessions: 0, averageMessageCount: 0, topTopics: [] }
        };
      }
    })
});

export default aiAnalyticsRouter; 