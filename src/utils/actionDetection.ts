import type { 
  PendingAction, 
  ActionType,
  ParsedOrderItem
} from "@/types/chatActions";
import {
  createAddToOrderAction,
  createRemoveFromOrderAction,
  createConfirmOrderAction,
  createClarificationAction,
  createRecommendationAction,
  createOrderCheckAction,
  createOrderEditAction,
  generateActionId
} from "@/types/chatActions";

/**
 * Detects if an AI message contains intent to take an action
 * This analyzes the assistant's response to determine if it wants to do something
 */
export function detectActionIntent(
  aiMessage: string, 
  context: {
    restaurantId: string;
    tableNumber?: number;
    menuItems?: any[];
    conversationHistory?: any[];
  }
): PendingAction | null {
  
  const message = aiMessage.toLowerCase();
  
  // Detect order confirmation intent
  if (detectOrderConfirmationIntent(message)) {
    return detectOrderFromMessage(aiMessage, context);
  }
  
  // Detect add to order intent
  if (detectAddToOrderIntent(message)) {
    return detectAddItemFromMessage(aiMessage, context);
  }
  
  // Detect remove from order intent
  if (detectRemoveFromOrderIntent(message)) {
    return detectRemoveItemFromMessage(aiMessage, context);
  }
  
  // Detect clarification request intent
  if (detectClarificationIntent(message)) {
    return detectClarificationFromMessage(aiMessage, context);
  }
  
  // Detect recommendation intent
  if (detectRecommendationIntent(message)) {
    return detectRecommendationFromMessage(aiMessage, context);
  }
  
  // Detect order checking intent
  if (detectOrderCheckingIntent(message)) {
    return detectOrderCheckingFromMessage(aiMessage, context);
  }
  
  // Detect specific order editing intent (e.g., "add salad to order #ABC123")
  if (detectSpecificOrderEditingIntent(message)) {
    return detectSpecificOrderEditingFromMessage(aiMessage, context);
  }
  
  // Detect general order editing intent
  if (detectOrderEditingIntent(message)) {
    return detectOrderEditingFromMessage(aiMessage, context);
  }
  
  return null;
}

/**
 * Detect actions from USER messages (different patterns than AI messages)
 */
export function detectUserActionIntent(
  userMessage: string, 
  context: {
    restaurantId: string;
    tableNumber?: number;
    menuItems?: any[];
    conversationHistory?: any[];
    currentOrderId?: string | null;
  }
): PendingAction | null {
  
  const message = userMessage.toLowerCase().trim();
  
  // Detect specific order editing intent first (most specific)
  if (detectSpecificOrderEditingIntent(message)) {
    return detectSpecificOrderEditingFromMessage(userMessage, context);
  }
  
  // Detect general order editing intent
  if (detectOrderEditingIntent(message)) {
    return detectOrderEditingFromMessage(userMessage, context);
  }
  
  // Detect order checking intent
  if (detectOrderCheckingIntent(message)) {
    return detectOrderCheckingFromMessage(userMessage, context);
  }
  return null;
}

/**
 * Generate natural confirmation messages based on action type and context
 */
export function generateConfirmationMessage(action: PendingAction): string {
  switch (action.type) {
    case 'ADD_TO_ORDER':
      const item = action.data.item as ParsedOrderItem;
      return `Add ${item.quantity}x ${item.name} ($${item.price.toFixed(2)} each) to your order?`;
      
    case 'REMOVE_FROM_ORDER':
      const removeItem = action.data.item as ParsedOrderItem;
      return `Remove ${removeItem.name} from your order? This will reduce your total by $${(removeItem.price * removeItem.quantity).toFixed(2)}.`;
      
    case 'CONFIRM_ORDER':
      const items = action.data.items as ParsedOrderItem[];
      const total = action.data.total as number;
      return `I'll place this order for you:\n\n${items.map(i => 
        `• ${i.quantity}x ${i.name} - $${(i.price * i.quantity).toFixed(2)}`
      ).join('\n')}\n\nTotal: $${total.toFixed(2)}\n\nShall I place this order?`;
      
    case 'REQUEST_CLARIFICATION':
      return `I found several options for "${action.data.originalRequest}". Which one did you mean?`;
      
    case 'REQUEST_RECOMMENDATION':
      return `Based on your preferences, would you like me to recommend some dishes?`;
      
    case 'EDIT_ORDER':
      return `I'll show you your current orders so you can edit them. You can modify quantities, remove items, or cancel orders that haven't started cooking yet.`;
      
    case 'SPECIFIC_ORDER_EDIT':
      const orderId = action.data.orderId;
      const editAction = action.data.editAction || 'edit';
      
      switch (editAction) {
        case 'cancel_order':
          return `Cancel order #${orderId}? This will remove the entire order and refund your payment.`;
        case 'modify_quantity':
          const newQty = action.data.newQuantity;
          const itemName = action.data.itemName;
          return `Change ${itemName} quantity to ${newQty} in order #${orderId}?`;
        case 'remove_item':
          const itemToRemove = action.data.itemName;
          return `Remove ${itemToRemove} from order #${orderId}?`;
        case 'add_item':
          return `Add items to order #${orderId}? I'll show you the menu to select from.`;
        default:
          return `Edit order #${orderId}? I'll show you the order details so you can make changes.`;
      }
      
    case 'MODIFY_ORDER_ITEM':
      const beforeAfter = action.data.beforeAfter;
      if (beforeAfter) {
        const { before, after } = beforeAfter;
        const priceDiff = after.total - before.total;
        const diffText = priceDiff > 0 ? `+$${priceDiff.toFixed(2)}` : 
                        priceDiff < 0 ? `-$${Math.abs(priceDiff).toFixed(2)}` : 
                        'no change';
        return `Update your order? This will change your total by ${diffText}.`;
      }
      return `Update your order with these changes?`;
      
    default:
      return action.confirmationMessage || "Would you like me to proceed with this action?";
  }
}

/**
 * Generate action buttons based on action type
 */
export function generateActionButtons(action: PendingAction): Array<{
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
  action: 'confirm' | 'decline' | 'modify' | 'custom';
}> {
  const baseButtons = [
    {
      id: `confirm_${action.id}`,
      label: "✅ Yes, do it",
      variant: 'success' as const,
      action: 'confirm' as const,
    },
    {
      id: `decline_${action.id}`,
      label: "❌ No, don't",
      variant: 'danger' as const,
      action: 'decline' as const,
    }
  ];

  // Add action-specific buttons
  switch (action.type) {
    case 'ADD_TO_ORDER':
      return [
        {
          id: `confirm_${action.id}`,
          label: "✅ Add to Order",
          variant: 'success' as const,
          action: 'confirm' as const,
        },
        {
          id: `decline_${action.id}`,
          label: "❌ No Thanks",
          variant: 'danger' as const,
          action: 'decline' as const,
        },
        {
          id: `alternatives_${action.id}`,
          label: "🔄 Show alternatives",
          variant: 'secondary' as const,
          action: 'custom' as const,
        }
      ];
      
    case 'CONFIRM_ORDER':
      return [
        {
          id: `confirm_${action.id}`,
          label: "🍽️ Place Order",
          variant: 'success' as const,
          action: 'confirm' as const,
        },
        {
          id: `modify_${action.id}`,
          label: "✏️ Modify Order",
          variant: 'secondary' as const,
          action: 'modify' as const,
        },
        {
          id: `decline_${action.id}`,
          label: "❌ Cancel",
          variant: 'danger' as const,
          action: 'decline' as const,
        }
      ];
      
    case 'EDIT_ORDER':
      return [
        {
          id: `confirm_${action.id}`,
          label: "✏️ Show My Orders",
          variant: 'primary' as const,
          action: 'confirm' as const,
        },
        {
          id: `decline_${action.id}`,
          label: "❌ Never Mind",
          variant: 'secondary' as const,
          action: 'decline' as const,
        }
      ];
      
    case 'SPECIFIC_ORDER_EDIT':
      const editAction = action.data.editAction || 'edit';
      
      switch (editAction) {
        case 'cancel_order':
          return [
            {
              id: `confirm_${action.id}`,
              label: "🗑️ Yes, Cancel Order",
              variant: 'danger' as const,
              action: 'confirm' as const,
            },
            {
              id: `decline_${action.id}`,
              label: "↩️ Keep Order",
              variant: 'success' as const,
              action: 'decline' as const,
            }
          ];
        case 'modify_quantity':
        case 'remove_item':
          return [
            {
              id: `confirm_${action.id}`,
              label: "✅ Make Change",
              variant: 'success' as const,
              action: 'confirm' as const,
            },
            {
              id: `decline_${action.id}`,
              label: "❌ Keep Original",
              variant: 'secondary' as const,
              action: 'decline' as const,
            }
          ];
        default:
          return [
            {
              id: `confirm_${action.id}`,
              label: "✏️ Edit This Order",
              variant: 'primary' as const,
              action: 'confirm' as const,
            },
            {
              id: `decline_${action.id}`,
              label: "← Back to Orders",
              variant: 'secondary' as const,
              action: 'decline' as const,
            }
          ];
      }
      
    case 'MODIFY_ORDER_ITEM':
      return [
        {
          id: `confirm_${action.id}`,
          label: "✅ Save Changes",
          variant: 'success' as const,
          action: 'confirm' as const,
        },
        {
          id: `decline_${action.id}`,
          label: "❌ Cancel Changes",
          variant: 'secondary' as const,
          action: 'decline' as const,
        }
      ];
      
    case 'REQUEST_CLARIFICATION':
      // For clarification, show the options as buttons
      const options = action.data.options || [];
      return options.map((opt: any, index: number) => ({
        id: `option_${action.id}_${index}`,
        label: opt.name || opt.label || opt.toString(),
        variant: 'primary' as const,
        action: 'custom' as const,
      }));
      
    default:
      return baseButtons;
  }
}

// Helper functions for intent detection

function detectOrderConfirmationIntent(message: string): boolean {
  const confirmationPatterns = [
    /i'll place.*order/,
    /shall i place/,
    /ready to order/,
    /confirm.*order/,
    /total.*\$[\d.]+/,
    /place.*order.*for you/
  ];
  
  return confirmationPatterns.some(pattern => pattern.test(message));
}

function detectAddToOrderIntent(message: string): boolean {
  const addPatterns = [
    /i'll add/,
    /add.*to.*order/,
    /shall i add/,
    /would you like.*add/,
    /adding.*to.*order/
  ];
  
  return addPatterns.some(pattern => pattern.test(message));
}

function detectRemoveFromOrderIntent(message: string): boolean {
  const removePatterns = [
    /remove.*from.*order/,
    /shall i remove/,
    /take.*off.*order/,
    /delete.*from.*order/
  ];
  
  return removePatterns.some(pattern => pattern.test(message));
}

function detectClarificationIntent(message: string): boolean {
  const clarificationPatterns = [
    /which.*did you mean/,
    /found.*options/,
    /which one/,
    /clarify/,
    /multiple.*choices/
  ];
  
  return clarificationPatterns.some(pattern => pattern.test(message));
}

function detectRecommendationIntent(message: string): boolean {
  const recommendationPatterns = [
    /would you like.*recommend/,
    /i recommend/,
    /suggest/,
    /popular.*items/,
    /chef.*special/
  ];
  
  return recommendationPatterns.some(pattern => pattern.test(message));
}

function detectOrderCheckingIntent(message: string): boolean {
  const checkingPatterns = [
    /check.*order/,
    /show.*order/,
    /recent.*order/,
    /my.*order/,
    /order.*status/,
    /what.*ordered/,
    /order.*history/
  ];
  
  return checkingPatterns.some(pattern => pattern.test(message));
}

function detectOrderEditingIntent(message: string): boolean {
  const editingPatterns = [
    // Natural language patterns for order editing
    /\b(change|modify|edit|update|alter)\s+(my\s+)?order\b/i,
    /\b(cancel|remove|delete)\s+(my\s+)?order\b/i,
    /\b(remove|delete)\s+.+\s+from\s+(my\s+)?order\b/i,
    /\b(add|include)\s+.+\s+to\s+(my\s+)?order\b/i,
    
    // Question patterns
    /\bcan\s+(i|we)\s+(modify|change|edit|update|cancel)\b/i,
    /\bis\s+it\s+possible\s+to\s+(modify|change|edit|update|cancel)\b/i,
    /\bhow\s+(do|can)\s+i\s+(modify|change|edit|update|cancel)\b/i,
    
    // Specific editing requests
    /\bi\s+(want|need|would\s+like)\s+to\s+(modify|change|edit|update|cancel)\b/i,
    /\blet\s+me\s+(modify|change|edit|update|cancel)\b/i,
    /\bplease\s+(modify|change|edit|update|cancel)\b/i,
    
    // Mistake corrections
    /\bactually\s+(i|we)\s+(want|need|would\s+like)\b/i,
    /\bwait\s*,?\s*(i|we)\s+(want|need|would\s+like)\b/i,
    /\bsorry\s*,?\s*(i|we)\s+(want|need|would\s+like)\b/i,
    /\bmistake\b/i,
    /\bwrong\b/i,
    
    // Order status inquiries that might lead to editing
    /\bwhat\s+(is|are)\s+(in\s+)?my\s+order\b/i,
    /\bshow\s+(me\s+)?my\s+order\b/i,
    /\bcheck\s+my\s+order\b/i
  ];
  
  return editingPatterns.some(pattern => pattern.test(message));
}

function detectSpecificOrderEditingIntent(message: string): boolean {
  const trimmedMessage = message.trim().toLowerCase();
  
  // CRITICAL FIX: Don't trigger order editing on new order intents
  // Check if this is clearly a NEW order request first
  const newOrderPatterns = [
    /\b(i want|i'd like|i'll have|can i get|give me|i'll take|order)\s+\d+/i,
    /\b(want|like|have|get|take)\s+\d+/i,
    /^(give me|i want|i'd like)\s+/i,
    /^(let me have|let's get|let's have)\s+/i,
  ];
  
  // If this matches a new order pattern, DON'T treat as order editing
  if (newOrderPatterns.some(pattern => pattern.test(trimmedMessage))) {
    return false;
  }
  
  const specificEditingPatterns = [
    // Direct order references with # (most specific)
    /\b(edit|modify|change|update|cancel|add\s+to|remove\s+from)\s+order\s*#[a-z0-9]+/i,
    /\border\s*#[a-z0-9]+\s*(edit|modify|change|update|cancel|add|remove)/i,
    /#[a-z0-9]+\s*(edit|modify|change|update|cancel|add|remove)/i,
    
    // Order selection patterns (user selecting from a list)
    /\b(this|that|the\s+first|the\s+second|the\s+third)\s+one\b/i,
    /\b(select|choose|pick)\s+(this|that|order|#[a-z0-9]+)/i,
    /\border\s+(this|that|#[a-z0-9]+)/i,
    
    // Bare order IDs (exactly 6 characters) - user typed order ID
    /^[a-z0-9]{6}$/i,
    /^\s*#[a-z0-9]{6}\s*$/i,
    
    // Cancel patterns with order references
    /\b(cancel|remove|delete)\s+(order\s+)?#?[a-z0-9]{6}/i,
    /\b(don't\s+want|no\s+longer\s+want)\s+(order\s+)?#?[a-z0-9]{6}/i,
    
    // Context-dependent editing patterns (ONLY in editing context)
    /\b(actually|wait|sorry|mistake|wrong)\b.*\b(order|change|modify|cancel)/i,
    /\bi\s+(changed\s+my\s+mind|made\s+a\s+mistake|want\s+to\s+change)/i,
    
    // Natural editing requests (when no new order detected)
    /\b(remove|delete)\s+.+\s+from\s+(my\s+|the\s+)?order\b/i,
    /\b(add|include)\s+.+\s+to\s+(my\s+|the\s+)?order\b/i,
    /\b(change|modify|update)\s+(my\s+|the\s+)?order\b/i,
    /\bcan\s+you\s+(change|modify|update|edit)\b/i,
    
    // Quantity modification patterns (when context suggests editing)
    /\b(make\s+it|change\s+to|instead\s+of)\s+\d+/i,
    /\b(more|less|fewer)\s+(of\s+)?(that|this|the)/i,
    
    // REMOVED problematic patterns that were catching new orders:
    // These patterns now only trigger when we have clear editing context
  ];
  
  return specificEditingPatterns.some(pattern => pattern.test(trimmedMessage));
}

// Helper functions to extract action data from messages

function detectOrderFromMessage(message: string, context: any): PendingAction | null {
  // Extract order items from the message using the enhanced orderParsing utilities
  const items = extractItemsFromMessage(message, context.menuItems || []);
  
  console.log("🔍 detectOrderFromMessage - Extracted items:", JSON.stringify(items, null, 2));
  console.log("🔍 detectOrderFromMessage - Menu items available:", context.menuItems?.length || 0);
  
  if (items.length > 0) {
    // Use the proper order confirmation action that maps menu items correctly
    // Note: extractItemsFromMessage returns items with full menu item data including IDs
    // So we can create the action directly
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const action = createConfirmOrderAction(items, total, context.restaurantId);
    console.log("🔍 detectOrderFromMessage - Created action:", JSON.stringify(action, null, 2));
    return action;
  }
  
  return null;
}

function detectAddItemFromMessage(message: string, context: any): PendingAction | null {
  // Extract the item being added
  const items = extractItemsFromMessage(message, context.menuItems || []);
  
  console.log("🔍 detectAddItemFromMessage - Extracted items:", JSON.stringify(items, null, 2));
  
  if (items.length === 1 && items[0]) {
    const action = createAddToOrderAction(items[0], context.restaurantId);
    console.log("🔍 detectAddItemFromMessage - Created action:", JSON.stringify(action, null, 2));
    return action;
  }
  
  return null;
}

function detectRemoveItemFromMessage(message: string, context: any): PendingAction | null {
  // Extract the item being removed
  // This would analyze the message to find which item to remove
  // For now, return null - implement in Stage 3
  return null;
}

function detectClarificationFromMessage(message: string, context: any): PendingAction | null {
  // Extract clarification options from the message
  // This would parse options presented to the user
  // For now, return null - implement in Stage 3
  return null;
}

function detectRecommendationFromMessage(message: string, context: any): PendingAction | null {
  // Extract recommendation context
  // This would analyze what type of recommendations are being offered
  // For now, return null - implement in Stage 4
  return null;
}

function detectOrderCheckingFromMessage(message: string, context: any): PendingAction | null {
  // Create an action to check recent orders
  return createOrderCheckAction(context.restaurantId, context.tableNumber);
}

function detectOrderEditingFromMessage(message: string, context: any): PendingAction | null {
  // Create an action to show order editing options
  return createOrderEditAction(context.restaurantId, context.tableNumber);
}

function detectSpecificOrderEditingFromMessage(message: string, context: any): PendingAction | null {
  const trimmedMessage = message.trim();
  
  // Extract order ID from message (with or without # symbol)
  let orderId: string | null = null;
  
  // Try different patterns to extract order ID
  let orderIdMatch = trimmedMessage.match(/#([a-z0-9]{6})/i);
  if (orderIdMatch) {
    orderId = orderIdMatch[1].toUpperCase();
  } else {
    // Try to find 6-character alphanumeric sequences
    const bareIdMatch = trimmedMessage.match(/\b([a-z0-9]{6})\b/i);
    if (bareIdMatch) {
      orderId = bareIdMatch[1].toUpperCase();
    } else if (/^[a-z0-9]{6}$/i.test(trimmedMessage)) {
      // Handle when the entire message is just an order ID
      orderId = trimmedMessage.toUpperCase();
    } else if (context.currentOrderId) {
      // Use context if we're in an order editing session
      orderId = context.currentOrderId;
    }
  }
  
  if (!orderId) {
    // If no order ID found in message but we have context, this might be a context-dependent action
    if (context.currentOrderId && (actionType === 'remove_item' || actionType === 'add_item' || actionType === 'modify_quantity')) {
      orderId = context.currentOrderId.slice(-6).toUpperCase(); // Use short ID for display
    } else {
      return null;
    }
  }
  
  // Determine the action type
  let actionType: 'add_item' | 'remove_item' | 'modify_quantity' | 'cancel_order' | 'select_order' = 'select_order';
  
  if (/cancel/i.test(trimmedMessage)) {
    actionType = 'cancel_order';
  } else if (/remove|delete/i.test(trimmedMessage)) {
    actionType = 'remove_item';
  } else if (/change.*quantity|modify.*quantity|\d+.*of/i.test(trimmedMessage)) {
    actionType = 'modify_quantity';
  } else if (/add/i.test(trimmedMessage)) {
    actionType = 'add_item';
  } else if (/edit.*order|this one|that one/i.test(trimmedMessage)) {
    // Selecting/editing an order
    actionType = 'select_order';
  } else if (/^[a-z0-9]{6}$/i.test(trimmedMessage)) {
    // Just an order ID by itself
    actionType = 'select_order';
  }
  
  // Extract item information if it's an add/remove/modify action
  let itemData = null;
  if (actionType !== 'cancel_order' && actionType !== 'select_order') {
    // Try to extract item name and quantity - multiple patterns
    let itemMatch = trimmedMessage.match(/(\d+)\s*([a-zA-Z\s]*(?:pizza|salad|burger|drink|appetizer|dessert|sandwich|pasta|soup|wings)s?)/i);
    
    if (!itemMatch) {
      // Try pattern with "remove X Y" or "add X Y"
      itemMatch = trimmedMessage.match(/(?:remove|add|delete)\s+(\d+)?\s*([a-zA-Z\s]+(?:pizza|salad|burger|drink|appetizer|dessert|sandwich|pasta|soup|wings)s?)/i);
    }
    
    if (!itemMatch) {
      // Try general pattern
      itemMatch = trimmedMessage.match(/(\d+)?\s*([a-zA-Z\s]+(?:pizza|salad|burger|drink|appetizer|dessert|sandwich|pasta|soup|wings)s?)/i);
    }
    
    if (itemMatch) {
      let quantity = 1;
      let name = itemMatch[2] ? itemMatch[2].trim() : '';
      
      // Extract quantity
      if (itemMatch[1]) {
        quantity = parseInt(itemMatch[1]);
      } else {
        // Look for quantity elsewhere in the message
        const quantityMatch = trimmedMessage.match(/(\d+)/);
        if (quantityMatch) {
          quantity = parseInt(quantityMatch[1]);
        }
      }
      
      // Clean up the name (remove plural 's' if present)
      name = name.replace(/s$/, '');
      
      itemData = {
        name: name,
        quantity: quantity
      };
    } else if (actionType === 'remove_item') {
      // Try to extract "the X" pattern
      const theItemMatch = trimmedMessage.match(/the\s+([a-zA-Z\s]+(?:pizza|salad|burger|drink|appetizer|dessert|sandwich|pasta|soup|wings))/i);
      if (theItemMatch) {
        itemData = {
          name: theItemMatch[1].trim(),
          quantity: 1
        };
      }
    }
  }
  
  // Generate appropriate confirmation message
  let confirmationMessage = '';
  let description = '';
  
  switch (actionType) {
    case 'select_order':
      confirmationMessage = `You've selected order #${orderId}. What would you like to do with this order?`;
      description = `Select order #${orderId}`;
      break;
    case 'cancel_order':
      confirmationMessage = `Are you sure you want to cancel order #${orderId}?`;
      description = `Cancel order #${orderId}`;
      break;
    case 'remove_item':
      if (itemData) {
        confirmationMessage = `Remove ${itemData.name} from order #${orderId}?`;
        description = `Remove ${itemData.name} from order #${orderId}`;
      } else {
        confirmationMessage = `What item would you like to remove from order #${orderId}?`;
        description = `Remove item from order #${orderId}`;
      }
      break;
    case 'add_item':
      if (itemData) {
        confirmationMessage = `Add ${itemData.quantity}x ${itemData.name} to order #${orderId}?`;
        description = `Add ${itemData.quantity}x ${itemData.name} to order #${orderId}`;
      } else {
        confirmationMessage = `What item would you like to add to order #${orderId}?`;
        description = `Add item to order #${orderId}`;
      }
      break;
    case 'modify_quantity':
      confirmationMessage = `What quantity changes would you like to make to order #${orderId}?`;
      description = `Modify quantities in order #${orderId}`;
      break;
    default:
      confirmationMessage = `Modify order #${orderId}?`;
      description = `Modify order #${orderId}`;
  }
  
  return {
    id: generateActionId(),
    type: 'SPECIFIC_ORDER_EDIT',
    description,
    data: { 
      orderId, 
      actionType, 
      itemData,
      originalMessage: trimmedMessage,
      context 
    },
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage,
    fallbackOptions: ['show_order_details', 'cancel_action']
  };
}

// Enhanced item extraction with quantity parsing
function extractItemsFromMessage(message: string, menuItems: any[]): ParsedOrderItem[] {
  const items: ParsedOrderItem[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Enhanced pattern matching with quantity extraction
  for (const menuItem of menuItems) {
    const itemName = menuItem.name.toLowerCase();
    if (lowerMessage.includes(itemName)) {
      // Extract quantity from patterns like "2 caesar salads", "two caesar salads", etc.
      let quantity = 1; // Default quantity
      
      // Look for number patterns before the item name
      const quantityPatterns = [
        // Numeric patterns: "2 caesar salad", "10 pizza"
        new RegExp(`(\\d+)\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
        // Word patterns: "two caesar salad", "three pizza"
        new RegExp(`(one|two|three|four|five|six|seven|eight|nine|ten)\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
        // Plural patterns: "caesar salads" (implies 2+)
        new RegExp(`${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s`, 'i')
      ];
      
      // Check numeric patterns
      const numericMatch = quantityPatterns[0].exec(lowerMessage);
      if (numericMatch) {
        quantity = parseInt(numericMatch[1], 10);
      } else {
        // Check word patterns
        const wordMatch = quantityPatterns[1].exec(lowerMessage);
        if (wordMatch) {
          const wordToNumber: { [key: string]: number } = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          quantity = wordToNumber[wordMatch[1]] || 1;
        } else {
          // Check for plural form (implies at least 2)
          const pluralMatch = quantityPatterns[2].exec(lowerMessage);
          if (pluralMatch) {
            quantity = 2; // Default for plural
          }
        }
      }
      
      items.push({
        id: menuItem.id,
        name: menuItem.name,
        quantity: quantity,
        price: Number(menuItem.price),
        notes: undefined,
      });
    }
  }
  
  return items;
}

/**
 * Check if a user message is responding to a pending action
 */
export function isActionResponse(userMessage: string): boolean {
  const message = userMessage.toLowerCase().trim();
  
  // Positive responses
  const positiveResponses = [
    'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'do it', 
    'go ahead', 'proceed', 'confirm', 'add it', 'place it'
  ];
  
  // Negative responses
  const negativeResponses = [
    'no', 'nah', 'nope', 'don\'t', 'cancel', 'stop', 
    'decline', 'skip', 'not now'
  ];
  
  return [...positiveResponses, ...negativeResponses].some(response => 
    message === response || message.includes(response)
  );
}

/**
 * Determine if user response is positive (confirming) or negative (declining)
 */
export function isPositiveResponse(userMessage: string): boolean {
  const message = userMessage.toLowerCase().trim();
  
  const positiveResponses = [
    'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'do it', 
    'go ahead', 'proceed', 'confirm', 'add it', 'place it'
  ];
  
  return positiveResponses.some(response => 
    message === response || message.includes(response)
  );
} 