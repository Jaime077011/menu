/**
 * Optimized AI Prompt Templates
 * Fine-tuned prompts for maximum accuracy and consistency
 */

import type { AIActionContext } from '@/types/aiActions';

export interface PromptTemplate {
  systemPrompt: string;
  contextPrompt: string;
  instructionsPrompt: string;
}

/**
 * Generate optimized system prompt based on context
 */
export function generateOptimizedSystemPrompt(context: AIActionContext): string {
  const { restaurantInfo, menuItems, customerSession, currentOrders } = context;
  
  return `You are a helpful AI waiter at ${restaurantInfo.name}. 

WHEN TO USE FUNCTIONS:
- Customer wants to order food → use place_order function
- Customer asks "what do you have" or "show me menu" → use show_menu function  
- Customer asks for recommendations → use get_recommendations function
- Customer asks about order status → use check_order_status function
- Just chatting/greeting → respond normally (no function)

MENU ITEMS:
${menuItems?.map(item => 
  `- ${item.name} (ID: ${item.id}) - $${item.price}${item.available ? '' : ' [UNAVAILABLE]'}`
).join('\n') || 'No menu items available'}

IMPORTANT: 
- Always use exact menu item IDs from above
- Never make up menu item IDs
- Only suggest available items
- Be helpful and friendly`;
}

/**
 * Generate context-aware conversation prompt
 */
export function generateContextPrompt(context: AIActionContext): string {
  const { conversationHistory, customerSession, currentOrders } = context;
  
  let contextPrompt = '';
  
  // Add conversation history context
  if (conversationHistory && conversationHistory.length > 0) {
    contextPrompt += `\n📜 CONVERSATION HISTORY:\n`;
    conversationHistory.slice(-5).forEach((msg, index) => {
      contextPrompt += `${index + 1}. ${msg.role === 'user' ? 'Customer' : 'You'}: ${msg.content}\n`;
    });
  }
  
  // Add customer session context
  if (customerSession) {
    contextPrompt += `\n👤 CUSTOMER SESSION:\n`;
    contextPrompt += `- Name: ${customerSession.customerName || 'Guest'}\n`;
    contextPrompt += `- Session Duration: ${Math.floor((Date.now() - customerSession.startTime.getTime()) / 60000)} minutes\n`;
    contextPrompt += `- Total Orders: ${customerSession.totalOrders}\n`;
    contextPrompt += `- Total Spent: $${customerSession.totalSpent}\n`;
  }
  
  // Add current orders context
  if (currentOrders && currentOrders.length > 0) {
    contextPrompt += `\n🛒 CURRENT ORDERS:\n`;
    currentOrders.forEach((order, index) => {
      contextPrompt += `${index + 1}. Order #${order.id.slice(-6)}: ${order.status} - $${order.total} (${order.canModify ? 'CAN EDIT' : 'LOCKED'})\n`;
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          contextPrompt += `   - ${item.quantity}x ${item.name} (ItemID: ${item.id}, MenuID: ${item.menuItemId})\n`;
        });
      }
    });
  }
  
  return contextPrompt;
}

/**
 * Generate specific instructions based on restaurant settings
 */
export function generateInstructionsPrompt(context: AIActionContext): string {
  const { restaurantSettings } = context;
  
  let instructions = `\n🎯 SPECIFIC INSTRUCTIONS FOR THIS INTERACTION:\n`;
  
  // Personality-based instructions (support both template and legacy enum)
  if (restaurantSettings?.personalityTemplate) {
    // New template system
    const template = restaurantSettings.personalityTemplate;
    instructions += `- Personality: ${template.name} (${template.description || 'No description'})\n`;
    instructions += `- Tone: ${template.tone}\n`;
    instructions += `- Response Style: ${template.responseStyle}\n`;
    
    // Generate instructions based on tone
    switch (template.tone?.toUpperCase()) {
      case 'FORMAL':
        instructions += `- Maintain formal, courteous language\n`;
        instructions += `- Use proper etiquette and respectful address\n`;
        break;
      case 'CASUAL':
        instructions += `- Keep it relaxed and conversational\n`;
        instructions += `- Use informal, friendly language\n`;
        break;
      default: // BALANCED
        instructions += `- Maintain a professional yet friendly tone\n`;
        instructions += `- Be approachable while staying courteous\n`;
        break;
    }
    
    // Generate instructions based on response style
    switch (template.responseStyle?.toUpperCase()) {
      case 'CONCISE':
        instructions += `- Keep responses brief and to the point\n`;
        instructions += `- Avoid unnecessary elaboration\n`;
        break;
      case 'DETAILED':
        instructions += `- Provide comprehensive explanations\n`;
        instructions += `- Offer additional context when helpful\n`;
        break;
      case 'PLAYFUL':
        instructions += `- Add personality and light humor\n`;
        instructions += `- Be entertaining while staying professional\n`;
        break;
      default: // HELPFUL
        instructions += `- Focus on being genuinely helpful\n`;
        instructions += `- Provide guidance and assistance\n`;
        break;
    }
  } else if (restaurantSettings?.waiterPersonality) {
    // Legacy enum system (backwards compatibility)
    switch (restaurantSettings.waiterPersonality) {
      case 'FRIENDLY':
        instructions += `- Be warm, welcoming, and enthusiastic\n`;
        instructions += `- Use casual, friendly language\n`;
        instructions += `- Show genuine interest in customer satisfaction\n`;
        break;
      case 'PROFESSIONAL':
        instructions += `- Maintain formal, courteous tone\n`;
        instructions += `- Be efficient and precise\n`;
        instructions += `- Focus on service excellence\n`;
        break;
      case 'CASUAL':
        instructions += `- Keep it relaxed and conversational\n`;
        instructions += `- Use informal language\n`;
        instructions += `- Be approachable and easy-going\n`;
        break;
    }
  }
  
  // Upselling instructions
  if (restaurantSettings?.upsellSettings?.enabled) {
    const aggressiveness = restaurantSettings.upsellSettings.aggressiveness || 'MEDIUM';
    instructions += `- Upselling: ${aggressiveness} approach\n`;
    
    if (aggressiveness === 'LOW') {
      instructions += `  - Only suggest when directly relevant\n`;
    } else if (aggressiveness === 'HIGH') {
      instructions += `  - Actively suggest complementary items\n`;
    } else {
      instructions += `  - Suggest when appropriate, don't be pushy\n`;
    }
    
    if (restaurantSettings.upsellSettings.categories) {
      instructions += `  - Focus on: ${restaurantSettings.upsellSettings.categories.join(', ')}\n`;
    }
  }
  
  // Specialty knowledge
  if (restaurantSettings?.specialtyKnowledge?.length) {
    instructions += `- Your specialties: ${restaurantSettings.specialtyKnowledge.join(', ')}\n`;
    instructions += `- Highlight these when making recommendations\n`;
  }
  
  return instructions;
}

/**
 * Generate complete optimized prompt
 */
export function generateCompleteOptimizedPrompt(context: AIActionContext): string {
  const systemPrompt = generateOptimizedSystemPrompt(context);
  const contextPrompt = generateContextPrompt(context);
  const instructionsPrompt = generateInstructionsPrompt(context);
  
  return `${systemPrompt}${contextPrompt}${instructionsPrompt}

🎯 REMEMBER: Analyze the customer's message carefully, consider the full context, and make the most appropriate decision. When in doubt, ask for clarification rather than guessing.`;
}

/**
 * A/B Testing Prompt Variants
 */
export const PROMPT_VARIANTS = {
  STANDARD: 'standard',
  DETAILED: 'detailed',
  CONCISE: 'concise',
  CONTEXTUAL: 'contextual'
} as const;

export type PromptVariant = typeof PROMPT_VARIANTS[keyof typeof PROMPT_VARIANTS];

/**
 * Generate prompt based on variant for A/B testing
 */
export function generatePromptVariant(
  context: AIActionContext, 
  variant: PromptVariant = 'standard'
): string {
  switch (variant) {
    case 'detailed':
      return generateDetailedPrompt(context);
    case 'concise':
      return generateConcisePrompt(context);
    case 'contextual':
      return generateContextualPrompt(context);
    default:
      return generateCompleteOptimizedPrompt(context);
  }
}

function generateDetailedPrompt(context: AIActionContext): string {
  // More detailed version with extensive examples
  return generateCompleteOptimizedPrompt(context) + `

📚 DETAILED EXAMPLES:

ORDER EXAMPLES:
✅ "I want 2 pizzas" → place_order with 2 pizza items
✅ "Give me a salad and a drink" → place_order with both items
✅ "Can I get the margherita pizza?" → place_order with specific item

CONVERSATION EXAMPLES:
✅ "Hi there!" → no_action_needed, respond naturally
✅ "How are you?" → no_action_needed, friendly response
✅ "What's the weather like?" → no_action_needed, polite redirect

RECOMMENDATION EXAMPLES:
✅ "What do you recommend?" → request_recommendations
✅ "What's popular?" → request_recommendations with popularity focus
✅ "Something light?" → request_recommendations with dietary preference`;
}

function generateConcisePrompt(context: AIActionContext): string {
  // Shorter, more focused version
  return `You are ${context.restaurantInfo.waiterName} at ${context.restaurantInfo.name}.

MENU (use exact IDs):
${context.menuItems?.map(item => `${item.id}: ${item.name} ($${item.price})`).join('\n') || 'No items'}

RULES:
- Order intent → place_order function
- Questions → provide_information function  
- Recommendations → request_recommendations function
- Chat → no_action_needed
- Use exact menu item IDs only

Analyze the message and choose the right action.`;
}

function generateContextualPrompt(context: AIActionContext): string {
  // Context-heavy version that emphasizes conversation flow
  const recentMessages = context.conversationHistory?.slice(-3) || [];
  
  return generateCompleteOptimizedPrompt(context) + `

🔄 CONVERSATION FLOW ANALYSIS:
Recent conversation pattern: ${recentMessages.length > 0 ? 
  recentMessages.map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`).join(' → ') : 
  'New conversation'}

Consider this flow when making decisions. If the customer is continuing a previous topic, maintain that context.`;
}

/**
 * Prompt performance tracking
 */
export interface PromptPerformance {
  variant: PromptVariant;
  accuracy: number;
  responseTime: number;
  confidence: number;
  fallbackRate: number;
  usageCount: number;
}

class PromptOptimizer {
  private performance: Map<PromptVariant, PromptPerformance> = new Map();
  
  recordPerformance(
    variant: PromptVariant,
    accuracy: number,
    responseTime: number,
    confidence: number,
    usedFallback: boolean
  ): void {
    const current = this.performance.get(variant) || {
      variant,
      accuracy: 0,
      responseTime: 0,
      confidence: 0,
      fallbackRate: 0,
      usageCount: 0
    };
    
    const newCount = current.usageCount + 1;
    
    this.performance.set(variant, {
      variant,
      accuracy: (current.accuracy * current.usageCount + accuracy) / newCount,
      responseTime: (current.responseTime * current.usageCount + responseTime) / newCount,
      confidence: (current.confidence * current.usageCount + confidence) / newCount,
      fallbackRate: (current.fallbackRate * current.usageCount + (usedFallback ? 1 : 0)) / newCount,
      usageCount: newCount
    });
  }
  
  getBestPerformingVariant(): PromptVariant {
    let bestVariant: PromptVariant = 'standard';
    let bestScore = 0;
    
    for (const [variant, perf] of this.performance) {
      // Composite score: accuracy * confidence * (1 - fallbackRate) / responseTime
      const score = (perf.accuracy * perf.confidence * (1 - perf.fallbackRate)) / (perf.responseTime / 1000);
      
      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant;
      }
    }
    
    return bestVariant;
  }
  
  getPerformanceReport(): PromptPerformance[] {
    return Array.from(this.performance.values());
  }
}

export const promptOptimizer = new PromptOptimizer(); 