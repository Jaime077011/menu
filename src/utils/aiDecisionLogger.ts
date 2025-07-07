/**
 * AI Decision Logger
 * Logs AI decisions and performance metrics for analytics
 */

import { db } from "@/server/db";
import { aiPerformanceMonitor } from "./aiPerformanceMetrics";

interface AIDecisionLog {
  sessionId?: string;
  restaurantId?: string;
  functionName?: string;
  confidence?: number;
  success: boolean;
  responseTime?: number;
  fallbackUsed?: boolean;
  errorMessage?: string;
  inputMessage?: string;
  outputAction?: string;
  metadata?: Record<string, any>;
}

class AIDecisionLogger {
  private logQueue: AIDecisionLog[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private isProcessing = false;

  constructor() {
    // Start periodic flush
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Log an AI decision
   */
  async logDecision(decision: AIDecisionLog): Promise<void> {
    try {
      // Add to queue
      this.logQueue.push({
        ...decision,
        // Ensure we have timestamps and basic validation
        metadata: {
          ...decision.metadata,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });

      // Update performance monitor
      aiPerformanceMonitor.recordDecision({
        confidence: decision.confidence || 0,
        responseTime: decision.responseTime || 0,
        success: decision.success,
        fallbackUsed: decision.fallbackUsed || false
      });

      // Flush if queue is full
      if (this.logQueue.length >= this.batchSize) {
        await this.flushLogs();
      }

    } catch (error) {
      console.error("❌ Failed to log AI decision:", error);
      // Don't throw - logging should not break the main flow
    }
  }

  /**
   * Log successful AI decision
   */
  async logSuccess(params: {
    sessionId?: string;
    restaurantId?: string;
    functionName?: string;
    confidence?: number;
    responseTime?: number;
    inputMessage?: string;
    outputAction?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logDecision({
      ...params,
      success: true,
      fallbackUsed: false
    });
  }

  /**
   * Log AI decision failure
   */
  async logFailure(params: {
    sessionId?: string;
    restaurantId?: string;
    functionName?: string;
    confidence?: number;
    responseTime?: number;
    errorMessage?: string;
    inputMessage?: string;
    fallbackUsed?: boolean;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logDecision({
      ...params,
      success: false,
      fallbackUsed: params.fallbackUsed || false
    });
  }

  /**
   * Log fallback usage
   */
  async logFallback(params: {
    sessionId?: string;
    restaurantId?: string;
    originalFunction?: string;
    fallbackFunction?: string;
    confidence?: number;
    responseTime?: number;
    inputMessage?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.logDecision({
      sessionId: params.sessionId,
      restaurantId: params.restaurantId,
      functionName: params.fallbackFunction || 'fallback',
      confidence: params.confidence,
      responseTime: params.responseTime,
      success: true,
      fallbackUsed: true,
      inputMessage: params.inputMessage,
      metadata: {
        ...params.metadata,
        originalFunction: params.originalFunction,
        fallbackReason: params.reason
      }
    });
  }

  /**
   * Flush queued logs to database
   */
  private async flushLogs(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const logsToProcess = [...this.logQueue];
    this.logQueue = [];

    try {
      // In a real implementation, we would save to database
      // For now, we'll just log to console for demonstration
      console.log(`📊 AI Decision Logger: Flushing ${logsToProcess.length} decisions`);
      
      // Mock database save - in production this would be:
      // await db.aIDecisionLog.createMany({ data: logsToProcess });
      
      // For demonstration, let's show some statistics
      const successCount = logsToProcess.filter(d => d.success).length;
      const fallbackCount = logsToProcess.filter(d => d.fallbackUsed).length;
      const avgConfidence = logsToProcess.reduce((sum, d) => sum + (d.confidence || 0), 0) / logsToProcess.length;
      const avgResponseTime = logsToProcess.reduce((sum, d) => sum + (d.responseTime || 0), 0) / logsToProcess.length;

      console.log(`📈 Batch Stats: ${successCount}/${logsToProcess.length} success, ${fallbackCount} fallbacks, ${(avgConfidence * 100).toFixed(1)}% avg confidence, ${avgResponseTime.toFixed(0)}ms avg response`);

    } catch (error) {
      console.error("❌ Failed to flush AI decision logs:", error);
      // Put logs back in queue for retry
      this.logQueue.unshift(...logsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get recent performance statistics
   */
  getRecentStats(): {
    totalDecisions: number;
    successRate: number;
    fallbackRate: number;
    averageConfidence: number;
    averageResponseTime: number;
  } {
    return aiPerformanceMonitor.getPerformanceReport();
  }

  /**
   * Force flush all pending logs
   */
  async forceFlush(): Promise<void> {
    await this.flushLogs();
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueSize: number;
    isProcessing: boolean;
    batchSize: number;
  } {
    return {
      queueSize: this.logQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize
    };
  }
}

// Export singleton instance
export const aiDecisionLogger = new AIDecisionLogger();

// Export types
export type { AIDecisionLog };

/**
 * Helper function to create decision logger with context
 */
export function createContextualLogger(context: {
  sessionId?: string;
  restaurantId?: string;
}) {
  return {
    logSuccess: (params: Omit<Parameters<typeof aiDecisionLogger.logSuccess>[0], 'sessionId' | 'restaurantId'>) =>
      aiDecisionLogger.logSuccess({ ...params, ...context }),
    
    logFailure: (params: Omit<Parameters<typeof aiDecisionLogger.logFailure>[0], 'sessionId' | 'restaurantId'>) =>
      aiDecisionLogger.logFailure({ ...params, ...context }),
    
    logFallback: (params: Omit<Parameters<typeof aiDecisionLogger.logFallback>[0], 'sessionId' | 'restaurantId'>) =>
      aiDecisionLogger.logFallback({ ...params, ...context })
  };
} 