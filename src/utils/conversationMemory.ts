/**
 * Conversation Memory System
 * Persistent conversation context and customer preference learning
 */

import { db } from '@/server/db';

export interface ConversationMemory {
  id: string;
  sessionId: string;
  restaurantId: string;
  tableNumber: number;
  conversationSummary: string;
  customerPreferences: CustomerPreferences;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  lastUpdated: Date;
  messageCount: number;
}

export interface CustomerPreferences {
  // Dietary preferences
  dietaryRestrictions: string[];
  favoriteCategories: string[];
  dislikedItems: string[];
  preferredItems: string[];
  
  // Ordering patterns
  typicalOrderSize: 'small' | 'medium' | 'large';
  priceRange: 'budget' | 'moderate' | 'premium';
  orderFrequency: number;
  
  // Service preferences
  communicationStyle: 'brief' | 'detailed' | 'friendly';
  needsAssistance: boolean;
  hasSpecialRequests: boolean;
  
  // Contextual information
  visitPurpose: 'casual' | 'business' | 'celebration' | 'unknown';
  groupSize: number;
  timePreference: 'quick' | 'relaxed';
}

class ConversationMemoryManager {
  private static instance: ConversationMemoryManager;
  private memoryCache: Map<string, ConversationMemory> = new Map();

  private constructor() {}

  public static getInstance(): ConversationMemoryManager {
    if (!ConversationMemoryManager.instance) {
      ConversationMemoryManager.instance = new ConversationMemoryManager();
    }
    return ConversationMemoryManager.instance;
  }

  /**
   * Initialize or retrieve conversation memory for a session
   */
  async getConversationMemory(
    sessionId: string,
    restaurantId: string,
    tableNumber: number
  ): Promise<ConversationMemory> {
    // Check cache first
    if (this.memoryCache.has(sessionId)) {
      return this.memoryCache.get(sessionId)!;
    }

    // Create new memory
    const newMemory: ConversationMemory = {
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      restaurantId,
      tableNumber,
      conversationSummary: '',
      customerPreferences: this.getDefaultPreferences(),
      keyTopics: [],
      sentiment: 'neutral',
      lastUpdated: new Date(),
      messageCount: 0
    };

    this.memoryCache.set(sessionId, newMemory);
    return newMemory;
  }

  /**
   * Update conversation memory with new message
   */
  async updateConversationMemory(
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    actionTaken?: string
  ): Promise<void> {
    const memory = this.memoryCache.get(sessionId);
    if (!memory) return;
    
    // Update message count
    memory.messageCount += 1;
    memory.lastUpdated = new Date();

    // Analyze and update preferences
    this.analyzeMessage(userMessage, memory);
    
    // Update conversation summary
    this.updateConversationSummary(userMessage, aiResponse, actionTaken, memory);

    // Update sentiment
    memory.sentiment = this.analyzeSentiment(userMessage);

    // Save to cache
    this.memoryCache.set(sessionId, memory);

    console.log('📝 Updated conversation memory:', {
      sessionId: memory.sessionId,
      messageCount: memory.messageCount,
      keyTopics: memory.keyTopics.length,
      sentiment: memory.sentiment
    });
  }

  /**
   * Get conversation context for AI
   */
  getConversationContext(memory: ConversationMemory): string {
    const { customerPreferences, conversationSummary, keyTopics, sentiment } = memory;

    let context = '\n🧠 CONVERSATION MEMORY:\n';
    
    // Customer preferences
    if (customerPreferences.dietaryRestrictions.length > 0) {
      context += `- Dietary restrictions: ${customerPreferences.dietaryRestrictions.join(', ')}\n`;
    }
    
    if (customerPreferences.favoriteCategories.length > 0) {
      context += `- Prefers: ${customerPreferences.favoriteCategories.join(', ')}\n`;
    }
    
    if (customerPreferences.dislikedItems.length > 0) {
      context += `- Dislikes: ${customerPreferences.dislikedItems.join(', ')}\n`;
    }

    // Communication style
    context += `- Communication style: ${customerPreferences.communicationStyle}\n`;
    context += `- Typical order size: ${customerPreferences.typicalOrderSize}\n`;
    context += `- Price preference: ${customerPreferences.priceRange}\n`;

    // Conversation summary
    if (conversationSummary) {
      context += `- Conversation summary: ${conversationSummary}\n`;
    }

    // Key topics
    if (keyTopics.length > 0) {
      context += `- Key topics discussed: ${keyTopics.join(', ')}\n`;
    }

    // Sentiment
    context += `- Customer mood: ${sentiment}\n`;
    context += `- Messages exchanged: ${memory.messageCount}\n`;

    return context;
  }

  /**
   * Learn from customer behavior
   */
  async learnFromOrder(
    sessionId: string,
    orderItems: Array<{ name: string; category: string; price: number }>
  ): Promise<void> {
    const memory = this.memoryCache.get(sessionId);
    if (!memory) return;

    const preferences = memory.customerPreferences;

    // Learn favorite categories
    orderItems.forEach(item => {
      if (!preferences.favoriteCategories.includes(item.category)) {
        preferences.favoriteCategories.push(item.category);
      }
      
      if (!preferences.preferredItems.includes(item.name)) {
        preferences.preferredItems.push(item.name);
      }
    });

    // Determine price range preference
    const avgPrice = orderItems.reduce((sum, item) => sum + item.price, 0) / orderItems.length;
    if (avgPrice < 10) {
      preferences.priceRange = 'budget';
    } else if (avgPrice > 20) {
      preferences.priceRange = 'premium';
    } else {
      preferences.priceRange = 'moderate';
    }

    // Determine order size preference
    const totalItems = orderItems.length;
    if (totalItems <= 2) {
      preferences.typicalOrderSize = 'small';
    } else if (totalItems >= 4) {
      preferences.typicalOrderSize = 'large';
    } else {
      preferences.typicalOrderSize = 'medium';
    }

    preferences.orderFrequency += 1;

    console.log('🎯 Learned from order:', {
      sessionId,
      favoriteCategories: preferences.favoriteCategories,
      priceRange: preferences.priceRange,
      orderSize: preferences.typicalOrderSize
    });

    // Update cache
    this.memoryCache.set(sessionId, memory);
  }

  /**
   * Get personalized recommendations based on memory
   */
  getPersonalizedRecommendations(
    memory: ConversationMemory,
    menuItems: Array<{ id: string; name: string; category: string; price: number; dietaryTags?: string[] }>
  ): Array<{ id: string; name: string; reason: string; confidence: number }> {
    const { customerPreferences } = memory;
    const recommendations: Array<{ id: string; name: string; reason: string; confidence: number }> = [];

    menuItems.forEach(item => {
      let confidence = 0;
      let reasons: string[] = [];

      // Check favorite categories
      if (customerPreferences.favoriteCategories.includes(item.category)) {
        confidence += 0.3;
        reasons.push(`you liked ${item.category} before`);
      }

      // Check preferred items
      if (customerPreferences.preferredItems.some(pref => 
        item.name.toLowerCase().includes(pref.toLowerCase())
      )) {
        confidence += 0.4;
        reasons.push('similar to your previous orders');
      }

      // Check dietary restrictions
      if (customerPreferences.dietaryRestrictions.length > 0 && item.dietaryTags) {
        const matchesDietary = customerPreferences.dietaryRestrictions.some(restriction =>
          item.dietaryTags!.includes(restriction)
        );
        if (matchesDietary) {
          confidence += 0.2;
          reasons.push('matches your dietary preferences');
        }
      }

      // Check price range
      const priceMatch = this.checkPriceRangeMatch(item.price, customerPreferences.priceRange);
      if (priceMatch) {
        confidence += 0.1;
        reasons.push('in your preferred price range');
      }

      // Avoid disliked items
      if (customerPreferences.dislikedItems.some(disliked =>
        item.name.toLowerCase().includes(disliked.toLowerCase())
      )) {
        confidence = 0;
      }

      if (confidence > 0.2) {
        recommendations.push({
          id: item.id,
          name: item.name,
          reason: reasons.join(', '),
          confidence
        });
      }
    });

    // Sort by confidence and return top 5
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  // Private helper methods

  private getDefaultPreferences(): CustomerPreferences {
    return {
      dietaryRestrictions: [],
      favoriteCategories: [],
      dislikedItems: [],
      preferredItems: [],
      typicalOrderSize: 'medium',
      priceRange: 'moderate',
      orderFrequency: 0,
      communicationStyle: 'friendly',
      needsAssistance: false,
      hasSpecialRequests: false,
      visitPurpose: 'unknown',
      groupSize: 1,
      timePreference: 'relaxed'
    };
  }

  private analyzeMessage(message: string, memory: ConversationMemory): void {
    const lowerMessage = message.toLowerCase();
    const preferences = memory.customerPreferences;

    // Detect dietary restrictions
    const dietaryKeywords = {
      'vegetarian': ['vegetarian', 'veggie', 'no meat'],
      'vegan': ['vegan', 'no dairy', 'plant-based'],
      'gluten-free': ['gluten free', 'gluten-free', 'celiac'],
      'dairy-free': ['dairy free', 'lactose intolerant', 'no cheese']
    };

    Object.entries(dietaryKeywords).forEach(([restriction, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        if (!preferences.dietaryRestrictions.includes(restriction)) {
          preferences.dietaryRestrictions.push(restriction);
        }
      }
    });

    // Detect communication style
    if (lowerMessage.length < 20 && !lowerMessage.includes('please')) {
      preferences.communicationStyle = 'brief';
    } else if (lowerMessage.includes('please') || lowerMessage.includes('thank')) {
      preferences.communicationStyle = 'friendly';
    }

    // Detect assistance needs
    if (lowerMessage.includes('help') || lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      preferences.needsAssistance = true;
    }

    // Detect special requests
    if (lowerMessage.includes('no ') || lowerMessage.includes('extra ') || lowerMessage.includes('on the side')) {
      preferences.hasSpecialRequests = true;
    }
  }

  private updateConversationSummary(
    userMessage: string,
    aiResponse: string,
    actionTaken: string | undefined,
    memory: ConversationMemory
  ): void {
    // Add key topics
    const topics = this.extractTopics(userMessage);
    topics.forEach(topic => {
      if (!memory.keyTopics.includes(topic)) {
        memory.keyTopics.push(topic);
      }
    });

    // Update summary (keep last 3 interactions)
    const newSummary = `${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`;
    const summaryParts = memory.conversationSummary.split(' | ').filter(Boolean);
    summaryParts.push(newSummary);
    memory.conversationSummary = summaryParts.slice(-3).join(' | ');
  }

  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Food-related topics
    const foodTopics = [
      'pizza', 'salad', 'burger', 'pasta', 'appetizer', 'dessert', 'drink',
      'vegetarian', 'spicy', 'mild', 'recommendation', 'popular', 'special'
    ];

    foodTopics.forEach(topic => {
      if (lowerMessage.includes(topic)) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const lowerMessage = message.toLowerCase();
    
    const positiveWords = ['great', 'good', 'excellent', 'love', 'like', 'perfect', 'amazing', 'delicious'];
    const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'disgusting'];

    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private checkPriceRangeMatch(price: number, priceRange: string): boolean {
    switch (priceRange) {
      case 'budget': return price <= 12;
      case 'moderate': return price > 12 && price <= 20;
      case 'premium': return price > 20;
      default: return true;
    }
  }

  /**
   * Clear memory cache (useful for testing)
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    totalSessions: number;
    averageMessageCount: number;
    topTopics: Array<{ topic: string; count: number }>;
  } {
    const memories = Array.from(this.memoryCache.values());
    const totalSessions = memories.length;
    const averageMessageCount = memories.length > 0 
      ? memories.reduce((sum, m) => sum + m.messageCount, 0) / memories.length 
      : 0;

    // Count topics
    const topicCounts = new Map<string, number>();
    memories.forEach(memory => {
      memory.keyTopics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions,
      averageMessageCount,
      topTopics
    };
  }
}

// Export singleton instance
export const conversationMemoryManager = ConversationMemoryManager.getInstance();

// Utility functions
export async function getConversationMemory(sessionId: string, restaurantId: string, tableNumber: number) {
  return conversationMemoryManager.getConversationMemory(sessionId, restaurantId, tableNumber);
}

export async function updateConversationMemory(
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  actionTaken?: string
) {
  return conversationMemoryManager.updateConversationMemory(sessionId, userMessage, aiResponse, actionTaken);
}

export function getPersonalizedRecommendations(
  memory: ConversationMemory,
  menuItems: Array<{ id: string; name: string; category: string; price: number; dietaryTags?: string[] }>
) {
  return conversationMemoryManager.getPersonalizedRecommendations(memory, menuItems);
} 