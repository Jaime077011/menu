import { OpenAI } from "openai";
import { env } from "@/env";
import { AI_FUNCTION_DEFINITIONS, validateFunctionCall } from "./aiFunctionDefinitions";
import type { 
  PendingAction, 
  ActionType,
  ParsedOrderItem
} from "@/types/chatActions";
import { recordAIMetrics } from "@/utils/aiPerformanceMetrics";
import { aiDecisionLogger, createContextualLogger } from "./aiDecisionLogger";
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Import AI action context from types
import type { AIActionContext } from "@/types/aiActions";

/**
 * AI Function Call Response
 */
export interface AIFunctionCallResponse {
  functionName: string;
  parameters: any;
  confidence?: number;
  reasoning?: string;
}

/**
 * AI Action Detection Result
 */
export interface AIActionResult {
  action: PendingAction | null;
  confidence: number;
  reasoning: string;
  fallbackToPatterns: boolean;
  aiResponse?: string;
  functionCall?: AIFunctionCallResponse;
}

/**
 * Main AI-Driven Action Detection Function
 * This replaces the old pattern-matching approach with true AI intelligence
 */
export async function detectActionWithAI(
  userMessage: string,
  context: AIActionContext & { ctx?: any }
): Promise<AIActionResult> {
  console.log("🚀 === AI ACTION DETECTION STARTED ===");
  console.log("📥 User Message:", userMessage);
  console.log("🔧 Model:", env.OPENAI_MODEL);
  console.log("🏪 Restaurant:", context.restaurantInfo.name);
  console.log("🍽️ Menu Items Available:", context.menuItems?.length || 0);
  console.log("📚 Function Definitions Available:", AI_FUNCTION_DEFINITIONS.length);
  console.log("🔧 Functions:", AI_FUNCTION_DEFINITIONS.map(f => f.function.name));
  
  const startTime = Date.now();
  
  try {
    console.log("🧠 AI Action Detection Started:", {
      message: userMessage.substring(0, 100) + "...",
      context: {
        restaurantId: context.restaurantId,
        tableNumber: context.tableNumber,
        menuItemsCount: context.menuItems?.length || 0,
        conversationLength: context.conversationHistory?.length || 0
      }
    });

    // Build the AI conversation context
    const aiMessages = buildAIConversationContext(userMessage, context);
    
    // Call OpenAI with function definitions
    console.log('🤖 === CALLING OPENAI API ===');
    console.log('📋 Request Details:', {
      model: env.OPENAI_MODEL,
      messagesCount: aiMessages.length,
      functionsCount: AI_FUNCTION_DEFINITIONS.length,
      temperature: 0.1,
      max_tokens: 1000,
      tool_choice: "auto"
    });
    console.log('📝 Last System Message:', aiMessages.find(m => m.role === 'system')?.content?.slice(0, 200) + "...");
    console.log('📝 User Message in API:', aiMessages.find(m => m.role === 'user')?.content);
    console.log('🔧 Available Functions:', AI_FUNCTION_DEFINITIONS.map(f => f.function.name).join(', '));

    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL, // Use the configured model from environment
      messages: aiMessages,
      tools: AI_FUNCTION_DEFINITIONS,
      tool_choice: "auto", // Let AI decide if it needs to call a function
      temperature: 0.1, // Low temperature for consistent decision making
      max_tokens: 1000,
    });

    console.log('✅ === OPENAI API RESPONSE RECEIVED ===');

    const aiResponse = response.choices[0]?.message;
    const executionTime = Date.now() - startTime;

    console.log('📋 === DETAILED OPENAI RESPONSE ANALYSIS ===');
    console.log('✅ Response received in:', `${executionTime}ms`);
    console.log('📝 Raw Response:', JSON.stringify(response.choices[0], null, 2));
    console.log('🛠️ Tool Calls Analysis:', {
      hasToolCalls: !!aiResponse?.tool_calls?.length,
      toolCallsCount: aiResponse?.tool_calls?.length || 0,
      hasContent: !!aiResponse?.content,
      finishReason: response.choices[0]?.finish_reason,
      contentPreview: aiResponse?.content?.slice(0, 100)
    });

    if (aiResponse?.tool_calls && aiResponse.tool_calls.length > 0) {
      console.log('🔧 === TOOL CALLS DETECTED ===');
      aiResponse.tool_calls.forEach((toolCall, index) => {
        console.log(`🔧 Tool Call ${index + 1}:`, {
          id: toolCall.id,
          type: toolCall.type,
          functionName: toolCall.function.name,
          argumentsRaw: toolCall.function.arguments,
          argumentsParsed: (() => {
            try {
              return JSON.parse(toolCall.function.arguments);
            } catch (e) {
              return "PARSE_ERROR";
            }
          })()
        });
      });
    } else {
      console.log('❌ === NO TOOL CALLS DETECTED ===');
      console.log('💬 AI Response Content:', aiResponse?.content);
      console.log('🤔 Possible reasons:');
      console.log('   - AI determined no action needed');
      console.log('   - Message too ambiguous');
      console.log('   - Function definitions not matching user intent');
      console.log('   - Model temperature too low/high');
    }

    // Check if AI decided to call a function
    if (aiResponse?.tool_calls && aiResponse.tool_calls.length > 0) {
      const toolCall = aiResponse.tool_calls[0]; // Use the first tool call
      const functionName = toolCall.function.name;
      const parameters = JSON.parse(toolCall.function.arguments);

      console.log("🎯 === PROCESSING AI FUNCTION CALL ===");
      console.log("🔧 Function:", functionName);
      console.log("📝 Parameters:", JSON.stringify(parameters, null, 2));

      // Validate the function call
      const isValid = validateFunctionCall(functionName, parameters);
      console.log("✅ Function validation result:", isValid);
      
      if (!isValid) {
        console.error("❌ === FUNCTION VALIDATION FAILED ===");
        console.error("🔧 Function:", functionName);
        console.error("📝 Parameters received:", parameters);
        console.error("📋 Expected parameters for", functionName + ":");
        const funcDef = AI_FUNCTION_DEFINITIONS.find(f => f.function.name === functionName);
        if (funcDef) {
          console.error("   Required:", funcDef.function.parameters?.required || []);
          console.error("   Properties:", Object.keys(funcDef.function.parameters?.properties || {}));
        }
        
        return {
          action: null,
          confidence: 0.3,
          reasoning: "AI function call validation failed",
          fallbackToPatterns: true,
          aiResponse: aiResponse.content || ""
        };
      }

      // Convert AI function call to PendingAction
      console.log("🔄 === CONVERTING TO PENDING ACTION ===");
      const action = await convertAIFunctionToPendingAction(
        functionName,
        parameters,
        context,
        context.ctx // Pass the database context for order status checking
      );

      console.log("🎯 Action conversion result:", {
        hasAction: !!action,
        actionType: action?.type,
        actionId: action?.id,
        requiresConfirmation: action?.requiresConfirmation
      });

      // Use AI confidence scoring
      const confidence = calculateAIConfidence(
        functionName,
        parameters,
        context
      );

      console.log("📊 Confidence Score:", confidence);

      // Record performance metrics
      recordAIMetrics(
        executionTime,
        confidence,
        !!action,
        false,
        {
          contextSize: JSON.stringify(context).length,
          menuItemsCount: context.menuItems?.length || 0,
          conversationLength: context.conversationHistory?.length || 0,
          restaurantId: context.restaurantId,
          tableNumber: context.tableNumber,
          sessionId: context.customerSession?.id
        }
      );

      // Log AI decision for analytics
      const logger = createContextualLogger({
        sessionId: context.customerSession?.id,
        restaurantId: context.restaurantId
      });

      if (action) {
        await logger.logSuccess({
          functionName,
          confidence,
          responseTime: executionTime,
          inputMessage: userMessage,
          outputAction: JSON.stringify(action),
          metadata: {
            tableNumber: context.tableNumber,
            menuItemsCount: context.menuItems?.length || 0,
            conversationLength: context.conversationHistory?.length || 0,
            confidence: confidence,
            functionName: functionName
          }
        });
      } else {
        await logger.logFailure({
          functionName,
          confidence,
          responseTime: executionTime,
          errorMessage: `Low confidence or validation failed`,
          inputMessage: userMessage,
          fallbackUsed: confidence < 0.5,
          metadata: {
            tableNumber: context.tableNumber,
            confidence: confidence,
            functionName: functionName
          }
        });
      }

      return {
        action,
        confidence,
        reasoning: `AI decided to call ${functionName} with confidence ${confidence.toFixed(2)}`,
        fallbackToPatterns: confidence < 0.5,
        aiResponse: aiResponse.content || "",
        functionCall: {
          functionName,
          parameters,
          confidence,
          reasoning: confidence > 0.7 ? 'High confidence decision' : 'Moderate confidence decision'
        }
      };
    } else {
      // AI decided no action is needed - just conversational response
      console.log("🧠 AI decided no action needed, just conversation");
      
      // Record performance metrics for conversational response
      recordAIMetrics(
        executionTime,
        0.9,
        false,
        false,
        {
          contextSize: JSON.stringify(context).length,
          menuItemsCount: context.menuItems?.length || 0,
          conversationLength: context.conversationHistory?.length || 0,
          restaurantId: context.restaurantId,
          tableNumber: context.tableNumber,
          sessionId: context.customerSession?.id
        }
      );
      
      return {
        action: null,
        confidence: 0.9,
        reasoning: "AI determined this is conversational - no action required",
        fallbackToPatterns: false,
        aiResponse: aiResponse?.content || ""
      };
    }

  } catch (error) {
    console.error("🚨 AI Action Detection Error:", error);
    
    const executionTime = Date.now() - startTime;
    
    // Record performance metrics for errors
    recordAIMetrics(
      executionTime,
      0.1,
      false,
      true,
      {
        contextSize: JSON.stringify(context).length,
        menuItemsCount: context.menuItems?.length || 0,
        conversationLength: context.conversationHistory?.length || 0,
        restaurantId: context.restaurantId,
        tableNumber: context.tableNumber,
        sessionId: context.customerSession?.id
      },
      [error instanceof Error ? error.message : "Unknown AI error"]
    );
    
    return {
      action: null,
      confidence: 0.1,
      reasoning: `AI detection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      fallbackToPatterns: true,
      aiResponse: ""
    };
  }
}

import { generateCompleteOptimizedPrompt } from '@/utils/aiPromptTemplates';
import { getConversationMemory, updateConversationMemory, conversationMemoryManager } from '@/utils/conversationMemory';
import { calculateAdvancedConfidence, updateConfidenceAccuracy } from '@/utils/aiConfidenceScoring';

/**
 * Build conversation context for AI decision making
 */
function buildAIConversationContext(
  userMessage: string,
  context: AIActionContext
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

  // Use optimized system prompt
  const systemPrompt = generateCompleteOptimizedPrompt(context);

  messages.push({ role: "system", content: systemPrompt });

  // Add conversation history (last 5 messages to keep context manageable)
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    const recentHistory = context.conversationHistory.slice(-5);
    messages.push(...recentHistory);
  }

  // Add the current user message
  messages.push({ role: "user", content: userMessage });

  return messages;
}

/**
 * Validate and fix menu item IDs from AI
 */
function validateAndFixMenuItemIds(parameters: any, context: AIActionContext): any {
  if (!parameters.items || !context.menuItems) {
    return parameters;
  }

  const fixedItems = parameters.items.map((item: any) => {
    // Check if the AI provided a valid menu item ID
    const validMenuItem = context.menuItems!.find(menuItem => menuItem.id === item.menuItemId);
    
    if (validMenuItem) {
      // ID is valid, use it
      return {
        ...item,
        menuItemId: validMenuItem.id,
        name: validMenuItem.name,
        price: validMenuItem.price
      };
    } else {
      // ID is invalid, try to match by name
      console.warn("⚠️ Invalid menu item ID from AI:", item.menuItemId, "- trying name match");
      const nameMatch = context.menuItems!.find(menuItem => 
        menuItem.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(menuItem.name.toLowerCase())
      );
      
      if (nameMatch) {
        console.log("✅ Found menu item by name match:", nameMatch.name);
        return {
          ...item,
          menuItemId: nameMatch.id,
          name: nameMatch.name,
          price: nameMatch.price
        };
      } else {
        console.error("❌ Could not find menu item for:", item.name);
        throw new Error(`Menu item "${item.name}" not found in restaurant menu`);
      }
    }
  });

  return {
    ...parameters,
    items: fixedItems
  };
}

/**
 * Check current order status automatically for modification/cancellation requests
 */
async function checkOrderStatusForModification(
  context: AIActionContext,
  ctx: any
): Promise<{ canModify: boolean; reason?: string; orderStatus?: string }> {
  
  if (!context.tableNumber) {
    return { canModify: false, reason: "No table number provided" };
  }

  try {
    // Get current session
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: context.restaurantId,
        tableNumber: context.tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    if (!currentSession) {
      return { canModify: false, reason: "No active session found for this table" };
    }

    // Get recent orders for this session
    const recentOrders = await ctx.db.order.findMany({
      where: {
        sessionId: currentSession.id,
        status: { not: "CANCELLED" }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (recentOrders.length === 0) {
      return { canModify: false, reason: "No orders found to modify" };
    }

    // Check if any recent orders are in non-modifiable states
    const nonModifiableOrders = recentOrders.filter(order => 
      order.status === "PREPARING" || order.status === "READY" || order.status === "SERVED"
    );

    if (nonModifiableOrders.length > 0) {
      const latestOrder = nonModifiableOrders[0];
      return { 
        canModify: false, 
        reason: `Your order is already ${latestOrder.status.toLowerCase()}`, 
        orderStatus: latestOrder.status 
      };
    }

    return { canModify: true };
    
  } catch (error) {
    console.error("❌ Failed to check order status:", error);
    return { canModify: false, reason: "Unable to check order status" };
  }
}

/**
 * Convert AI function call to PendingAction
 */
async function convertAIFunctionToPendingAction(
  functionName: string,
  parameters: any,
  context: AIActionContext,
  ctx?: any
): Promise<PendingAction | null> {
  
  console.log("🔄 Converting AI function to PendingAction:", {
    function: functionName,
    parametersKeys: Object.keys(parameters)
  });

  // Validate and fix menu item IDs for ordering functions
  if (functionName === "place_order" || functionName === "add_to_existing_order") {
    try {
      parameters = validateAndFixMenuItemIds(parameters, context);
      console.log("✅ Menu item IDs validated and fixed");
    } catch (error) {
      console.error("❌ Menu item validation failed:", error);
      return null;
    }
  }

  switch (functionName) {
    case "place_order":
      return createConfirmOrderAction(
        parameters.items.map((item: any) => ({
          id: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.specialRequests || ""
        })),
        parameters.estimatedTotal,
        context.restaurantId,
        parameters.customerNotes
      );

    case "add_to_existing_order":
      // For adding items to existing orders, we need to create a specific order edit action
      // This should use the editOrder mutation with 'add_item' action
      return {
        id: generateActionId(),
        type: "ADD_ITEM_TO_ORDER" as ActionType,
        data: {
          action: 'add_item',
          itemData: {
            menuItemId: parameters.items[0]?.menuItemId || "",
            name: parameters.items[0]?.name || "",
            quantity: parameters.items[0]?.quantity || 1,
            price: parameters.items[0]?.price || 0,
            notes: parameters.items[0]?.specialRequests || ""
          }
        },
        confirmationMessage: `Add ${parameters.items[0]?.quantity || 1}x ${parameters.items[0]?.name || 'item'} to your existing order?`,
        requiresConfirmation: true,
        restaurantId: context.restaurantId,
        timestamp: new Date(),
        description: `Add ${parameters.items[0]?.quantity || 1}x ${parameters.items[0]?.name || 'item'} to order`
      };

    case "add_to_existing_order":
      // Check if existing orders can be modified before allowing additions
      if (ctx) {
        const statusCheck = await checkOrderStatusForModification(context, ctx);
        if (!statusCheck.canModify) {
          return {
            id: generateActionId(),
            type: "EXPLAIN_ORDER_LOCKED" as ActionType,
            data: {
              reason: statusCheck.reason,
              orderStatus: statusCheck.orderStatus,
              suggestedAction: "place_new_order"
            },
            confirmationMessage: `I'm sorry, but ${statusCheck.reason}. Orders can't be modified once they're being prepared. Would you like to place a new order instead?`,
            requiresConfirmation: false,
            restaurantId: context.restaurantId,
            timestamp: new Date(),
            description: "Cannot add to existing order - order is being prepared"
          };
        }
      }
      
      // For adding items to existing orders, we need to create a specific order edit action
      return {
        id: generateActionId(),
        type: "ADD_ITEM_TO_ORDER" as ActionType,
        data: {
          action: 'add_item',
          itemData: {
            menuItemId: parameters.items[0]?.menuItemId || "",
            name: parameters.items[0]?.name || "",
            quantity: parameters.items[0]?.quantity || 1,
            price: parameters.items[0]?.price || 0,
            notes: parameters.items[0]?.specialRequests || ""
          }
        },
        confirmationMessage: `Add ${parameters.items[0]?.quantity || 1}x ${parameters.items[0]?.name || 'item'} to your existing order?`,
        requiresConfirmation: true,
        restaurantId: context.restaurantId,
        timestamp: new Date(),
        description: `Add ${parameters.items[0]?.quantity || 1}x ${parameters.items[0]?.name || 'item'} to order`
      };

    case "modify_order":
      // Check order status first before allowing modifications
      if (ctx) {
        const statusCheck = await checkOrderStatusForModification(context, ctx);
        if (!statusCheck.canModify) {
          return {
            id: generateActionId(),
            type: "EXPLAIN_ORDER_LOCKED" as ActionType,
            data: {
              reason: statusCheck.reason,
              orderStatus: statusCheck.orderStatus,
              suggestedAction: "contact_staff"
            },
            confirmationMessage: `I'm sorry, but ${statusCheck.reason}. Once your order is being prepared, changes can only be made by speaking with our staff directly.`,
            requiresConfirmation: false,
            restaurantId: context.restaurantId,
            timestamp: new Date(),
            description: "Cannot modify order - order is being prepared"
          };
        }
      }
      
      // Handle different types of order modifications
      if (parameters.modificationType === "remove_item") {
        return {
          id: generateActionId(),
          type: "REMOVE_ITEM_FROM_ORDER" as ActionType,
          data: {
            orderId: parameters.orderId,
            targetItem: parameters.targetItem,
            reason: parameters.customerReason || "Customer request"
          },
          confirmationMessage: `Remove ${parameters.targetItem?.name || 'item'} from your order?`,
          requiresConfirmation: true,
          restaurantId: context.restaurantId,
          timestamp: new Date(),
          description: `Remove ${parameters.targetItem?.name || 'item'} from order`
        };
      } else {
        // For other modification types, use the generic order edit action
        return createOrderEditAction(
          context.restaurantId,
          context.tableNumber
        );
      }

    case "cancel_order":
      // Check order status first before allowing cancellation
      if (ctx) {
        const statusCheck = await checkOrderStatusForModification(context, ctx);
        if (!statusCheck.canModify) {
          return {
            id: generateActionId(),
            type: "EXPLAIN_ORDER_LOCKED" as ActionType,
            data: {
              reason: statusCheck.reason,
              orderStatus: statusCheck.orderStatus,
              suggestedAction: "contact_staff"
            },
            confirmationMessage: `I'm sorry, but ${statusCheck.reason}. Once your order is being prepared, cancellations can only be made by speaking with our staff directly. There may be a cancellation fee.`,
            requiresConfirmation: false,
            restaurantId: context.restaurantId,
            timestamp: new Date(),
            description: "Cannot cancel order - order is being prepared"
          };
        }
      }
      
      return {
        id: generateActionId(),
        type: "CANCEL_ORDER" as ActionType,
        data: {
          orderId: parameters.orderId,
          cancellationType: parameters.cancellationType,
          itemsToCancel: parameters.itemsToCancel,
          reason: parameters.reason
        },
        confirmationMessage: `Cancel ${parameters.cancellationType === 'full_order' ? 'entire order' : 'selected items'}? Reason: ${parameters.reason}`,
        requiresConfirmation: true,
        restaurantId: context.restaurantId,
        timestamp: new Date(),
        description: `Cancel ${parameters.cancellationType === 'full_order' ? 'entire order' : 'selected items'}`
      };

    case "check_order_status":
      return createOrderCheckAction(
        context.restaurantId,
        context.tableNumber
      );

    case "request_recommendations":
      return createRecommendationAction(
        [], // Will be populated by recommendation engine
        `${parameters.preferenceType} recommendations${parameters.dietaryRestrictions ? ` for ${parameters.dietaryRestrictions.join(', ')}` : ''}`,
        context.restaurantId,
        context.tableNumber
      );

    case "clarify_customer_request":
      return createClarificationAction(
        parameters.ambiguousRequest,
        parameters.possibleOptions || [],
        context.restaurantId
      );

    case "handle_complaint_or_issue":
      return {
        id: generateActionId(),
        type: "HANDLE_COMPLAINT" as ActionType,
        data: {
          issueType: parameters.issueType,
          severity: parameters.severity,
          description: parameters.description,
          needsStaffAttention: parameters.needsStaffAttention
        },
        confirmationMessage: `I understand you have a ${parameters.issueType} issue. ${parameters.needsStaffAttention ? 'I\'ll get staff to help immediately.' : 'Let me help resolve this.'}`,
        requiresConfirmation: true,
        restaurantId: context.restaurantId,
        timestamp: new Date(),
        description: `Handle ${parameters.issueType} complaint`
      };

    case "provide_information":
      return {
        id: generateActionId(),
        type: "PROVIDE_INFO" as ActionType,
        data: {
          informationType: parameters.informationType,
          query: parameters.specificQuery,
          menuItemId: parameters.menuItemId
        },
        confirmationMessage: `I'll provide information about: ${parameters.specificQuery}`,
        requiresConfirmation: false,
        restaurantId: context.restaurantId,
        timestamp: new Date(),
        description: `Provide ${parameters.informationType} information`
      };

    case "no_action_needed":
      // Return null for no action needed - just conversational
      return null;

    default:
      console.warn("⚠️ Unknown AI function:", functionName);
      return null;
  }
}

/**
 * Calculate confidence score for AI decision
 */
function calculateAIConfidence(
  functionName: string,
  parameters: any,
  context: AIActionContext
): number {
  let confidence = 0.8; // Base confidence

  // Boost confidence for well-structured requests
  if (functionName === "place_order" && parameters.items?.length > 0) {
    confidence += 0.1;
  }

  // Boost confidence if menu items are properly matched
  if (parameters.items && context.menuItems) {
    const matchedItems = parameters.items.filter((item: any) =>
      context.menuItems!.some(menuItem => menuItem.id === item.menuItemId)
    );
    confidence += (matchedItems.length / parameters.items.length) * 0.1;
  }

  // Reduce confidence for ambiguous requests
  if (functionName === "clarify_customer_request") {
    confidence -= 0.2;
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Fallback to pattern matching if AI fails
 * This imports the old system as a backup
 */
export async function fallbackToPatternMatching(
  userMessage: string,
  context: AIActionContext
): Promise<PendingAction | null> {
  console.log("🔄 Falling back to pattern matching...");
  
  try {
    // Import the old action detection as fallback
    const { detectUserActionIntent } = await import("./actionDetection");
    
    return detectUserActionIntent(userMessage, {
      restaurantId: context.restaurantId,
      tableNumber: context.tableNumber,
      menuItems: context.menuItems,
      conversationHistory: context.conversationHistory
    });
  } catch (error) {
    console.error("🚨 Fallback pattern matching failed:", error);
    return null;
  }
}

/**
 * Hybrid approach: Try AI first, fallback to patterns if needed
 */
export async function detectActionHybrid(
  userMessage: string,
  context: AIActionContext
): Promise<AIActionResult> {
  
  // Try AI detection first
  const aiResult = await detectActionWithAI(userMessage, context);
  
  // If AI failed or has low confidence, try pattern matching
  if (aiResult.fallbackToPatterns || aiResult.confidence < 0.5) {
    console.log("🔄 AI confidence too low, trying pattern matching fallback...");
    
    const patternAction = await fallbackToPatternMatching(userMessage, context);
    
    if (patternAction) {
      return {
        action: patternAction,
        confidence: 0.6, // Medium confidence for pattern matching
        reasoning: "AI failed, used pattern matching fallback",
        fallbackToPatterns: true,
        aiResponse: aiResult.aiResponse
      };
    }
  }
  
  return aiResult;
} 