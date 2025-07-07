import { 
  type PendingAction, 
  type ParsedOrderItem,
  createAddToOrderAction,
  createRemoveFromOrderAction,
  createModifyOrderItemAction,
  createConfirmOrderAction,
  generateActionId
} from "@/types/chatActions";
import { 
  createRecommendationEngine,
  generateUpsellAction,
  type RecommendationContext,
  type RecommendationSuggestion
} from "./recommendationEngine";

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  timestamp: Date;
}

export interface OrderState {
  items: OrderItem[];
  total: number;
  restaurantId: string;
  tableNumber?: number;
  customerName?: string;
  notes?: string;
  status: 'building' | 'pending_confirmation' | 'confirmed' | 'cancelled';
}

export class OrderBuilder {
  private state: OrderState;
  private recommendationEngine?: any;
  private restaurant?: any;

  constructor(restaurantId: string, tableNumber?: number, restaurant?: any) {
    this.state = {
      items: [],
      total: 0,
      restaurantId,
      tableNumber,
      status: 'building'
    };
    
    if (restaurant) {
      this.restaurant = restaurant;
      this.recommendationEngine = createRecommendationEngine(restaurant);
    }
  }

  /**
   * Add an item to the order with confirmation
   */
  addItem(item: ParsedOrderItem): PendingAction {
    const orderItem: OrderItem = {
      id: generateActionId(),
      menuItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes,
      timestamp: new Date()
    };

    return createAddToOrderAction(item, this.state.restaurantId, {
      onConfirm: () => {
        this.state.items.push(orderItem);
        this.updateTotal();
      }
    });
  }

  /**
   * Remove an item from the order with confirmation
   */
  removeItem(itemId: string): PendingAction | null {
    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return null;

    return createRemoveFromOrderAction(item.name, item.menuItemId, this.state.restaurantId, {
      onConfirm: () => {
        this.state.items = this.state.items.filter(i => i.id !== itemId);
        this.updateTotal();
      }
    });
  }

  /**
   * Modify the quantity of an existing item
   */
  modifyQuantity(itemId: string, newQuantity: number): PendingAction | null {
    const item = this.state.items.find(i => i.id === itemId);
    if (!item) return null;

    const oldQuantity = item.quantity;
    const priceDifference = (newQuantity - oldQuantity) * item.price;
    
    return createModifyOrderItemAction(
      item.name,
      oldQuantity,
      newQuantity,
      priceDifference,
      this.state.restaurantId,
      {
        onConfirm: () => {
          item.quantity = newQuantity;
          this.updateTotal();
        }
      }
    );
  }

  /**
   * Generate final order confirmation
   */
  generateOrderConfirmation(): PendingAction | null {
    if (this.state.items.length === 0) return null;

    const parsedItems: ParsedOrderItem[] = this.state.items.map(item => ({
      id: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes
    }));

    this.state.status = 'pending_confirmation';

    return createConfirmOrderAction(parsedItems, this.state.total, this.state.restaurantId, {
      onConfirm: () => {
        this.state.status = 'confirmed';
      },
      onDecline: () => {
        this.state.status = 'building';
      }
    });
  }

  /**
   * Get current order state
   */
  getOrderState(): OrderState {
    return { ...this.state };
  }

  /**
   * Get order summary for display
   */
  getOrderSummary(): {
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    itemCount: number;
    total: number;
  } {
    const items = this.state.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    }));

    return {
      items,
      itemCount: this.state.items.reduce((sum, item) => sum + item.quantity, 0),
      total: this.state.total
    };
  }

  /**
   * Find similar items in the order (for upselling)
   */
  findSimilarItems(category: string): OrderItem[] {
    // This would be enhanced with actual menu categorization
    return this.state.items.filter(item => 
      item.name.toLowerCase().includes(category.toLowerCase())
    );
  }

  /**
   * Check if order meets minimum requirements
   */
  isOrderValid(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.state.items.length === 0) {
      issues.push("Order is empty");
    }

    if (this.state.total < 0) {
      issues.push("Invalid order total");
    }

    // Add more validation rules as needed
    const hasMainDish = this.state.items.some(item => 
      !item.name.toLowerCase().includes('drink') && 
      !item.name.toLowerCase().includes('side')
    );

    if (!hasMainDish && this.state.items.length > 0) {
      issues.push("Consider adding a main dish to your order");
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Clear the order
   */
  clearOrder(): void {
    this.state.items = [];
    this.state.total = 0;
    this.state.status = 'building';
    this.state.notes = undefined;
  }

  /**
   * Add notes to the order
   */
  addOrderNotes(notes: string): void {
    this.state.notes = notes;
  }

  /**
   * Generate smart recommendations based on current order
   */
  generateSmartRecommendations(context: {
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    userMessage?: string;
  } = {}): RecommendationSuggestion[] {
    if (!this.recommendationEngine || !this.restaurant) {
      return [];
    }

    const recommendationContext: RecommendationContext = {
      userMessage: context.userMessage || '',
      conversationHistory: context.conversationHistory || [],
      currentOrder: this.state.items.map(item => ({
        id: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      timeOfDay: new Date().toISOString(),
      restaurantId: this.state.restaurantId,
      tableNumber: this.state.tableNumber,
      menuItems: this.restaurant.menuItems || []
    };

    return this.recommendationEngine.generateRecommendations(recommendationContext);
  }

  /**
   * Get a recommendation action for the top suggestion
   */
  getRecommendationAction(context: {
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    userMessage?: string;
  } = {}): PendingAction | null {
    const recommendations = this.generateSmartRecommendations(context);
    
    if (recommendations.length === 0) return null;

    const topRecommendation = recommendations[0];
    
    if (!this.recommendationEngine) return null;

    return this.recommendationEngine.createRecommendationAction(
      topRecommendation,
      this.state.restaurantId,
      this.state.tableNumber
    );
  }

  /**
   * Check if order would benefit from recommendations
   */
  shouldShowRecommendations(): boolean {
    if (this.state.items.length === 0) return false;
    
    const recommendations = this.generateSmartRecommendations();
    return recommendations.length > 0 && recommendations[0].confidence > 0.6;
  }

  /**
   * Update the total price
   */
  private updateTotal(): void {
    this.state.total = this.state.items.reduce(
      (sum, item) => sum + (item.quantity * item.price), 
      0
    );
  }
}

/**
 * Create a new order builder instance
 */
export function createOrderBuilder(restaurantId: string, tableNumber?: number, restaurant?: any): OrderBuilder {
  return new OrderBuilder(restaurantId, tableNumber, restaurant);
}

/**
 * Analyze order for upselling opportunities
 */
export function analyzeOrderForUpselling(orderBuilder: OrderBuilder): {
  suggestions: Array<{
    type: 'drink' | 'side' | 'dessert' | 'upgrade';
    message: string;
    items: string[];
  }>;
} {
  const orderState = orderBuilder.getOrderState();
  const suggestions: Array<{
    type: 'drink' | 'side' | 'dessert' | 'upgrade';
    message: string;
    items: string[];
  }> = [];

  // Check for missing drinks
  const hasDrinks = orderState.items.some(item => 
    item.name.toLowerCase().includes('drink') || 
    item.name.toLowerCase().includes('soda') ||
    item.name.toLowerCase().includes('water') ||
    item.name.toLowerCase().includes('juice')
  );

  if (!hasDrinks && orderState.items.length > 0) {
    suggestions.push({
      type: 'drink',
      message: "Would you like to add a drink to your order?",
      items: ['Soft Drinks', 'Fresh Juices', 'Water']
    });
  }

  // Check for sides with main dishes
  const hasMainDish = orderState.items.some(item => 
    item.name.toLowerCase().includes('pizza') ||
    item.name.toLowerCase().includes('burger') ||
    item.name.toLowerCase().includes('pasta')
  );

  const hasSides = orderState.items.some(item =>
    item.name.toLowerCase().includes('fries') ||
    item.name.toLowerCase().includes('salad') ||
    item.name.toLowerCase().includes('side')
  );

  if (hasMainDish && !hasSides) {
    suggestions.push({
      type: 'side',
      message: "How about adding a side dish to complement your meal?",
      items: ['Caesar Salad', 'Garlic Bread', 'French Fries']
    });
  }

  // Suggest dessert for substantial orders
  if (orderState.total > 25 && !orderState.items.some(item => 
    item.name.toLowerCase().includes('dessert') ||
    item.name.toLowerCase().includes('cake') ||
    item.name.toLowerCase().includes('ice cream')
  )) {
    suggestions.push({
      type: 'dessert',
      message: "Would you like to finish with a delicious dessert?",
      items: ['Chocolate Cake', 'Ice Cream', 'Tiramisu']
    });
  }

  return { suggestions };
} 