import type { 
  AIActionContext,
  MenuItemContext,
  OrderContext,
  CustomerSessionContext,
  RestaurantSettings,
  ConversationMessage
} from "@/types/aiActions";

/**
 * AI Context Builder - Gathers rich context for AI decision making
 * This replaces simple context with comprehensive restaurant intelligence
 */

/**
 * Build comprehensive AI context from restaurant and session data
 */
export async function buildAIActionContext(
  restaurantData: any,
  tableNumber: number | undefined,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ctx: any
): Promise<AIActionContext> {
  
  console.log("🏗️ Building AI Context for restaurant:", restaurantData.name);
  
  // Build menu items context with enhanced data
  const menuItems: MenuItemContext[] = restaurantData.menuItems.map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: typeof item.price === 'number' ? item.price : parseFloat(item.price.toString()),
    category: item.category,
    available: item.available,
    imageUrl: item.imageUrl,
    dietaryTags: item.dietaryTags?.map((tag: any) => tag.value) || [],
    // Add AI-helpful metadata
    ingredients: extractIngredients(item.description),
    prepTime: estimatePrepTime(item.category),
    popularityScore: calculatePopularityScore(item, restaurantData)
  }));

  // Get current customer session
  const customerSession = await getCurrentCustomerSession(
    restaurantData.id,
    tableNumber,
    ctx
  );

  // Get current orders
  const currentOrders = await getCurrentOrders(
    restaurantData.id,
    tableNumber,
    customerSession?.id,
    ctx
  );

  // Build restaurant settings
  const restaurantSettings: RestaurantSettings = {
    waiterPersonality: restaurantData.waiterPersonality || "FRIENDLY",
    conversationTone: mapConversationTone(restaurantData.conversationTone),
    responseStyle: mapResponseStyle(restaurantData.responseStyle),
    specialtyKnowledge: restaurantData.specialtyKnowledge ? 
      restaurantData.specialtyKnowledge.split(',').map((s: string) => s.trim()) : [],
    customInstructions: restaurantData.customInstructions,
    upsellSettings: {
      enabled: true, // Default to enabled
      aggressiveness: "MEDIUM",
      categories: ["appetizers", "desserts", "drinks"]
    }
  };

  // Convert conversation history to AI format
  const aiConversationHistory: ConversationMessage[] = conversationHistory.map((msg, index) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: msg.content,
    timestamp: new Date(Date.now() - (conversationHistory.length - index) * 60000), // Estimate timestamps
  }));

  const context: AIActionContext = {
    restaurantId: restaurantData.id,
    tableNumber,
    menuItems,
    conversationHistory: aiConversationHistory,
    currentOrders,
    customerSession,
    restaurantSettings,
    restaurantInfo: {
      name: restaurantData.name,
      subdomain: restaurantData.subdomain,
      waiterName: restaurantData.waiterName || "Your AI Waiter"
    },
    conversationMemory: undefined, // Will be populated by AI action detection
    orderStatusRules: buildOrderStatusRules(),
    orderValidationContext: buildOrderValidationContext(currentOrders)
  };

  console.log("✅ AI Context built:", {
    menuItems: menuItems.length,
    conversationLength: aiConversationHistory.length,
    currentOrders: currentOrders.length,
    hasSession: !!customerSession,
    tableNumber
  });

  return context;
}

/**
 * Get current customer session for the table
 */
async function getCurrentCustomerSession(
  restaurantId: string,
  tableNumber: number | undefined,
  ctx: any
): Promise<CustomerSessionContext | undefined> {
  
  if (!tableNumber) return undefined;

  try {
    const session = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE"
      }
    });

    if (!session) return undefined;

    return {
      id: session.id,
      customerName: session.customerName,
      tableNumber: session.tableNumber,
      status: session.status,
      startTime: session.startTime,
      totalOrders: session.totalOrders,
      totalSpent: session.totalSpent
    };
  } catch (error) {
    console.error("❌ Failed to get customer session:", error);
    return undefined;
  }
}

/**
 * Get current orders for the table/session
 */
async function getCurrentOrders(
  restaurantId: string,
  tableNumber: number | undefined,
  sessionId: string | undefined,
  ctx: any
): Promise<OrderContext[]> {
  
  if (!tableNumber) return [];

  try {
    // Prefer session-based orders, fallback to table-based
    const whereClause = sessionId ? 
      { sessionId } : 
      { 
        restaurantId,
        tableNumber: `Table ${tableNumber}`,
        createdAt: {
          gte: new Date(Date.now() - 4 * 60 * 60 * 1000) // Last 4 hours
        }
      };

    const orders = await ctx.db.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to recent orders
    });

    return orders.map((order: any) => ({
      id: order.id,
      status: order.status,
      total: typeof order.total === 'number' ? order.total : parseFloat(order.total.toString()),
      createdAt: order.createdAt,
      estimatedCompletionTime: order.estimatedCompletionTime,
      canModify: order.status === 'PENDING',
      notes: order.notes,
      items: order.items.map((item: any) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()),
        notes: item.notes,
        canModify: order.status === 'PENDING'
      }))
    }));
  } catch (error) {
    console.error("❌ Failed to get current orders:", error);
    return [];
  }
}

/**
 * Extract ingredients from menu item description for dietary considerations
 */
function extractIngredients(description: string | undefined): string[] {
  if (!description) return [];
  
  // Simple ingredient extraction - could be enhanced with NLP
  const commonIngredients = [
    'cheese', 'tomato', 'lettuce', 'onion', 'garlic', 'chicken', 'beef', 'pork', 
    'fish', 'shrimp', 'nuts', 'peanuts', 'eggs', 'milk', 'wheat', 'gluten',
    'mushrooms', 'peppers', 'olives', 'basil', 'oregano', 'spinach'
  ];
  
  const lowerDescription = description.toLowerCase();
  return commonIngredients.filter(ingredient => 
    lowerDescription.includes(ingredient)
  );
}

/**
 * Estimate preparation time based on category
 */
function estimatePrepTime(category: string): number {
  const prepTimes: Record<string, number> = {
    'appetizers': 10,
    'salads': 8,
    'soups': 12,
    'pizzas': 15,
    'pasta': 12,
    'main courses': 20,
    'desserts': 8,
    'drinks': 3,
    'sides': 8
  };
  
  return prepTimes[category.toLowerCase()] || 15; // Default 15 minutes
}

/**
 * Calculate popularity score for recommendations
 */
function calculatePopularityScore(item: any, restaurantData: any): number {
  // Simple popularity calculation - could be enhanced with actual order data
  const baseScore = 0.5;
  
  // Boost score for items with images
  let score = baseScore + (item.imageUrl ? 0.2 : 0);
  
  // Boost score for items with descriptions
  score += item.description ? 0.1 : 0;
  
  // Boost score for mid-range prices (most popular)
  const avgPrice = restaurantData.menuItems.reduce((sum: number, i: any) => 
    sum + (typeof i.price === 'number' ? i.price : parseFloat(i.price.toString())), 0
  ) / restaurantData.menuItems.length;
  
  const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString());
  if (itemPrice >= avgPrice * 0.8 && itemPrice <= avgPrice * 1.2) {
    score += 0.2;
  }
  
  return Math.min(1.0, score);
}

/**
 * Map conversation tone to AI format
 */
function mapConversationTone(tone: string | undefined): RestaurantSettings['conversationTone'] {
  switch (tone?.toUpperCase()) {
    case 'WARM': return 'WARM';
    case 'ENERGETIC': return 'ENERGETIC';
    case 'CALM': return 'CALM';
    default: return 'NEUTRAL';
  }
}

/**
 * Map response style to AI format
 */
function mapResponseStyle(style: string | undefined): RestaurantSettings['responseStyle'] {
  switch (style?.toUpperCase()) {
    case 'CONCISE': return 'CONCISE';
    case 'DETAILED': return 'DETAILED';
    case 'ENTERTAINING': return 'ENTERTAINING';
    default: return 'HELPFUL';
  }
}

/**
 * Update AI context with new information during conversation
 */
export function updateAIContext(
  existingContext: AIActionContext,
  newMessage: ConversationMessage,
  newOrders?: OrderContext[]
): AIActionContext {
  
  const updatedHistory = [
    ...existingContext.conversationHistory || [],
    newMessage
  ].slice(-10); // Keep last 10 messages for context

  return {
    ...existingContext,
    conversationHistory: updatedHistory,
    currentOrders: newOrders || existingContext.currentOrders
  };
}

/**
 * Extract customer preferences from conversation history
 */
export function extractCustomerPreferences(
  conversationHistory: ConversationMessage[]
): Partial<import("@/types/aiActions").CustomerPreferences> {
  
  const preferences: Partial<import("@/types/aiActions").CustomerPreferences> = {};
  
  // Extract dietary restrictions
  const dietaryKeywords = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut allergy', 'pescatarian'];
  const dietaryMentions = conversationHistory
    .map(msg => msg.content.toLowerCase())
    .join(' ');
  
  preferences.dietaryRestrictions = dietaryKeywords.filter(keyword => 
    dietaryMentions.includes(keyword)
  );
  
  // Extract spice tolerance
  if (dietaryMentions.includes('spicy') || dietaryMentions.includes('hot')) {
    preferences.spiceTolerance = 'HOT';
  } else if (dietaryMentions.includes('mild')) {
    preferences.spiceTolerance = 'MILD';
  }
  
  // Extract price sensitivity
  if (dietaryMentions.includes('cheap') || dietaryMentions.includes('budget')) {
    preferences.priceRange = 'BUDGET';
  } else if (dietaryMentions.includes('expensive') || dietaryMentions.includes('premium')) {
    preferences.priceRange = 'PREMIUM';
  }
  
  return preferences;
}

/**
 * Build order status rules for AI context
 */
function buildOrderStatusRules(): string {
  return `
CRITICAL ORDER STATUS RULES:
- PENDING: Full modification allowed (add, remove, cancel, edit)
- PREPARING: NO modifications allowed, only staff-assisted cancellation  
- READY: NO modifications allowed, order awaiting pickup
- SERVED: NO modifications allowed, order completed
- CANCELLED: NO modifications allowed, order already cancelled

Before suggesting ANY order modification:
1. Check current order status
2. If not PENDING, use explain_order_locked function
3. Never suggest impossible actions for current status
4. Always inform customer about status-based restrictions

FUNCTION USAGE RULES:
- cancel_order: Only for PENDING orders
- add_to_existing_order: Only for PENDING orders  
- modify_order: Only for PENDING orders
- explain_order_locked: For PREPARING/READY/SERVED orders when customer wants to modify
`;
}

/**
 * Build order validation context based on current orders
 */
function buildOrderValidationContext(currentOrders: OrderContext[]): {
  canModifyByStatus: Record<string, boolean>;
  currentOrderStatuses: Array<{ orderId: string; status: string; canModify: boolean }>;
  hasModifiableOrders: boolean;
} {
  const canModifyByStatus = {
    PENDING: true,
    PREPARING: false, 
    READY: false,
    SERVED: false,
    CANCELLED: false
  };

  const currentOrderStatuses = currentOrders.map(order => ({
    orderId: order.id.slice(-6),
    status: order.status,
    canModify: order.canModify
  }));

  const hasModifiableOrders = currentOrders.some(order => order.canModify);

  return {
    canModifyByStatus,
    currentOrderStatuses,
    hasModifiableOrders
  };
} 