/**
 * AI Performance Metrics and Monitoring
 * Tracks AI system performance, accuracy, and reliability
 */

export interface AIPerformanceMetrics {
  // Response Time Metrics
  executionTime: number;
  aiResponseTime?: number;
  fallbackTime?: number;
  
  // Accuracy Metrics
  confidence: number;
  actionDetected: boolean;
  fallbackUsed: boolean;
  
  // Context Metrics
  contextSize: number;
  menuItemsCount: number;
  conversationLength: number;
  
  // Error Tracking
  errors: string[];
  warnings: string[];
  
  // System Metrics
  timestamp: Date;
  sessionId?: string;
  restaurantId: string;
  tableNumber: number;
}

export interface AIAccuracyReport {
  totalRequests: number;
  successfulAIDetections: number;
  fallbackUsed: number;
  averageConfidence: number;
  averageResponseTime: number;
  errorRate: number;
  
  // Categorized Performance
  orderDetectionAccuracy: number;
  conversationHandlingAccuracy: number;
  menuItemValidationAccuracy: number;
  
  // Time-based Analysis
  performanceByHour: Record<string, AIPerformanceMetrics[]>;
  performanceByDay: Record<string, AIPerformanceMetrics[]>;
}

class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor;
  private metrics: AIPerformanceMetrics[] = [];
  private readonly MAX_METRICS_STORAGE = 1000; // Keep last 1000 requests

  private constructor() {}

  public static getInstance(): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor();
    }
    return AIPerformanceMonitor.instance;
  }

  /**
   * Record AI performance metrics
   */
  public recordMetrics(metrics: AIPerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep storage manageable
    if (this.metrics.length > this.MAX_METRICS_STORAGE) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_STORAGE);
    }

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      this.logPerformanceMetrics(metrics);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
  }

  /**
   * Generate comprehensive accuracy report
   */
  public generateAccuracyReport(timeWindow?: number): AIAccuracyReport {
    const relevantMetrics = timeWindow 
      ? this.getMetricsInTimeWindow(timeWindow)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return this.getEmptyReport();
    }

    const totalRequests = relevantMetrics.length;
    const successfulAI = relevantMetrics.filter(m => !m.fallbackUsed).length;
    const fallbackUsed = relevantMetrics.filter(m => m.fallbackUsed).length;
    
    const averageConfidence = relevantMetrics.reduce((sum, m) => sum + m.confidence, 0) / totalRequests;
    const averageResponseTime = relevantMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalRequests;
    const errorRate = relevantMetrics.filter(m => m.errors.length > 0).length / totalRequests;

    return {
      totalRequests,
      successfulAIDetections: successfulAI,
      fallbackUsed,
      averageConfidence,
      averageResponseTime,
      errorRate,
      orderDetectionAccuracy: this.calculateOrderDetectionAccuracy(relevantMetrics),
      conversationHandlingAccuracy: this.calculateConversationAccuracy(relevantMetrics),
      menuItemValidationAccuracy: this.calculateMenuValidationAccuracy(relevantMetrics),
      performanceByHour: this.groupMetricsByHour(relevantMetrics),
      performanceByDay: this.groupMetricsByDay(relevantMetrics)
    };
  }

  /**
   * Get real-time performance status
   */
  public getPerformanceStatus(): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    metrics: {
      avgResponseTime: number;
      aiSuccessRate: number;
      avgConfidence: number;
      errorRate: number;
    };
    recommendations: string[];
  } {
    const recentMetrics = this.getMetricsInTimeWindow(300000); // Last 5 minutes
    
    if (recentMetrics.length === 0) {
      return {
        status: 'good',
        metrics: { avgResponseTime: 0, aiSuccessRate: 100, avgConfidence: 1, errorRate: 0 },
        recommendations: ['No recent activity to analyze']
      };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
    const aiSuccessRate = (recentMetrics.filter(m => !m.fallbackUsed).length / recentMetrics.length) * 100;
    const avgConfidence = recentMetrics.reduce((sum, m) => sum + m.confidence, 0) / recentMetrics.length;
    const errorRate = (recentMetrics.filter(m => m.errors.length > 0).length / recentMetrics.length) * 100;

    const status = this.determineOverallStatus(avgResponseTime, aiSuccessRate, avgConfidence, errorRate);
    const recommendations = this.generateRecommendations(avgResponseTime, aiSuccessRate, avgConfidence, errorRate);

    return {
      status,
      metrics: { avgResponseTime, aiSuccessRate, avgConfidence, errorRate },
      recommendations
    };
  }

  /**
   * Export metrics for external analysis
   */
  public exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportAsCSV();
    }
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Clear stored metrics (useful for testing)
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Private helper methods

  private logPerformanceMetrics(metrics: AIPerformanceMetrics): void {
    const emoji = metrics.fallbackUsed ? '⚠️' : '🤖';
    const status = metrics.fallbackUsed ? 'FALLBACK' : 'AI';
    
    console.log(`${emoji} AI Performance [${status}]:`, {
      confidence: metrics.confidence.toFixed(2),
      executionTime: `${metrics.executionTime}ms`,
      contextSize: metrics.contextSize,
      errors: metrics.errors.length,
      warnings: metrics.warnings.length
    });

    if (metrics.errors.length > 0) {
      console.error('🚨 AI Errors:', metrics.errors);
    }

    if (metrics.warnings.length > 0) {
      console.warn('⚠️ AI Warnings:', metrics.warnings);
    }
  }

  private checkPerformanceThresholds(metrics: AIPerformanceMetrics): void {
    const warnings: string[] = [];

    // Response time threshold
    if (metrics.executionTime > 5000) {
      warnings.push(`Slow response time: ${metrics.executionTime}ms`);
    }

    // Confidence threshold
    if (metrics.confidence < 0.5 && !metrics.fallbackUsed) {
      warnings.push(`Low AI confidence: ${metrics.confidence}`);
    }

    // Frequent fallback usage
    const recentFallbacks = this.getMetricsInTimeWindow(60000) // Last minute
      .filter(m => m.fallbackUsed).length;
    
    if (recentFallbacks > 5) {
      warnings.push(`High fallback usage: ${recentFallbacks} in last minute`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Performance Warnings:', warnings);
    }
  }

  private getMetricsInTimeWindow(windowMs: number): AIPerformanceMetrics[] {
    const cutoff = new Date(Date.now() - windowMs);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  private calculateOrderDetectionAccuracy(metrics: AIPerformanceMetrics[]): number {
    const orderMetrics = metrics.filter(m => m.actionDetected);
    if (orderMetrics.length === 0) return 100;
    
    const successful = orderMetrics.filter(m => !m.fallbackUsed && m.errors.length === 0);
    return (successful.length / orderMetrics.length) * 100;
  }

  private calculateConversationAccuracy(metrics: AIPerformanceMetrics[]): number {
    const conversationMetrics = metrics.filter(m => !m.actionDetected);
    if (conversationMetrics.length === 0) return 100;
    
    const successful = conversationMetrics.filter(m => m.confidence > 0.7 && m.errors.length === 0);
    return (successful.length / conversationMetrics.length) * 100;
  }

  private calculateMenuValidationAccuracy(metrics: AIPerformanceMetrics[]): number {
    const validationErrors = metrics.filter(m => 
      m.errors.some(error => error.includes('menu') || error.includes('validation'))
    );
    
    return ((metrics.length - validationErrors.length) / metrics.length) * 100;
  }

  private groupMetricsByHour(metrics: AIPerformanceMetrics[]): Record<string, AIPerformanceMetrics[]> {
    return metrics.reduce((groups, metric) => {
      const hour = metric.timestamp.getHours().toString().padStart(2, '0');
      if (!groups[hour]) groups[hour] = [];
      groups[hour].push(metric);
      return groups;
    }, {} as Record<string, AIPerformanceMetrics[]>);
  }

  private groupMetricsByDay(metrics: AIPerformanceMetrics[]): Record<string, AIPerformanceMetrics[]> {
    return metrics.reduce((groups, metric) => {
      const day = metric.timestamp.toISOString().split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(metric);
      return groups;
    }, {} as Record<string, AIPerformanceMetrics[]>);
  }

  private determineOverallStatus(
    avgResponseTime: number, 
    aiSuccessRate: number, 
    avgConfidence: number, 
    errorRate: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (avgResponseTime < 2000 && aiSuccessRate > 90 && avgConfidence > 0.8 && errorRate < 5) {
      return 'excellent';
    }
    if (avgResponseTime < 3000 && aiSuccessRate > 80 && avgConfidence > 0.7 && errorRate < 10) {
      return 'good';
    }
    if (avgResponseTime < 5000 && aiSuccessRate > 70 && avgConfidence > 0.6 && errorRate < 20) {
      return 'fair';
    }
    return 'poor';
  }

  private generateRecommendations(
    avgResponseTime: number, 
    aiSuccessRate: number, 
    avgConfidence: number, 
    errorRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (avgResponseTime > 3000) {
      recommendations.push('Consider optimizing AI context size or switching to faster model');
    }

    if (aiSuccessRate < 80) {
      recommendations.push('High fallback usage detected - check OpenAI API status and prompts');
    }

    if (avgConfidence < 0.7) {
      recommendations.push('Low AI confidence - consider improving prompts or training data');
    }

    if (errorRate > 10) {
      recommendations.push('High error rate - review error logs and implement additional validation');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performing well - no immediate action required');
    }

    return recommendations;
  }

  private getEmptyReport(): AIAccuracyReport {
    return {
      totalRequests: 0,
      successfulAIDetections: 0,
      fallbackUsed: 0,
      averageConfidence: 0,
      averageResponseTime: 0,
      errorRate: 0,
      orderDetectionAccuracy: 0,
      conversationHandlingAccuracy: 0,
      menuItemValidationAccuracy: 0,
      performanceByHour: {},
      performanceByDay: {}
    };
  }

  private exportAsCSV(): string {
    if (this.metrics.length === 0) return 'No data available';

    const headers = [
      'timestamp', 'executionTime', 'confidence', 'actionDetected', 'fallbackUsed',
      'contextSize', 'menuItemsCount', 'conversationLength', 'errors', 'warnings',
      'sessionId', 'restaurantId', 'tableNumber'
    ];

    const rows = this.metrics.map(m => [
      m.timestamp.toISOString(),
      m.executionTime.toString(),
      m.confidence.toString(),
      m.actionDetected.toString(),
      m.fallbackUsed.toString(),
      m.contextSize.toString(),
      m.menuItemsCount.toString(),
      m.conversationLength.toString(),
      m.errors.length.toString(),
      m.warnings.length.toString(),
      m.sessionId || '',
      m.restaurantId,
      m.tableNumber.toString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Export singleton instance
export const aiPerformanceMonitor = AIPerformanceMonitor.getInstance();

// Utility functions for easy metric recording
export function recordAIMetrics(
  executionTime: number,
  confidence: number,
  actionDetected: boolean,
  fallbackUsed: boolean,
  context: { 
    contextSize: number;
    menuItemsCount: number;
    conversationLength: number;
    restaurantId: string;
    tableNumber: number;
    sessionId?: string;
  },
  errors: string[] = [],
  warnings: string[] = []
): void {
  const metrics: AIPerformanceMetrics = {
    executionTime,
    confidence,
    actionDetected,
    fallbackUsed,
    contextSize: context.contextSize,
    menuItemsCount: context.menuItemsCount,
    conversationLength: context.conversationLength,
    errors,
    warnings,
    timestamp: new Date(),
    sessionId: context.sessionId,
    restaurantId: context.restaurantId,
    tableNumber: context.tableNumber
  };

  aiPerformanceMonitor.recordMetrics(metrics);
}

export function getAIPerformanceStatus() {
  return aiPerformanceMonitor.getPerformanceStatus();
}

export function generateAIAccuracyReport(timeWindowMs?: number) {
  return aiPerformanceMonitor.generateAccuracyReport(timeWindowMs);
} 