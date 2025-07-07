import { type MenuItem, type OrderStatus } from "@prisma/client";

// Types for order processing
export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface ValidatedOrderItem {
  menuItem: MenuItem;
  quantity: number;
  priceAtTime: number;
  itemTotal: number;
  notes?: string;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  validatedItems?: ValidatedOrderItem[];
  orderTotal?: number;
}

export interface OrderSummary {
  items: ValidatedOrderItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

/**
 * Validates order items against menu items and calculates totals
 */
export function validateOrderItems(
  orderItems: OrderItemInput[],
  menuItems: MenuItem[]
): OrderValidationResult {
  const errors: string[] = [];
  const validatedItems: ValidatedOrderItem[] = [];
  let orderTotal = 0;

  // Check if order has items
  if (!orderItems || orderItems.length === 0) {
    errors.push("Order must contain at least one item");
    return { isValid: false, errors };
  }

  // Validate each order item
  for (const orderItem of orderItems) {
    // Find the corresponding menu item
    const menuItem = menuItems.find(mi => mi.id === orderItem.menuItemId);
    
    if (!menuItem) {
      errors.push(`Menu item with ID ${orderItem.menuItemId} not found`);
      continue;
    }

    // Check if menu item is available
    if (!menuItem.available) {
      errors.push(`${menuItem.name} is currently unavailable`);
      continue;
    }

    // Validate quantity
    if (orderItem.quantity <= 0) {
      errors.push(`Quantity for ${menuItem.name} must be greater than 0`);
      continue;
    }

    if (orderItem.quantity > 50) {
      errors.push(`Quantity for ${menuItem.name} cannot exceed 50`);
      continue;
    }

    // Calculate item total
    const priceAtTime = Number(menuItem.price);
    const itemTotal = priceAtTime * orderItem.quantity;
    orderTotal += itemTotal;

    // Add to validated items
    validatedItems.push({
      menuItem,
      quantity: orderItem.quantity,
      priceAtTime,
      itemTotal,
      notes: orderItem.notes?.trim() || undefined,
    });
  }

  // Check for duplicate menu items
  const menuItemCounts = new Map<string, number>();
  for (const item of orderItems) {
    const count = menuItemCounts.get(item.menuItemId) || 0;
    menuItemCounts.set(item.menuItemId, count + 1);
  }

  const duplicateItems = Array.from(menuItemCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([menuItemId]) => {
      const menuItem = menuItems.find(mi => mi.id === menuItemId);
      return menuItem?.name || menuItemId;
    });

  if (duplicateItems.length > 0) {
    errors.push(`Duplicate items found: ${duplicateItems.join(", ")}. Please combine quantities.`);
  }

  // Validate total amount
  if (orderTotal > 10000) {
    errors.push("Order total cannot exceed $10,000");
  }

  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    ...(isValid && { 
      validatedItems,
      orderTotal: Math.round(orderTotal * 100) / 100 // Round to 2 decimal places
    }),
  };
}

/**
 * Creates an order summary with calculated totals
 */
export function createOrderSummary(validatedItems: ValidatedOrderItem[]): OrderSummary {
  const subtotal = validatedItems.reduce((sum, item) => sum + item.itemTotal, 0);
  const itemCount = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // For now, total equals subtotal (no tax/tips in MVP)
  const total = Math.round(subtotal * 100) / 100;

  return {
    items: validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    total,
    itemCount,
  };
}

/**
 * Formats order items for display
 */
export function formatOrderItems(items: ValidatedOrderItem[]): string {
  return items
    .map(item => {
      const itemStr = `${item.quantity}x ${item.menuItem.name}`;
      const priceStr = `$${item.itemTotal.toFixed(2)}`;
      const notesStr = item.notes ? ` (${item.notes})` : "";
      return `${itemStr}${notesStr} - ${priceStr}`;
    })
    .join(", ");
}

/**
 * Validates table number
 */
export function validateTableNumber(tableNumber: number): { isValid: boolean; error?: string } {
  if (!Number.isInteger(tableNumber)) {
    return { isValid: false, error: "Table number must be a whole number" };
  }

  if (tableNumber < 1 || tableNumber > 999) {
    return { isValid: false, error: "Table number must be between 1 and 999" };
  }

  return { isValid: true };
}

/**
 * Validates customer name (optional)
 */
export function validateCustomerName(name?: string): { isValid: boolean; error?: string } {
  if (!name) return { isValid: true }; // Optional field

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: true }; // Empty is okay
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: "Customer name cannot exceed 100 characters" };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const validNameRegex = /^[a-zA-Z\s'-]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return { isValid: false, error: "Customer name contains invalid characters" };
  }

  return { isValid: true };
}

// Import and re-export from orderValidation to maintain backward compatibility
import { 
  getOrderStatusTransitions,
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS
} from '@/utils/orderValidation';

/**
 * Gets the next valid status for an order
 * @deprecated Use getOrderStatusTransitions from @/utils/orderValidation instead
 */
export function getNextOrderStatus(currentStatus: OrderStatus): OrderStatus[] {
  return getOrderStatusTransitions(currentStatus);
}

/**
 * Gets a human-readable status label
 * @deprecated Use ORDER_STATUS_LABELS from @/utils/orderValidation instead
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] || status;
}

/**
 * Gets the status color for UI display
 * @deprecated Use ORDER_STATUS_COLORS from @/utils/orderValidation instead
 */
export function getOrderStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
}

/**
 * Calculates estimated preparation time based on order items
 */
export function estimatePreparationTime(items: ValidatedOrderItem[]): number {
  // Base time per item in minutes (simplified algorithm)
  const baseTimePerItem = 5;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Minimum 10 minutes, maximum 60 minutes
  const estimatedMinutes = Math.max(10, Math.min(60, totalItems * baseTimePerItem));
  
  return estimatedMinutes;
}

/**
 * Formats price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Formats order time for display
 */
export function formatOrderTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
} 