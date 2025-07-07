import { z } from "zod";
import { 
  createConfirmOrderAction, 
  createAddToOrderAction, 
  createRemoveFromOrderAction,
  type PendingAction,
  type ParsedOrderItem as ActionParsedOrderItem
} from "@/types/chatActions";

// Types for parsed order data
export interface ParsedOrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface ParsedOrder {
  items: ParsedOrderItem[];
  tableNumber?: number;
  customerName?: string;
  notes?: string;
  isOrderIntent: boolean;
}

// Zod schema for validating parsed order items
export const parsedOrderItemSchema = z.object({
  menuItemId: z.string().cuid(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
});

export const parsedOrderSchema = z.object({
  items: z.array(parsedOrderItemSchema).min(1),
  tableNumber: z.number().int().min(1).max(999),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

// Order intent detection patterns
const ORDER_INTENT_PATTERNS = [
  /\b(i want|i'd like|i'll have|can i get|i order|give me|i'll take)\b/i,
  /\b(place.*order|complete.*order|process.*order|finalize.*order)\b/i,
  /\b(that's my order|confirm.*order|order confirmed)\b/i,
  /\b(yes.*order|perfect.*order|sounds good)\b/i,
  // Enhanced patterns for quantity-based orders
  /\b(i want|i'd like|give me|can i get)\s+\d+/i,
  /\b\d+\s+(of|pizzas?|salads?|burgers?|drinks?|appetizers?|desserts?|sandwiches?|wings?)/i,
  /\b(order|get|want|like)\s+\d+\s+(pizzas?|salads?|burgers?|drinks?)/i,
];

const CONFIRMATION_PATTERNS = [
  /\b(yes|yeah|perfect|correct|that's right|sounds good|go ahead)\b/i,
  /\b(complete.*order|process.*order|place.*order)\b/i,
];

// Menu item extraction patterns
const QUANTITY_PATTERNS = [
  /(\d+)\s+(.+)/,                    // "2 pizzas"
  /(one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)/i, // "two pizzas"
  /(.+)\s+x\s*(\d+)/i,               // "pizza x 2"
];

// Number word mapping
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/**
 * Detects if an AI response contains order intent
 */
export function detectOrderIntent(message: string): boolean {
  return ORDER_INTENT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Detects if a user message is confirming an order
 */
export function detectOrderConfirmation(message: string): boolean {
  return CONFIRMATION_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Extracts menu items and quantities from conversation text
 */
export function extractOrderItems(message: string, availableMenuItems: Array<{ id: string; name: string }>): ParsedOrderItem[] {
  const items: ParsedOrderItem[] = [];
  const normalizedMessage = message.toLowerCase();

  console.log("🔍 Extracting from message:", message);

  // First, handle generic food type matching ("2 salads" → "2 Caesar Salads")
  const genericFoodMatches = [
    { pattern: /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+salads?/gi, itemType: 'salad' },
    { pattern: /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+pizzas?/gi, itemType: 'pizza' },
    { pattern: /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+burgers?/gi, itemType: 'burger' },
  ];
  
  for (const { pattern, itemType } of genericFoodMatches) {
    const matches = [...message.matchAll(pattern)];
    for (const match of matches) {
      const quantityStr = match[1];
      let quantity = 1;
      
      if (!isNaN(parseInt(quantityStr))) {
        quantity = parseInt(quantityStr);
      } else if (NUMBER_WORDS[quantityStr.toLowerCase()]) {
        quantity = NUMBER_WORDS[quantityStr.toLowerCase()];
      }
      
      // Find the first menu item that matches this food type
      const matchingItem = availableMenuItems.find(item => 
        item.name.toLowerCase().includes(itemType)
      );
      
      if (matchingItem && quantity > 0) {
        console.log(`✅ Generic match: ${quantity}x ${matchingItem.name} (from "${quantityStr} ${itemType}s")`);
        console.log(`✅ Generic match - Menu item details:`, JSON.stringify(matchingItem, null, 2));
        items.push({
          name: matchingItem.name,
          quantity,
          // Note: This is ParsedOrderItem from orderParsing, not the same as ParsedOrderItem from chatActions
          // The createOrderConfirmationAction will map this to the correct format
        });
      }
    }
  }
  
  // Look for each menu item in the message
  for (const menuItem of availableMenuItems) {
    const itemName = menuItem.name.toLowerCase();
    
         // Create more flexible patterns for finding items with quantities
     const patterns = [
       // ENHANCED: "give me 2 salads" - match generic food type to specific menu item
       new RegExp(`(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+(salads?|pizzas?|burgers?)`, 'gi'),
       // "3 Caesar Salads" or "3 caesar salad" 
       new RegExp(`(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?`, 'gi'),
       // "Caesar Salads at $12.99 each" (look for "each" context)
       new RegExp(`(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?.*?each`, 'gi'),
       // Look for order confirmations like "Your order includes: - 3 Caesar Salads"
       new RegExp(`(?:order.*?(?:includes|will be|is|:)).*?-?\\s*(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?`, 'gi'),
       // Look in total calculations "3 Caesar Salads: $38.97" or "3 Caesar Salads ($12.99 each)"
       new RegExp(`(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\s*[(:$]`, 'gi'),
       // List format: "- 3 Caesar Salads ($12.99 each)"
       new RegExp(`-\\s*(\\d+|${Object.keys(NUMBER_WORDS).join('|')})\\s+${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?`, 'gi'),
     ];

    let quantity = 0;
    let found = false;

    // Try each pattern
    for (const pattern of patterns) {
      const matches = [...message.matchAll(pattern)];
      
      for (const match of matches) {
        const quantityStr = match[1];
        if (quantityStr) {
          const numericQuantity = parseInt(quantityStr);
          if (!isNaN(numericQuantity)) {
            quantity = Math.max(quantity, numericQuantity); // Take the highest quantity found
            found = true;
          } else if (NUMBER_WORDS[quantityStr.toLowerCase()]) {
            quantity = Math.max(quantity, NUMBER_WORDS[quantityStr.toLowerCase()]!);
            found = true;
          }
        }
      }
    }

    // If we found the item but no quantity, check if it appears in the message at all
    if (!found) {
      const simpleItemRegex = new RegExp(`\\b${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (simpleItemRegex.test(message)) {
        quantity = 1; // default to 1 if item mentioned but no quantity found
        found = true;
      }
    }

    if (found && quantity > 0) {
      console.log(`✅ Found: ${quantity}x ${menuItem.name}`);
      items.push({
        name: menuItem.name,
        quantity,
      });
    }
  }

  console.log("📋 Final extracted items:", items);
  return items;
}

/**
 * Validates and maps parsed items to actual menu items
 */
export function validateAndMapOrderItems(
  parsedItems: ParsedOrderItem[],
  menuItems: Array<{ id: string; name: string; available: boolean; price: number }>
): Array<{ menuItemId: string; quantity: number; notes?: string }> {
  const validatedItems = [];

  for (const parsedItem of parsedItems) {
    const menuItem = menuItems.find(
      item => item.name.toLowerCase() === parsedItem.name.toLowerCase() && item.available
    );

    if (menuItem) {
      validatedItems.push({
        menuItemId: menuItem.id,
        quantity: parsedItem.quantity,
        notes: parsedItem.notes,
      });
    }
  }

  return validatedItems;
}

/**
 * Creates an enhanced system prompt that includes order processing instructions
 */
export function createOrderAwareSystemPrompt(
  restaurant: { 
    name: string; 
    menuItems: Array<{ 
      name: string; 
      description: string; 
      price: number; 
      dietaryTags: Array<{ value: string }> 
    }> 
  }, 
  tableNumber?: number,
  waiterSettings?: {
    waiterName: string;
    personality: string;
    conversationTone: string;
    specialtyKnowledge: string;
    responseStyle: string;
  }
): string {
  const menuItems = restaurant.menuItems.map((item) => {
    const tags = item.dietaryTags.map((tag) => tag.value).join(", ");
    return `${item.name} - ${item.description} - $${item.price}${tags ? ` (${tags})` : ""}`;
  }).join("\n");

  // Personality-based greetings
  const personalityGreetings = {
    FRIENDLY: "You are warm, welcoming, and genuinely excited to help customers have a great dining experience.",
    PROFESSIONAL: "You are polite, efficient, and maintain a professional demeanor while being helpful.",
    CASUAL: "You are relaxed, conversational, and approach customers like a friendly neighbor.",
    ENTHUSIASTIC: "You are energetic, passionate about food, and excited to share recommendations."
  };

  // Conversation tone instructions
  const toneInstructions = {
    FORMAL: "Use proper grammar and formal language. Address customers respectfully.",
    BALANCED: "Mix professional service with friendly conversation. Be approachable but polite.",
    CASUAL: "Use informal, friendly language. Feel free to be conversational and relaxed."
  };

  // Response style instructions
  const styleInstructions = {
    HELPFUL: "Provide detailed explanations and helpful suggestions to guide customers.",
    CONCISE: "Keep responses brief and to the point while still being helpful.",
    DETAILED: "Give comprehensive information about dishes, ingredients, and preparation when asked.",
    PLAYFUL: "Add personality and fun to your responses while staying professional."
  };

  const waiterName = waiterSettings?.waiterName || "Waiter";
  const personality = waiterSettings?.personality || "FRIENDLY";
  const tone = waiterSettings?.conversationTone || "BALANCED";
  const style = waiterSettings?.responseStyle || "HELPFUL";
  const specialtyKnowledge = waiterSettings?.specialtyKnowledge || "";

  return `You are ${waiterName}, a virtual waiter for ${restaurant.name}. 
You are helping customers at ${tableNumber ? `Table ${tableNumber}` : "their table"} with their dining experience.

Your Personality: ${personalityGreetings[personality as keyof typeof personalityGreetings] || personalityGreetings.FRIENDLY}

Conversation Style: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.BALANCED}

Response Approach: ${styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.HELPFUL}

${specialtyKnowledge ? `Special Restaurant Knowledge: ${specialtyKnowledge}` : ""}

COMMUNICATION STYLE:
- Keep responses SHORT and FRIENDLY (1-2 sentences max unless asked for details)
- Only provide detailed explanations when customers specifically ask for them
- Focus on what the customer needs right now
- Be helpful but not overwhelming
- Let customers guide the conversation pace

Your role:
- Greet customers warmly but briefly
- Help with menu questions when asked
- Take orders efficiently
- Answer specific questions about food when requested
- Check recent orders and help with modifications
- Allow order editing if orders haven't started processing in the kitchen

Our Menu (ONLY recommend items from this list):
${menuItems}

CRITICAL ORDER RULES:
- ONLY recommend items that are on our menu above
- NEVER suggest items that are not listed
- When taking orders, be very specific about menu items and quantities
- Ask for confirmation before finalizing orders
- If customers want items not on our menu, politely explain they're not available and suggest alternatives

QUANTITY ORDER HANDLING - VERY IMPORTANT:
- When customers say "give me 2 salads" or "I want 3 pizzas", treat this as a NEW ORDER request
- Do NOT interpret quantity requests as order editing commands
- Match quantities to the closest menu item (e.g., "2 salads" = "2 Caesar Salads")
- Always confirm the specific item and quantity: "I'll add 2 Caesar Salads to your order ($12.99 each). Shall I place this order?"
- NEVER respond with confusing messages like "Select order #SALADS"

RESPONSE GUIDELINES:
- Greeting: "Hi! What can I get for you today?" (keep it simple)
- Menu questions: Give 1-2 quick recommendations unless they ask for more
- Order taking: Confirm items and quantities clearly
- Details: Only elaborate when specifically asked ("tell me more about...", "what's in...", etc.)
- Order checking: When asked to check orders, offer to show recent orders and editing options
- Order editing: Explain what can be modified (add/remove items, change quantities, cancel) if order hasn't started processing
- Stay focused on their immediate needs

Example responses:
- Customer: "Hi" → "Hi! What can I get for you today?"
- Customer: "What's good?" → "Our Caesar Salad and Margherita Pizza are really popular!"
- Customer: "Tell me about the Caesar Salad" → [Then give details]
- Customer: "Give me 2 salads" → "I'll add 2 Caesar Salads to your order ($12.99 each). Shall I place this order for you?"
- Customer: "I want 3 pizzas" → "I'll add 3 Margherita Pizzas to your order ($16.99 each). Total: $50.97. Shall I place this order?"
- Customer: "Check my order" → "Let me check your recent orders. I can also help you modify them if they haven't started processing yet!"
- Customer: "Can I change my order?" → "I can help you modify your order if it hasn't started processing in the kitchen. What would you like to change?"

When ready to place an order, present the order summary and ask for confirmation.

Example order confirmation: "Perfect! Your order: 2 Margherita Pizza ($16.99 each), 1 Caesar Salad ($12.99). Total: $46.97. Shall I place this order for you?"`;
}

/**
 * Formats order confirmation message
 */
/**
 * Creates a confirmation action for a complete order
 */
export function createOrderConfirmationAction(
  items: ParsedOrderItem[],
  menuItems: Array<{ id: string; name: string; price: number }>,
  restaurant: { id: string; name: string }
): PendingAction | null {
  if (items.length === 0) return null;

  console.log("🔍 createOrderConfirmationAction - Input items:", JSON.stringify(items, null, 2));
  console.log("🔍 createOrderConfirmationAction - Available menu items:", menuItems.length);

  // Map parsed items to menu items with pricing
  const enrichedItems: ActionParsedOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const menuItem = menuItems.find(
      m => m.name.toLowerCase() === item.name.toLowerCase()
    );
    
    console.log(`🔍 createOrderConfirmationAction - Looking for "${item.name}", found:`, menuItem ? menuItem.name : "NOT FOUND");
    
    if (menuItem) {
      const itemPrice = typeof menuItem.price === 'number' ? menuItem.price : 0;
      const itemQuantity = typeof item.quantity === 'number' ? item.quantity : 1;
      
      const enrichedItem: ActionParsedOrderItem = {
        id: menuItem.id,
        name: menuItem.name,
        quantity: itemQuantity,
        price: itemPrice,
        notes: item.notes
      };
      enrichedItems.push(enrichedItem);
      total += itemPrice * itemQuantity;
      
      console.log(`✅ createOrderConfirmationAction - Enriched item:`, JSON.stringify(enrichedItem, null, 2));
    } else {
      console.log(`❌ createOrderConfirmationAction - No menu item found for "${item.name}"`);
    }
  }

  if (enrichedItems.length === 0) {
    console.log("❌ createOrderConfirmationAction - No valid items found");
    return null;
  }

  // Ensure total is a valid number
  const validTotal = typeof total === 'number' && !isNaN(total) ? total : 0;

  console.log(`✅ createOrderConfirmationAction - Creating action with ${enrichedItems.length} items, total: $${validTotal}`);
  const action = createConfirmOrderAction(enrichedItems, validTotal, restaurant.id);
  console.log("🔍 createOrderConfirmationAction - Final action:", JSON.stringify(action, null, 2));
  
  return action;
}

/**
 * Creates a confirmation action for adding a single item
 */
export function createAddItemConfirmationAction(
  item: ParsedOrderItem,
  menuItem: { id: string; name: string; price: number },
  restaurantId: string
): PendingAction {
  const enrichedItem: ActionParsedOrderItem = {
    id: menuItem.id,
    name: menuItem.name,
    quantity: item.quantity,
    price: menuItem.price,
    notes: item.notes
  };

  return createAddToOrderAction(enrichedItem, restaurantId);
}

/**
 * Creates a confirmation action for removing an item
 */
export function createRemoveItemConfirmationAction(
  itemName: string,
  menuItemId: string,
  restaurantId: string
): PendingAction {
  return createRemoveFromOrderAction(itemName, menuItemId, restaurantId);
}

export function formatOrderConfirmation(
  orderItems: Array<{ menuItem: { name: string; price: number }; quantity: number }>,
  total: number,
  orderId: string
): string {
  const itemsList = orderItems.map(item => 
    `${item.quantity}x ${item.menuItem.name} ($${item.menuItem.price} each)`
  ).join(", ");

  return `🎉 Order confirmed! Order #${orderId.slice(-6)}

Items: ${itemsList}
Total: $${total.toFixed(2)}

Your order has been sent to the kitchen and will be prepared shortly. Thank you for dining with us!`;
} 