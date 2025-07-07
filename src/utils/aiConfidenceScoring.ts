/**
 * Advanced AI Confidence Scoring System
 * Multi-factor confidence calculation for AI action detection
 */

import type { AIActionContext } from '@/types/aiActions';

export interface ConfidenceFactors {
  // Message clarity factors
  messageLength: number;
  keywordMatches: number;
  grammarQuality: number;
  intentClarity: number;
  
  // Context factors
  conversationFlow: number;
  sessionHistory: number;
  menuItemMatch: number;
  customerProfile: number;
  
  // AI response factors
  functionCallConsistency: number;
  parameterCompleteness: number;
  responseCoherence: number;
  
  // External factors
  timeOfDay: number;
  restaurantBusyness: number;
  previousAccuracy: number;
}

export interface ConfidenceMetrics {
  baseConfidence: number;
  adjustedConfidence: number;
  confidenceFactors: ConfidenceFactors;
  uncertaintyIndicators: string[];
  reliabilityScore: number;
  recommendedAction: 'proceed' | 'clarify' | 'fallback';
}

class AdvancedConfidenceScorer {
  private static instance: AdvancedConfidenceScorer;
  private accuracyHistory: Map<string, number[]> = new Map();
  private confidenceThresholds = {
    high: 0.8,
    medium: 0.6,
    low: 0.4
  };

  private constructor() {}

  public static getInstance(): AdvancedConfidenceScorer {
    if (!AdvancedConfidenceScorer.instance) {
      AdvancedConfidenceScorer.instance = new AdvancedConfidenceScorer();
    }
    return AdvancedConfidenceScorer.instance;
  }

  /**
   * Calculate comprehensive confidence score
   */
  calculateConfidence(
    userMessage: string,
    functionName: string,
    parameters: any,
    context: AIActionContext,
    aiResponseTime: number
  ): ConfidenceMetrics {
    // Calculate individual confidence factors
    const factors = this.calculateConfidenceFactors(
      userMessage,
      functionName,
      parameters,
      context,
      aiResponseTime
    );

    // Calculate base confidence from AI function call
    const baseConfidence = this.calculateBaseConfidence(functionName, parameters);

    // Apply multi-factor adjustments
    const adjustedConfidence = this.applyConfidenceAdjustments(baseConfidence, factors);

    // Detect uncertainty indicators
    const uncertaintyIndicators = this.detectUncertaintyIndicators(
      userMessage,
      functionName,
      parameters,
      factors
    );

    // Calculate reliability score
    const reliabilityScore = this.calculateReliabilityScore(factors, uncertaintyIndicators);

    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(
      adjustedConfidence,
      uncertaintyIndicators,
      reliabilityScore
    );

    return {
      baseConfidence,
      adjustedConfidence: Math.max(0, Math.min(1, adjustedConfidence)),
      confidenceFactors: factors,
      uncertaintyIndicators,
      reliabilityScore,
      recommendedAction
    };
  }

  /**
   * Update accuracy history for learning
   */
  updateAccuracyHistory(
    sessionId: string,
    predictedConfidence: number,
    actualSuccess: boolean
  ): void {
    const actualAccuracy = actualSuccess ? 1 : 0;
    
    if (!this.accuracyHistory.has(sessionId)) {
      this.accuracyHistory.set(sessionId, []);
    }
    
    const history = this.accuracyHistory.get(sessionId)!;
    history.push(actualAccuracy);
    
    // Keep only last 20 interactions
    if (history.length > 20) {
      history.shift();
    }
    
    console.log('📊 Updated accuracy history:', {
      sessionId,
      predictedConfidence,
      actualSuccess,
      averageAccuracy: history.reduce((sum, acc) => sum + acc, 0) / history.length
    });
  }

  /**
   * Get confidence threshold recommendations
   */
  getThresholdRecommendations(context: AIActionContext): {
    proceedThreshold: number;
    clarifyThreshold: number;
    fallbackThreshold: number;
  } {
    // Adjust thresholds based on context
    let proceedThreshold = this.confidenceThresholds.high;
    let clarifyThreshold = this.confidenceThresholds.medium;
    let fallbackThreshold = this.confidenceThresholds.low;

    // Lower thresholds for experienced customers
    if (context.customerSession && context.customerSession.totalOrders > 3) {
      proceedThreshold -= 0.1;
      clarifyThreshold -= 0.1;
    }

    // Raise thresholds for complex orders
    if (context.currentOrders && context.currentOrders.length > 0) {
      proceedThreshold += 0.1;
      clarifyThreshold += 0.1;
    }

    // Adjust for restaurant settings
    if (context.restaurantSettings?.upsellSettings?.aggressiveness === 'HIGH') {
      proceedThreshold += 0.05;
    }

    return {
      proceedThreshold: Math.max(0.5, Math.min(0.95, proceedThreshold)),
      clarifyThreshold: Math.max(0.3, Math.min(0.8, clarifyThreshold)),
      fallbackThreshold: Math.max(0.1, Math.min(0.6, fallbackThreshold))
    };
  }

  // Private helper methods

  private calculateConfidenceFactors(
    userMessage: string,
    functionName: string,
    parameters: any,
    context: AIActionContext,
    aiResponseTime: number
  ): ConfidenceFactors {
    return {
      messageLength: this.scoreMessageLength(userMessage),
      keywordMatches: this.scoreKeywordMatches(userMessage, functionName),
      grammarQuality: this.scoreGrammarQuality(userMessage),
      intentClarity: this.scoreIntentClarity(userMessage, functionName),
      
      conversationFlow: this.scoreConversationFlow(userMessage, context),
      sessionHistory: this.scoreSessionHistory(context),
      menuItemMatch: this.scoreMenuItemMatch(parameters, context),
      customerProfile: this.scoreCustomerProfile(context),
      
      functionCallConsistency: this.scoreFunctionConsistency(functionName, parameters),
      parameterCompleteness: this.scoreParameterCompleteness(parameters, functionName),
      responseCoherence: this.scoreResponseCoherence(userMessage, functionName, parameters),
      
      timeOfDay: this.scoreTimeOfDay(),
      restaurantBusyness: this.scoreRestaurantBusyness(context),
      previousAccuracy: this.scorePreviousAccuracy(context.customerSession?.id || '')
    };
  }

  private calculateBaseConfidence(functionName: string, parameters: any): number {
    // Base confidence varies by function type
    const functionConfidence = {
      'place_order': 0.8,
      'add_to_existing_order': 0.75,
      'modify_order': 0.7,
      'cancel_order': 0.85,
      'check_order_status': 0.9,
      'request_recommendations': 0.8,
      'clarify_customer_request': 0.6,
      'handle_complaint_or_issue': 0.65,
      'provide_information': 0.85,
      'no_action_needed': 0.9
    };

    let confidence = functionConfidence[functionName as keyof typeof functionConfidence] || 0.5;

    // Adjust based on parameter quality
    if (parameters && typeof parameters === 'object') {
      const parameterCount = Object.keys(parameters).length;
      const hasRequiredParams = this.hasRequiredParameters(functionName, parameters);
      
      if (hasRequiredParams) {
        confidence += 0.1;
      } else {
        confidence -= 0.2;
      }
      
      // More parameters generally indicate higher confidence
      confidence += Math.min(0.1, parameterCount * 0.02);
    }

    return Math.max(0.1, Math.min(1, confidence));
  }

  private applyConfidenceAdjustments(
    baseConfidence: number,
    factors: ConfidenceFactors
  ): number {
    let adjustedConfidence = baseConfidence;

    // Weight factors by importance
    const weights = {
      messageClarity: 0.25,
      contextual: 0.35,
      aiResponse: 0.25,
      external: 0.15
    };

    // Message clarity adjustment
    const messageClarityScore = (
      factors.messageLength * 0.2 +
      factors.keywordMatches * 0.3 +
      factors.grammarQuality * 0.2 +
      factors.intentClarity * 0.3
    );
    adjustedConfidence += (messageClarityScore - 0.5) * weights.messageClarity;

    // Contextual adjustment
    const contextualScore = (
      factors.conversationFlow * 0.3 +
      factors.sessionHistory * 0.2 +
      factors.menuItemMatch * 0.3 +
      factors.customerProfile * 0.2
    );
    adjustedConfidence += (contextualScore - 0.5) * weights.contextual;

    // AI response quality adjustment
    const aiResponseScore = (
      factors.functionCallConsistency * 0.4 +
      factors.parameterCompleteness * 0.3 +
      factors.responseCoherence * 0.3
    );
    adjustedConfidence += (aiResponseScore - 0.5) * weights.aiResponse;

    // External factors adjustment
    const externalScore = (
      factors.timeOfDay * 0.3 +
      factors.restaurantBusyness * 0.3 +
      factors.previousAccuracy * 0.4
    );
    adjustedConfidence += (externalScore - 0.5) * weights.external;

    return adjustedConfidence;
  }

  private detectUncertaintyIndicators(
    userMessage: string,
    functionName: string,
    parameters: any,
    factors: ConfidenceFactors
  ): string[] {
    const indicators: string[] = [];

    // Message-based indicators
    if (factors.messageLength < 0.3) {
      indicators.push('Message too short for clear intent');
    }
    
    if (factors.grammarQuality < 0.4) {
      indicators.push('Poor grammar or unclear phrasing');
    }

    if (factors.intentClarity < 0.5) {
      indicators.push('Ambiguous customer intent');
    }

    // Context-based indicators
    if (factors.menuItemMatch < 0.3) {
      indicators.push('Requested items not clearly matching menu');
    }

    if (factors.conversationFlow < 0.4) {
      indicators.push('Response doesn\'t fit conversation flow');
    }

    // AI response indicators
    if (factors.parameterCompleteness < 0.6) {
      indicators.push('AI function call missing key parameters');
    }

    if (factors.functionCallConsistency < 0.5) {
      indicators.push('Function choice inconsistent with message');
    }

    // Check for uncertainty words in message
    const uncertaintyWords = ['maybe', 'perhaps', 'not sure', 'think', 'might', 'possibly'];
    if (uncertaintyWords.some(word => userMessage.toLowerCase().includes(word))) {
      indicators.push('Customer expressed uncertainty');
    }

    return indicators;
  }

  private calculateReliabilityScore(
    factors: ConfidenceFactors,
    uncertaintyIndicators: string[]
  ): number {
    // Start with average of key factors
    const keyFactors = [
      factors.intentClarity,
      factors.functionCallConsistency,
      factors.parameterCompleteness,
      factors.menuItemMatch
    ];

    let reliabilityScore = keyFactors.reduce((sum, factor) => sum + factor, 0) / keyFactors.length;

    // Penalize for uncertainty indicators
    reliabilityScore -= uncertaintyIndicators.length * 0.1;

    // Bonus for high conversation flow
    if (factors.conversationFlow > 0.8) {
      reliabilityScore += 0.1;
    }

    // Bonus for good previous accuracy
    if (factors.previousAccuracy > 0.8) {
      reliabilityScore += 0.1;
    }

    return Math.max(0, Math.min(1, reliabilityScore));
  }

  private determineRecommendedAction(
    confidence: number,
    uncertaintyIndicators: string[],
    reliabilityScore: number
  ): 'proceed' | 'clarify' | 'fallback' {
    // High confidence and reliability
    if (confidence > 0.8 && reliabilityScore > 0.7 && uncertaintyIndicators.length === 0) {
      return 'proceed';
    }

    // Low confidence or many uncertainty indicators
    if (confidence < 0.4 || uncertaintyIndicators.length > 3 || reliabilityScore < 0.3) {
      return 'fallback';
    }

    // Medium confidence - ask for clarification
    return 'clarify';
  }

  // Individual scoring methods

  private scoreMessageLength(message: string): number {
    const length = message.trim().length;
    if (length < 5) return 0.1;
    if (length < 15) return 0.4;
    if (length < 50) return 0.8;
    if (length < 100) return 1.0;
    return 0.9; // Very long messages might be unclear
  }

  private scoreKeywordMatches(message: string, functionName: string): number {
    const lowerMessage = message.toLowerCase();
    
    const functionKeywords = {
      'place_order': ['want', 'order', 'get', 'have', 'buy', 'take'],
      'modify_order': ['change', 'modify', 'update', 'edit', 'different'],
      'cancel_order': ['cancel', 'remove', 'delete', 'nevermind'],
      'check_order_status': ['status', 'ready', 'how long', 'when'],
      'request_recommendations': ['recommend', 'suggest', 'best', 'popular', 'good'],
      'provide_information': ['what', 'how', 'tell me', 'explain', 'info']
    };

    const keywords = functionKeywords[functionName as keyof typeof functionKeywords] || [];
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    
    return Math.min(1, matches / Math.max(1, keywords.length * 0.5));
  }

  private scoreGrammarQuality(message: string): number {
    // Simple grammar quality heuristics
    const hasCapitalization = /[A-Z]/.test(message);
    const hasPunctuation = /[.!?]/.test(message);
    const wordsCount = message.trim().split(/\s+/).length;
    const avgWordLength = message.replace(/\s+/g, '').length / wordsCount;
    
    let score = 0.5; // Base score
    
    if (hasCapitalization) score += 0.1;
    if (hasPunctuation) score += 0.1;
    if (avgWordLength > 3 && avgWordLength < 8) score += 0.2;
    if (wordsCount > 2) score += 0.1;
    
    return Math.min(1, score);
  }

  private scoreIntentClarity(message: string, functionName: string): number {
    const lowerMessage = message.toLowerCase();
    
    // Clear intent indicators
    const clearIntents = {
      'place_order': /\b(i want|give me|can i get|i'll have|order)\b/,
      'modify_order': /\b(change|modify|edit|update|instead)\b/,
      'cancel_order': /\b(cancel|remove|delete|nevermind)\b/,
      'request_recommendations': /\b(recommend|suggest|what's good|popular)\b/,
      'provide_information': /\b(what is|tell me|how much|ingredients)\b/
    };

    const pattern = clearIntents[functionName as keyof typeof clearIntents];
    return pattern && pattern.test(lowerMessage) ? 0.9 : 0.5;
  }

  private scoreConversationFlow(message: string, context: AIActionContext): number {
    if (!context.conversationHistory || context.conversationHistory.length === 0) {
      return 0.7; // Neutral for new conversations
    }

    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
    if (!lastMessage) return 0.5;

    // Check if current message is a logical follow-up
    const lastContent = lastMessage.content.toLowerCase();
    const currentContent = message.toLowerCase();

    // Simple flow analysis
    if (lastContent.includes('recommend') && currentContent.includes('yes')) return 0.9;
    if (lastContent.includes('order') && currentContent.includes('confirm')) return 0.9;
    if (lastContent.includes('would you like') && (currentContent.includes('yes') || currentContent.includes('no'))) return 0.8;

    return 0.6; // Default moderate flow
  }

  private scoreSessionHistory(context: AIActionContext): number {
    if (!context.customerSession) return 0.5;
    
    const session = context.customerSession;
    let score = 0.5;
    
    // More orders = better understanding
    if (session.totalOrders > 0) score += 0.2;
    if (session.totalOrders > 2) score += 0.2;
    
    // Longer sessions = more context
    const sessionDuration = Date.now() - session.startTime.getTime();
    if (sessionDuration > 300000) score += 0.1; // 5+ minutes
    
    return Math.min(1, score);
  }

  private scoreMenuItemMatch(parameters: any, context: AIActionContext): number {
    if (!parameters?.items || !context.menuItems) return 0.5;
    
    const menuItemIds = context.menuItems.map(item => item.id);
    const requestedIds = parameters.items.map((item: any) => item.menuItemId);
    
    const validIds = requestedIds.filter((id: string) => menuItemIds.includes(id));
    return validIds.length / Math.max(1, requestedIds.length);
  }

  private scoreCustomerProfile(context: AIActionContext): number {
    // Score based on available customer information
    let score = 0.3; // Base score
    
    if (context.customerSession?.customerName) score += 0.2;
    if (context.customerSession?.totalOrders > 0) score += 0.3;
    if (context.conversationHistory && context.conversationHistory.length > 2) score += 0.2;
    
    return Math.min(1, score);
  }

  private scoreFunctionConsistency(functionName: string, parameters: any): number {
    // Check if parameters make sense for the function
    const requiredParams = this.getRequiredParameters(functionName);
    const providedParams = Object.keys(parameters || {});
    
    const hasAllRequired = requiredParams.every(param => providedParams.includes(param));
    const hasExtraParams = providedParams.some(param => !requiredParams.includes(param));
    
    if (hasAllRequired && !hasExtraParams) return 1.0;
    if (hasAllRequired) return 0.8;
    return 0.4;
  }

  private scoreParameterCompleteness(parameters: any, functionName: string): number {
    const requiredParams = this.getRequiredParameters(functionName);
    if (requiredParams.length === 0) return 1.0;
    
    const providedParams = Object.keys(parameters || {});
    const completeness = providedParams.filter(param => 
      requiredParams.includes(param) && parameters[param] != null
    ).length / requiredParams.length;
    
    return completeness;
  }

  private scoreResponseCoherence(message: string, functionName: string, parameters: any): number {
    // Check if AI response makes sense given the input
    const messageLength = message.length;
    const parameterCount = Object.keys(parameters || {}).length;
    
    // Simple heuristic: more complex messages should result in more parameters
    if (messageLength > 50 && parameterCount < 2) return 0.4;
    if (messageLength < 20 && parameterCount > 4) return 0.5;
    
    return 0.8; // Default good coherence
  }

  private scoreTimeOfDay(): number {
    const hour = new Date().getHours();
    
    // Peak hours (lunch/dinner) might have more errors
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 21)) {
      return 0.7;
    }
    
    return 0.8; // Off-peak hours
  }

  private scoreRestaurantBusyness(context: AIActionContext): number {
    // Estimate busyness based on current orders
    const orderCount = context.currentOrders?.length || 0;
    
    if (orderCount === 0) return 0.9;
    if (orderCount < 3) return 0.8;
    if (orderCount < 5) return 0.7;
    return 0.6; // Very busy
  }

  private scorePreviousAccuracy(sessionId: string): number {
    const history = this.accuracyHistory.get(sessionId);
    if (!history || history.length === 0) return 0.7; // Neutral for new sessions
    
    return history.reduce((sum, acc) => sum + acc, 0) / history.length;
  }

  private hasRequiredParameters(functionName: string, parameters: any): boolean {
    const required = this.getRequiredParameters(functionName);
    return required.every(param => parameters && parameters[param] != null);
  }

  private getRequiredParameters(functionName: string): string[] {
    const requirements = {
      'place_order': ['items'],
      'add_to_existing_order': ['items'],
      'modify_order': ['orderId', 'modificationType'],
      'cancel_order': ['orderId'],
      'check_order_status': [],
      'request_recommendations': [],
      'clarify_customer_request': ['clarificationNeeded'],
      'handle_complaint_or_issue': ['issueType'],
      'provide_information': ['infoType'],
      'no_action_needed': []
    };
    
    return requirements[functionName as keyof typeof requirements] || [];
  }
}

// Export singleton instance
export const advancedConfidenceScorer = AdvancedConfidenceScorer.getInstance();

// Utility functions
export function calculateAdvancedConfidence(
  userMessage: string,
  functionName: string,
  parameters: any,
  context: AIActionContext,
  aiResponseTime: number = 0
): ConfidenceMetrics {
  return advancedConfidenceScorer.calculateConfidence(
    userMessage,
    functionName,
    parameters,
    context,
    aiResponseTime
  );
}

export function updateConfidenceAccuracy(
  sessionId: string,
  predictedConfidence: number,
  actualSuccess: boolean
): void {
  advancedConfidenceScorer.updateAccuracyHistory(sessionId, predictedConfidence, actualSuccess);
}

export function getConfidenceThresholds(context: AIActionContext) {
  return advancedConfidenceScorer.getThresholdRecommendations(context);
} 