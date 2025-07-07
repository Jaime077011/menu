import { OrderStatus } from "@prisma/client";
import type { Order } from "@prisma/client";

/**
 * Validates if an order can be modified based on its current status
 */
export function validateOrderCanBeModified(orderStatus: OrderStatus): {
  canModify: boolean;
  canCancel: boolean;
  canAddItems: boolean;
  canRemoveItems: boolean;
  reason?: string;
} {
  switch (orderStatus) {
    case OrderStatus.PENDING:
      return {
        canModify: true,
        canCancel: true,
        canAddItems: true,
        canRemoveItems: true,
      };
      
    case OrderStatus.PREPARING:
      return {
        canModify: false,
        canCancel: true, // Can still cancel but with staff intervention
        canAddItems: false,
        canRemoveItems: false,
        reason: "Order is being prepared in the kitchen",
      };
      
    case OrderStatus.READY:
    case OrderStatus.SERVED:
    case OrderStatus.CANCELLED:
      return {
        canModify: false,
        canCancel: false,
        canAddItems: false,
        canRemoveItems: false,
        reason: `Order is ${orderStatus.toLowerCase()}`,
      };
      
    default:
      return {
        canModify: false,
        canCancel: false,
        canAddItems: false,
        canRemoveItems: false,
        reason: "Unknown order status",
      };
  }
}

/**
 * Gets valid status transitions for an order
 */
export function getOrderStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.SERVED],
    [OrderStatus.SERVED]: [], // Final state
    [OrderStatus.CANCELLED]: [], // Final state
  };

  return validTransitions[currentStatus] || [];
}

/**
 * Validates if a status transition is allowed
 */
export function validateStatusTransition(
  fromStatus: OrderStatus, 
  toStatus: OrderStatus
): { valid: boolean; reason?: string } {
  const allowedTransitions = getOrderStatusTransitions(fromStatus);
  
  if (allowedTransitions.includes(toStatus)) {
    return { valid: true };
  }
  
  return {
    valid: false,
    reason: `Cannot transition from ${fromStatus} to ${toStatus}`,
  };
}

/**
 * Standardized order status labels to prevent enum drift
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.PREPARING]: "Preparing", 
  [OrderStatus.READY]: "Ready",
  [OrderStatus.SERVED]: "Served",
  [OrderStatus.CANCELLED]: "Cancelled",
} as const;

/**
 * Standardized order status colors to prevent drift
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.PREPARING]: "bg-blue-100 text-blue-800", 
  [OrderStatus.READY]: "bg-green-100 text-green-800",
  [OrderStatus.SERVED]: "bg-gray-100 text-gray-800",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800",
} as const;

/**
 * Helper function to find order by ID or partial ID
 */
export function buildOrderQuery(sessionId: string, orderId?: string) {
  if (!orderId) {
    return {
      sessionId,
      status: { in: [OrderStatus.PENDING] }
    };
  }

  return {
    sessionId,
    OR: [
      { id: orderId },
      { id: { endsWith: orderId.toUpperCase() } }
    ]
  };
}

/**
 * Validates order item structure for creation
 */
export function validateOrderItems(items: any[]): {
  isValid: boolean;
  errors: string[];
  validatedItems?: any[];
} {
  const errors: string[] = [];
  const validatedItems: any[] = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("Order must contain at least one item");
    return { isValid: false, errors };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.id || !item.name || !item.price || !item.quantity) {
      errors.push(`Item ${i + 1}: Missing required fields (id, name, price, quantity)`);
      continue;
    }

    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push(`Item ${i + 1}: Price must be a positive number`);
      continue;
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push(`Item ${i + 1}: Quantity must be a positive integer`);
      continue;
    }

    validatedItems.push({
      menuItemId: item.id,
      quantity: item.quantity,
      priceAtTime: item.price,
      notes: item.notes || null,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedItems: errors.length === 0 ? validatedItems : undefined
  };
}

/**
 * Validates order total calculation
 */
export function validateOrderTotal(items: any[], providedTotal: number): {
  isValid: boolean;
  calculatedTotal: number;
  difference: number;
  error?: string;
} {
  const calculatedTotal = items.reduce((sum: number, item: any) => {
    const itemPrice = typeof item.price === 'number' ? item.price : 0;
    const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);

  if (calculatedTotal <= 0) {
    return {
      isValid: false,
      calculatedTotal,
      difference: 0,
      error: "Order total must be greater than $0.00"
    };
  }

  const difference = Math.abs(calculatedTotal - (providedTotal || 0));
  
  if (difference > 0.01) {
    return {
      isValid: false,
      calculatedTotal,
      difference,
      error: `Order total mismatch. Expected $${calculatedTotal.toFixed(2)}, received $${(providedTotal || 0).toFixed(2)}`
    };
  }

  return {
    isValid: true,
    calculatedTotal,
    difference
  };
} 