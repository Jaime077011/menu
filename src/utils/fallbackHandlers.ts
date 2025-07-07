import { 
  type PendingAction, 
  type ActionType,
  type ParsedOrderItem,
  createRecommendationAction,
  createClarificationAction,
  generateActionId
} from "@/types/chatActions";
import { createRecommendationEngine } from "./recommendationEngine";

export interface FallbackResponse {
  message: string;
  alternatives: PendingAction[];
  suggestedActions?: string[];
  helpfulTips?: string[];
}

export interface ErrorRecoveryOptions {
  restaurant: any;
  currentOrder?: ParsedOrderItem[];
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage?: string;
  tableNumber?: number;
}

/**
 * Handle order action rejections with contextual alternatives
 */
export function handleOrderRejection(
  rejectedAction: PendingAction, 
  options: ErrorRecoveryOptions
): FallbackResponse {
  const { restaurant, currentOrder = [], conversationHistory = [] } = options;

  switch (rejectedAction.type) {
    case 'ADD_TO_ORDER':
      return handleAddToOrderRejection(rejectedAction, options);
      
    case 'REMOVE_FROM_ORDER':
      return handleRemoveFromOrderRejection(rejectedAction, options);
      
    case 'MODIFY_ORDER_ITEM':
      return handleModifyOrderRejection(rejectedAction, options);
      
    case 'CONFIRM_ORDER':
      return handleConfirmOrderRejection(rejectedAction, options);
      
    case 'CANCEL_ORDER':
      return handleCancelOrderRejection(rejectedAction, options);
      
    default:
      return handleGenericRejection(rejectedAction, options);
  }
}

/**
 * Handle "Add to Order" rejections
 */
function handleAddToOrderRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  const { restaurant, currentOrder = [] } = options;
  const rejectedItem = rejectedAction.data?.item;
  
  if (!rejectedItem) {
    return {
      message: "No problem! Would you like me to suggest something else from our menu?",
      alternatives: [],
      suggestedActions: ["Browse menu", "Get recommendations", "See popular items"]
    };
  }

  // Find similar items
  const similarItems = findSimilarItems(rejectedItem, restaurant.menuItems);
  const alternatives: PendingAction[] = [];

  if (similarItems.length > 0) {
    // Create recommendation action for similar items
    alternatives.push(createRecommendationAction(
      similarItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        reason: "Similar to what you were considering"
      })),
      `How about these alternatives to ${rejectedItem.name}?`,
      restaurant.id,
      options.tableNumber
    ));
  }

  // Get complementary recommendations if there's already an order
  if (currentOrder.length > 0) {
    try {
      const recommendationEngine = createRecommendationEngine(restaurant);
      const recommendations = recommendationEngine.generateRecommendations({
        userMessage: options.userMessage || '',
        conversationHistory: options.conversationHistory || [],
        currentOrder,
        timeOfDay: new Date().toISOString(),
        restaurantId: restaurant.id,
        tableNumber: options.tableNumber,
        menuItems: restaurant.menuItems
      });

      if (recommendations.length > 0) {
        alternatives.push(recommendationEngine.createRecommendationAction(
          recommendations[0],
          restaurant.id,
          options.tableNumber
        ));
      }
    } catch (error) {
      console.warn("Failed to generate fallback recommendations:", error);
    }
  }

  return {
    message: `No problem! Would you like me to suggest something similar to ${rejectedItem.name}, or would you prefer to browse other options?`,
    alternatives,
    suggestedActions: [
      "Show similar items",
      "Browse other categories", 
      "Get personalized recommendations",
      "See what's popular"
    ],
    helpfulTips: [
      "You can always ask me about ingredients or dietary options",
      "I can recommend items based on your preferences"
    ]
  };
}

/**
 * Handle "Remove from Order" rejections
 */
function handleRemoveFromOrderRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  const itemName = rejectedAction.data?.itemName || "item";
  
  return {
    message: `Alright, I'll keep the ${itemName} in your order. Is there anything else you'd like to modify?`,
    alternatives: [],
    suggestedActions: [
      "Modify quantities",
      "Add more items",
      "Review current order",
      "Proceed to checkout"
    ],
    helpfulTips: [
      "You can change quantities instead of removing items completely",
      "I can suggest sides or drinks to go with your order"
    ]
  };
}

/**
 * Handle "Modify Order Item" rejections
 */
function handleModifyOrderRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  const { itemName, oldQuantity } = rejectedAction.data || {};
  
  return {
    message: `Got it, I'll leave the ${itemName || "item"} quantity at ${oldQuantity || "the original amount"}. Would you like to change anything else about your order?`,
    alternatives: [],
    suggestedActions: [
      "Modify other items",
      "Add more items",
      "Remove items",
      "Review order summary"
    ],
    helpfulTips: [
      "You can modify multiple items at once",
      "Let me know if you want to try a different quantity"
    ]
  };
}

/**
 * Handle "Confirm Order" rejections
 */
function handleConfirmOrderRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  const { restaurant, currentOrder = [] } = options;
  const alternatives: PendingAction[] = [];

  // Suggest modifications if there are items in the order
  if (currentOrder.length > 0) {
    // Create clarification action for what they'd like to do
    alternatives.push(createClarificationAction(
      "modify your order",
      [
        { name: "Add more items", action: "add_items" },
        { name: "Remove items", action: "remove_items" },
        { name: "Change quantities", action: "modify_quantities" },
        { name: "Start over", action: "clear_order" }
      ],
      restaurant.id,
      options.tableNumber
    ));
  }

  return {
    message: "That's perfectly fine! Would you like to add more items, modify something, or would you prefer to start over?",
    alternatives,
    suggestedActions: [
      "Add more items",
      "Modify quantities", 
      "Remove items",
      "Start fresh",
      "Get recommendations"
    ],
    helpfulTips: [
      "Take your time to get your order just right",
      "I can suggest popular combinations",
      "You can always ask about ingredients or preparation"
    ]
  };
}

/**
 * Handle "Cancel Order" rejections
 */
function handleCancelOrderRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  return {
    message: "No worries! Your order is still active. What would you like to do next?",
    alternatives: [],
    suggestedActions: [
      "Continue with current order",
      "Add more items",
      "Modify existing items",
      "Review order summary"
    ],
    helpfulTips: [
      "Your order is safe and ready when you are",
      "I'm here to help with any changes you need"
    ]
  };
}

/**
 * Handle generic rejections
 */
function handleGenericRejection(
  rejectedAction: PendingAction,
  options: ErrorRecoveryOptions
): FallbackResponse {
  return {
    message: "No problem! What would you like to do instead?",
    alternatives: [],
    suggestedActions: [
      "Browse menu",
      "Get recommendations",
      "Start over",
      "Ask questions"
    ],
    helpfulTips: [
      "I'm here to help with whatever you need",
      "Feel free to ask me about our menu or specials"
    ]
  };
}

/**
 * Handle system errors with graceful degradation
 */
export function handleSystemError(
  error: Error,
  context: {
    action?: string;
    restaurant?: any;
    userMessage?: string;
  }
): FallbackResponse {
  console.error("System error:", error);

  // Determine error type and provide appropriate fallback
  if (error.message.includes("network") || error.message.includes("fetch")) {
    return {
      message: "I'm having trouble connecting right now. You can still browse our menu or try again in a moment.",
      alternatives: [],
      suggestedActions: [
        "Try again",
        "Browse menu offline",
        "Call restaurant directly"
      ],
      helpfulTips: [
        "Your order progress is saved",
        "You can continue once connection is restored"
      ]
    };
  }

  if (error.message.includes("timeout")) {
    return {
      message: "That's taking longer than expected. Let me try a simpler approach for you.",
      alternatives: [],
      suggestedActions: [
        "Try again",
        "Use basic ordering",
        "Speak with staff"
      ],
      helpfulTips: [
        "Sometimes a quick retry works",
        "I can help you order manually if needed"
      ]
    };
  }

  if (error.message.includes("validation")) {
    return {
      message: "There seems to be an issue with that request. Could you try rephrasing or choosing from our menu?",
      alternatives: [],
      suggestedActions: [
        "Rephrase request",
        "Browse menu",
        "Ask for help"
      ],
      helpfulTips: [
        "Try being more specific about what you want",
        "I can guide you through the ordering process"
      ]
    };
  }

  // Generic system error
  return {
    message: "I encountered an unexpected issue, but I'm still here to help! What would you like to try?",
    alternatives: [],
    suggestedActions: [
      "Try again",
      "Browse menu",
      "Start over",
      "Get help"
    ],
    helpfulTips: [
      "Most issues resolve quickly",
      "I can always help you order manually"
    ]
  };
}

// Note: createClarificationAction is imported from @/types/chatActions

/**
 * Find similar menu items based on name, category, or description
 */
function findSimilarItems(
  targetItem: ParsedOrderItem,
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
  }>
): Array<{ id: string; name: string; price: number }> {
  const targetName = targetItem.name.toLowerCase();
  const targetWords = targetName.split(' ');

  return menuItems
    .filter(item => item.id !== targetItem.id)
    .map(item => {
      let similarity = 0;
      const itemName = item.name.toLowerCase();
      const itemWords = itemName.split(' ');

      // Check for word matches
      targetWords.forEach(word => {
        if (itemName.includes(word)) {
          similarity += 2;
        }
      });

      // Check for category similarity (if available)
      if (item.category && targetItem.name.toLowerCase().includes(item.category.toLowerCase())) {
        similarity += 1;
      }

      return { ...item, similarity };
    })
    .filter(item => item.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(item => ({
      id: item.id,
      name: item.name,
      price: item.price
    }));
}

/**
 * Recovery strategies for different error types
 */
export const ERROR_RECOVERY_STRATEGIES = {
  NETWORK_ERROR: {
    message: "Connection issue detected. Switching to offline mode.",
    actions: ["retry", "offline_mode", "manual_order"]
  },
  VALIDATION_ERROR: {
    message: "Input validation failed. Please try a different approach.",
    actions: ["rephrase", "menu_browse", "guided_order"]
  },
  TIMEOUT_ERROR: {
    message: "Request timed out. Trying simpler approach.",
    actions: ["retry_simple", "manual_fallback", "direct_order"]
  },
  PERMISSION_ERROR: {
    message: "Access denied. Please check your session.",
    actions: ["refresh_session", "guest_mode", "contact_support"]
  }
} as const;

/**
 * Generate helpful error messages based on context
 */
export function generateContextualErrorMessage(
  errorType: keyof typeof ERROR_RECOVERY_STRATEGIES,
  context: string
): string {
  const strategy = ERROR_RECOVERY_STRATEGIES[errorType];
  return `${strategy.message} Context: ${context}`;
} 