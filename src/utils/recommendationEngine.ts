import { 
  type PendingAction,
  type ParsedOrderItem,
  createRecommendationAction,
  createAddToOrderAction,
  generateActionId
} from "@/types/chatActions";

export interface RecommendationContext {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentOrder: ParsedOrderItem[];
  timeOfDay: string;
  restaurantId: string;
  tableNumber?: number;
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    dietaryTags: Array<{ value: string }>;
  }>;
}

export interface RecommendationSuggestion {
  type: 'drink' | 'side' | 'dessert' | 'upgrade' | 'complement' | 'dietary' | 'popular';
  priority: number; // 1-10, higher = more important
  message: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    reason: string;
  }>;
  confidence: number; // 0-1, how confident we are in this recommendation
}

export class RecommendationEngine {
  private restaurant: {
    id: string;
    menuItems: Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      category: string;
      dietaryTags: Array<{ value: string }>;
    }>;
  };

  constructor(restaurant: RecommendationEngine['restaurant']) {
    this.restaurant = restaurant;
  }

  /**
   * Generate personalized recommendations based on context
   */
  generateRecommendations(context: RecommendationContext): RecommendationSuggestion[] {
    const suggestions: RecommendationSuggestion[] = [];

    // 1. Complementary item recommendations
    const complementaryItems = this.getComplementaryItems(context.currentOrder);
    if (complementaryItems.length > 0) {
      suggestions.push(...complementaryItems);
    }

    // 2. Time-based recommendations
    const timeBasedRecs = this.getTimeBasedRecommendations(context.timeOfDay);
    if (timeBasedRecs.length > 0) {
      suggestions.push(...timeBasedRecs);
    }

    // 3. Dietary preference recommendations
    const dietaryRecs = this.getDietaryRecommendations(context);
    if (dietaryRecs.length > 0) {
      suggestions.push(...dietaryRecs);
    }

    // 4. Popular item recommendations
    const popularRecs = this.getPopularItemRecommendations(context.currentOrder);
    if (popularRecs.length > 0) {
      suggestions.push(...popularRecs);
    }

    // 5. Upgrade recommendations
    const upgradeRecs = this.getUpgradeRecommendations(context.currentOrder);
    if (upgradeRecs.length > 0) {
      suggestions.push(...upgradeRecs);
    }

    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => (b.priority * b.confidence) - (a.priority * a.confidence))
      .slice(0, 3); // Return top 3 recommendations
  }

  /**
   * Get items that complement the current order
   */
  getComplementaryItems(currentOrder: ParsedOrderItem[]): RecommendationSuggestion[] {
    const suggestions: RecommendationSuggestion[] = [];

    if (currentOrder.length === 0) return suggestions;

    const orderCategories = this.categorizeOrder(currentOrder);

    // Suggest drinks if none ordered
    if (!orderCategories.hasDrinks && orderCategories.hasMainDish) {
      const drinkItems = this.restaurant.menuItems
        .filter(item => this.isDrink(item))
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Perfect to complement your meal"
        }));

      if (drinkItems.length > 0) {
        suggestions.push({
          type: 'drink',
          priority: 8,
          message: "Would you like to add a refreshing drink to your order?",
          items: drinkItems,
          confidence: 0.9
        });
      }
    }

    // Suggest sides if main dish but no sides
    if (orderCategories.hasMainDish && !orderCategories.hasSides) {
      const sideItems = this.restaurant.menuItems
        .filter(item => this.isSide(item))
        .slice(0, 3)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Great addition to your main course"
        }));

      if (sideItems.length > 0) {
        suggestions.push({
          type: 'side',
          priority: 7,
          message: "How about adding a delicious side dish?",
          items: sideItems,
          confidence: 0.8
        });
      }
    }

    // Suggest dessert for substantial orders
    if (orderCategories.orderValue > 25 && !orderCategories.hasDessert) {
      const dessertItems = this.restaurant.menuItems
        .filter(item => this.isDessert(item))
        .slice(0, 2)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Perfect way to end your meal"
        }));

      if (dessertItems.length > 0) {
        suggestions.push({
          type: 'dessert',
          priority: 6,
          message: "Would you like to finish with a sweet treat?",
          items: dessertItems,
          confidence: 0.7
        });
      }
    }

    return suggestions;
  }

  /**
   * Get recommendations based on time of day
   */
  getTimeBasedRecommendations(timeOfDay: string): RecommendationSuggestion[] {
    const suggestions: RecommendationSuggestion[] = [];
    const hour = new Date().getHours();

    // Morning recommendations (6-11 AM)
    if (hour >= 6 && hour < 11) {
      const breakfastItems = this.restaurant.menuItems
        .filter(item => 
          item.name.toLowerCase().includes('coffee') ||
          item.name.toLowerCase().includes('breakfast') ||
          item.name.toLowerCase().includes('pancake') ||
          item.name.toLowerCase().includes('eggs')
        )
        .slice(0, 2)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Perfect for breakfast"
        }));

      if (breakfastItems.length > 0) {
        suggestions.push({
          type: 'popular',
          priority: 7,
          message: "Start your day right with our breakfast favorites!",
          items: breakfastItems,
          confidence: 0.8
        });
      }
    }

    // Lunch recommendations (11 AM - 3 PM)
    else if (hour >= 11 && hour < 15) {
      const lunchItems = this.restaurant.menuItems
        .filter(item => 
          item.name.toLowerCase().includes('salad') ||
          item.name.toLowerCase().includes('sandwich') ||
          item.name.toLowerCase().includes('soup')
        )
        .slice(0, 2)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Great for lunch"
        }));

      if (lunchItems.length > 0) {
        suggestions.push({
          type: 'popular',
          priority: 6,
          message: "Try our popular lunch options!",
          items: lunchItems,
          confidence: 0.7
        });
      }
    }

    // Evening recommendations (5 PM - 10 PM)
    else if (hour >= 17 && hour < 22) {
      const dinnerItems = this.restaurant.menuItems
        .filter(item => 
          item.name.toLowerCase().includes('steak') ||
          item.name.toLowerCase().includes('pasta') ||
          item.name.toLowerCase().includes('wine')
        )
        .slice(0, 2)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: "Perfect for dinner"
        }));

      if (dinnerItems.length > 0) {
        suggestions.push({
          type: 'popular',
          priority: 6,
          message: "Enjoy our dinner specialties!",
          items: dinnerItems,
          confidence: 0.7
        });
      }
    }

    return suggestions;
  }

  /**
   * Get dietary-based recommendations
   */
  getDietaryRecommendations(context: RecommendationContext): RecommendationSuggestion[] {
    const suggestions: RecommendationSuggestion[] = [];

    // Analyze conversation for dietary mentions
    const conversationText = context.conversationHistory
      .map(msg => msg.content.toLowerCase())
      .join(' ');

    const dietaryKeywords = {
      vegetarian: ['vegetarian', 'veggie', 'no meat'],
      vegan: ['vegan', 'plant-based', 'dairy-free'],
      glutenFree: ['gluten-free', 'celiac', 'no gluten'],
      healthy: ['healthy', 'light', 'low-calorie', 'fresh']
    };

    for (const [dietType, keywords] of Object.entries(dietaryKeywords)) {
      const mentioned = keywords.some(keyword => conversationText.includes(keyword));
      
      if (mentioned) {
        const dietaryItems = this.restaurant.menuItems
          .filter(item => 
            item.dietaryTags.some(tag => 
              tag.value.toLowerCase().includes(dietType.toLowerCase())
            )
          )
          .slice(0, 3)
          .map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            reason: `Perfect for ${dietType} preferences`
          }));

        if (dietaryItems.length > 0) {
          suggestions.push({
            type: 'dietary',
            priority: 9,
            message: `I noticed you mentioned ${dietType} preferences. Here are some great options!`,
            items: dietaryItems,
            confidence: 0.9
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Get popular item recommendations
   */
  getPopularItemRecommendations(currentOrder: ParsedOrderItem[]): RecommendationSuggestion[] {
    // In a real system, this would use actual popularity data
    // For now, we'll simulate popular items based on common restaurant favorites
    
    const popularKeywords = ['pizza', 'burger', 'chicken', 'pasta', 'salad'];
    const popularItems = this.restaurant.menuItems
      .filter(item => 
        popularKeywords.some(keyword => 
          item.name.toLowerCase().includes(keyword)
        )
      )
      .filter(item => 
        !currentOrder.some(orderItem => orderItem.id === item.id)
      )
      .slice(0, 2)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        reason: "Customer favorite"
      }));

    if (popularItems.length === 0) return [];

    return [{
      type: 'popular',
      priority: 5,
      message: "Try our most popular dishes!",
      items: popularItems,
      confidence: 0.6
    }];
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations(currentOrder: ParsedOrderItem[]): RecommendationSuggestion[] {
    const suggestions: RecommendationSuggestion[] = [];

    for (const orderItem of currentOrder) {
      // Look for premium versions of ordered items
      const upgrades = this.restaurant.menuItems
        .filter(item => 
          item.name.toLowerCase().includes(orderItem.name.toLowerCase()) &&
          item.price > orderItem.price &&
          item.id !== orderItem.id
        )
        .slice(0, 1)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          reason: `Upgrade from ${orderItem.name}`
        }));

      if (upgrades.length > 0) {
        suggestions.push({
          type: 'upgrade',
          priority: 4,
          message: `Would you like to upgrade your ${orderItem.name}?`,
          items: upgrades,
          confidence: 0.5
        });
      }
    }

    return suggestions;
  }

  /**
   * Create a recommendation action that asks for confirmation
   */
  createRecommendationAction(
    suggestion: RecommendationSuggestion,
    restaurantId: string,
    tableNumber?: number
  ): PendingAction {
    return createRecommendationAction(
      suggestion.items,
      suggestion.message,
      restaurantId,
      tableNumber
    );
  }

  // Helper methods
  private categorizeOrder(order: ParsedOrderItem[]) {
    return {
      hasMainDish: order.some(item => this.isMainDish(item)),
      hasDrinks: order.some(item => this.isDrink(item)),
      hasSides: order.some(item => this.isSide(item)),
      hasDessert: order.some(item => this.isDessert(item)),
      orderValue: order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
  }

  private isMainDish(item: ParsedOrderItem | any): boolean {
    const mainDishKeywords = ['pizza', 'burger', 'steak', 'chicken', 'pasta', 'fish', 'sandwich'];
    return mainDishKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword)
    );
  }

  private isDrink(item: any): boolean {
    const drinkKeywords = ['drink', 'soda', 'juice', 'water', 'coffee', 'tea', 'beer', 'wine'];
    return drinkKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes('drink') ||
      item.category?.toLowerCase().includes('beverage')
    );
  }

  private isSide(item: any): boolean {
    const sideKeywords = ['fries', 'salad', 'bread', 'rice', 'vegetables', 'side'];
    return sideKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes('side')
    );
  }

  private isDessert(item: any): boolean {
    const dessertKeywords = ['cake', 'ice cream', 'dessert', 'pie', 'cookie', 'chocolate'];
    return dessertKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes('dessert')
    );
  }
}

/**
 * Create a recommendation engine instance
 */
export function createRecommendationEngine(restaurant: {
  id: string;
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    dietaryTags: Array<{ value: string }>;
  }>;
}): RecommendationEngine {
  return new RecommendationEngine(restaurant);
}

/**
 * Generate upselling action for current order
 */
export function generateUpsellAction(
  currentOrder: ParsedOrderItem[],
  restaurant: any,
  context: Partial<RecommendationContext> = {}
): PendingAction | null {
  const engine = createRecommendationEngine(restaurant);
  
  const fullContext: RecommendationContext = {
    userMessage: '',
    conversationHistory: [],
    currentOrder,
    timeOfDay: new Date().toISOString(),
    restaurantId: restaurant.id,
    menuItems: restaurant.menuItems,
    ...context
  };

  const recommendations = engine.generateRecommendations(fullContext);
  
  if (recommendations.length === 0) return null;

  const topRecommendation = recommendations[0];
  return engine.createRecommendationAction(
    topRecommendation,
    restaurant.id,
    context.tableNumber
  );
} 