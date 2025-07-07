export type ActionType = 
  | 'ADD_TO_ORDER'
  | 'ADD_ITEM_TO_ORDER'
  | 'REMOVE_FROM_ORDER' 
  | 'REMOVE_ITEM_FROM_ORDER'
  | 'MODIFY_ORDER_ITEM'
  | 'CONFIRM_ORDER'
  | 'CANCEL_ORDER'
  | 'REQUEST_RECOMMENDATION'
  | 'BOOK_TABLE'
  | 'SPECIAL_REQUEST'
  | 'REQUEST_CLARIFICATION'
  | 'CHECK_ORDERS'
  | 'EDIT_ORDER'
  | 'SPECIFIC_ORDER_EDIT'
  | 'EXPLAIN_ORDER_LOCKED'
  | 'HANDLE_COMPLAINT'
  | 'PROVIDE_INFO';

export interface PendingAction {
  id: string;
  type: ActionType;
  description: string;
  data: any;
  timestamp: Date;
  requiresConfirmation: boolean;
  confirmationMessage: string;
  fallbackOptions?: string[];
  restaurantId: string; // Multi-tenant support
  tableNumber?: number;
}

export interface ActionState {
  pendingActions: PendingAction[];
  lastActionId?: string;
  awaitingConfirmation: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
  action: 'confirm' | 'decline' | 'modify' | 'custom';
  customAction?: string;
}

export interface ParsedOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Utility function to generate unique action IDs
export function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Action creation helpers
export function createAddToOrderAction(
  item: ParsedOrderItem,
  restaurantId: string,
  options?: { onConfirm?: () => void }
): PendingAction {
  const actionId = generateActionId();
  const actionData = { item, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'ADD_TO_ORDER', actionData);
  
  return {
    id: actionId,
    type: 'ADD_TO_ORDER',
    description: `Add ${item.quantity}x ${item.name} to order`,
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `Add ${item.quantity}x ${item.name} ($${item.price.toFixed(2)} each) to your order?`,
    fallbackOptions: ['show_alternatives', 'modify_quantity'],
    restaurantId,
  };
}

export function createRemoveFromOrderAction(
  itemName: string,
  menuItemId: string,
  restaurantId: string,
  options?: { onConfirm?: () => void }
): PendingAction {
  const actionId = generateActionId();
  const actionData = { itemName, menuItemId, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'REMOVE_FROM_ORDER', actionData);
  
  return {
    id: actionId,
    type: 'REMOVE_FROM_ORDER',
    description: `Remove ${itemName} from order`,
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `Remove ${itemName} from your order?`,
    fallbackOptions: ['replace_with_alternative', 'keep_item'],
    restaurantId,
  };
}

export function createConfirmOrderAction(
  items: ParsedOrderItem[],
  total: number,
  restaurantId: string,
  options?: { onConfirm?: () => void; onDecline?: () => void }
): PendingAction {
  const actionId = generateActionId();
  
  // Ensure total is a valid number
  const safeTotal = typeof total === 'number' && !isNaN(total) ? total : 0;
  const actionData = { items, total: safeTotal, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'CONFIRM_ORDER', actionData);
  
  return {
    id: actionId,
    type: 'CONFIRM_ORDER',
    description: `Order: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `I'll place this order for you:\n\n${items.map(i => {
      const itemPrice = typeof i.price === 'number' && !isNaN(i.price) ? i.price : 0;
      const itemQuantity = typeof i.quantity === 'number' && !isNaN(i.quantity) ? i.quantity : 1;
      return `• ${itemQuantity}x ${i.name} - $${(itemPrice * itemQuantity).toFixed(2)}`;
    }).join('\n')}\n\nTotal: $${safeTotal.toFixed(2)}\n\nShall I place this order?`,
    fallbackOptions: ['modify_quantities', 'remove_items', 'add_more_items'],
    restaurantId,
  };
}

export function createClarificationAction(
  ambiguousRequest: string,
  options: any[],
  restaurantId: string,
  tableNumber?: number
): PendingAction {
  return {
    id: generateActionId(),
    type: 'REQUEST_CLARIFICATION',
    description: `Clarify request: ${ambiguousRequest}`,
    data: { options, originalRequest: ambiguousRequest },
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `I found several options for "${ambiguousRequest}". Which one did you mean?`,
    fallbackOptions: options.map(opt => opt.name || opt.label || opt.toString()),
    restaurantId,
    tableNumber,
  };
}

export function createRecommendationAction(
  recommendations: any[],
  context: string,
  restaurantId: string,
  tableNumber?: number
): PendingAction {
  return {
    id: generateActionId(),
    type: 'REQUEST_RECOMMENDATION',
    description: `Recommend items based on: ${context}`,
    data: { recommendations, context },
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `Based on your preferences, would you like me to recommend some dishes?`,
    fallbackOptions: recommendations.map(rec => rec.name),
    restaurantId,
    tableNumber,
  };
}

export function createModifyOrderItemAction(
  itemName: string,
  oldQuantity: number,
  newQuantity: number,
  priceDifference: number,
  restaurantId: string,
  options?: { onConfirm?: () => void }
): PendingAction {
  const changeText = priceDifference > 0 
    ? `increase your total by $${priceDifference.toFixed(2)}` 
    : `reduce your total by $${Math.abs(priceDifference).toFixed(2)}`;
    
  const actionId = generateActionId();
  const actionData = { itemName, oldQuantity, newQuantity, priceDifference, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'MODIFY_ORDER_ITEM', actionData);
    
  return {
    id: actionId,
    type: 'MODIFY_ORDER_ITEM',
    description: `Change ${itemName} quantity from ${oldQuantity} to ${newQuantity}`,
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: `Change ${itemName} quantity from ${oldQuantity} to ${newQuantity}? This will ${changeText}.`,
    fallbackOptions: ['keep_original_quantity', 'try_different_quantity'],
    restaurantId,
  };
}

export function createOrderCheckAction(
  restaurantId: string,
  tableNumber?: number
): PendingAction {
  const actionId = generateActionId();
  const actionData = { restaurantId, tableNumber, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'CHECK_ORDERS', actionData);
  
  return {
    id: actionId,
    type: 'CHECK_ORDERS',
    description: 'Check recent orders',
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: false, // Don't require confirmation for checking orders
    confirmationMessage: 'Let me check your recent orders...',
    fallbackOptions: ['view_menu', 'place_new_order'],
    restaurantId,
    tableNumber,
  };
}

export function createOrderEditAction(
  restaurantId: string,
  tableNumber?: number
): PendingAction {
  const actionId = generateActionId();
  const actionData = { restaurantId, tableNumber, actionId };
  
  // Store action data for later retrieval
  storeActionData(actionId, 'EDIT_ORDER', actionData);
  
  return {
    id: actionId,
    type: 'EDIT_ORDER',
    description: 'Edit existing order',
    data: actionData,
    timestamp: new Date(),
    requiresConfirmation: true,
    confirmationMessage: 'Would you like me to show your orders so you can make changes?',
    fallbackOptions: ['check_orders', 'place_new_order'],
    restaurantId,
    tableNumber,
  };
}

// Simple action store for this implementation
// In production, you'd use Redis or a proper cache
const actionStore = new Map<string, { type: ActionType; data: any }>();

// Store action data when creating actions
export function storeActionData(actionId: string, type: ActionType, data: any): void {
  console.log("💾 Storing action:", actionId, type);
  actionStore.set(actionId, { type, data });
  console.log("📦 Store now contains:", actionStore.size, "actions");
}

// Parse action ID to extract type and data
export function parseActionId(actionId: string, fallbackData?: { type: ActionType; data: any }): { type: ActionType; data: any } | null {
  // Try to get from store first
  const storedData = actionStore.get(actionId);
  if (storedData) {
    console.log("✅ Found action in store:", actionId, storedData.type);
    return storedData;
  }
  
  // If fallback data is provided, use it and restore to store
  if (fallbackData) {
    console.log("🔄 Using fallback action data for:", actionId, fallbackData.type);
    actionStore.set(actionId, fallbackData);
    return fallbackData;
  }
  
  console.log("❌ Action not found in store and no fallback provided:", actionId);
  console.log("📦 Current store contents:", Array.from(actionStore.keys()));
  
  // If action is not in store and no fallback, it cannot be processed
  return null;
}

// Clean up old actions (call periodically to prevent memory leaks)
export function cleanupActionStore(): void {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [actionId, data] of actionStore.entries()) {
    if (data.data?.timestamp && now - new Date(data.data.timestamp).getTime() > maxAge) {
      actionStore.delete(actionId);
    }
  }
} 