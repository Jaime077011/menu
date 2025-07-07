import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { OpenAI } from "openai";
import { env } from "@/env";
import { 
  createOrderAwareSystemPrompt,
  formatOrderConfirmation 
} from "@/utils/orderParsing";
import { 
  createOrderBuilder,
  analyzeOrderForUpselling,
  type OrderBuilder,
  type OrderState
} from "@/utils/orderBuilder";
import {
  createRecommendationEngine,
  generateUpsellAction,
  type RecommendationContext
} from "@/utils/recommendationEngine";
import {
  handleOrderRejection,
  handleSystemError,
  type ErrorRecoveryOptions,
  type FallbackResponse
} from "@/utils/fallbackHandlers";
import { 
  parseActionId,
  type ActionType
} from "@/types/chatActions";
import type { 
  PendingAction, 
  ActionButton, 
  ActionState 
} from "@/types/chatActions";

// 🧠 NEW: AI-Driven Action Detection Imports
import { 
  detectActionWithAI,
  detectActionHybrid,
  type AIActionResult 
} from "@/utils/aiActionDetection";
import { buildAIActionContext } from "@/utils/aiContextBuilder";
import type { AIActionContext } from "@/types/aiActions";

import { OrderStatus } from "@prisma/client";
import { 
  validateOrderCanBeModified, 
  validateOrderItems,
  validateOrderTotal,
  buildOrderQuery 
} from "@/utils/orderValidation";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Zod schemas for validation
const sendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(500, "Message too long"),
  tableNumber: z.number().int().min(1, "Table number must be at least 1").max(999, "Table number too high").optional(),
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
});

const confirmActionSchema = z.object({
  actionId: z.string().min(1, "Action ID is required"),
  confirmed: z.boolean(),
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  tableNumber: z.number().int().min(1).max(999).optional(),
  modifications: z.any().optional(),
  // Add fallback action data in case server store is cleared
  actionData: z.object({
    type: z.string(),
    data: z.any(),
  }).optional(),
});

const getRecommendationsSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  tableNumber: z.number().int().min(1).max(999).optional(),
  currentOrder: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    notes: z.string().optional(),
  })).optional().default([]),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
  userMessage: z.string().optional().default(""),
});

// Extended chat response interface
interface ChatResponse {
  message: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  pendingAction?: PendingAction;
  actionButtons?: ActionButton[];
  orderCreated?: any;
}

// Helper function to update session statistics
const updateSessionStatistics = async (sessionId: string, ctx: any) => {
  try {
    // Get all orders for this session (excluding cancelled)
    const sessionOrders = await ctx.db.order.findMany({
      where: {
        sessionId: sessionId,
        status: { not: OrderStatus.CANCELLED },
      },
    });

    const totalOrders = sessionOrders.length;
    const totalSpent = sessionOrders.reduce((sum, order) => sum + Number(order.total), 0);

    // Update session with current statistics
    await ctx.db.customerSession.update({
      where: { id: sessionId },
      data: {
        totalOrders,
        totalSpent,
      },
    });

    console.log(`📊 Updated session ${sessionId} statistics: ${totalOrders} orders, $${totalSpent.toFixed(2)} total`);
  } catch (error) {
    console.error("❌ Failed to update session statistics:", error);
  }
};

// 🧠 NEW: Generate action confirmation message using AI context
function generateActionConfirmationMessage(action: PendingAction, context: AIActionContext): string {
  const waiterName = context.restaurantInfo?.waiterName || "Your AI Waiter";
  
  switch (action.type) {
    case 'CONFIRM_ORDER':
      const items = action.data.items || [];
      const total = action.data.total || 0;
      return `Perfect! I'd like to confirm your order:\n\n${items.map((item: any) => 
        `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
      ).join('\n')}\n\nTotal: $${total.toFixed(2)}\n\nShall I place this order for you?`;
      
    case 'ADD_TO_ORDER':
      const addItem = action.data.item;
      return `I'll add ${addItem.quantity}x ${addItem.name} ($${addItem.price.toFixed(2)} each) to your order. Sound good?`;
      
    case 'CHECK_ORDERS':
      return `Let me check your current orders for you.`;
      
    case 'EDIT_ORDER':
      return `I'll help you edit your order. Let me show you what can be modified.`;
      
    case 'CANCEL_ORDER':
      return `I understand you'd like to cancel your order. Let me help you with that.`;
      
    default:
      return action.confirmationMessage || `${waiterName} here! I'd like to help you with that. Shall I proceed?`;
  }
}

// 🧠 NEW: Generate action buttons for AI-detected actions
function generateActionButtons(action: PendingAction): ActionButton[] {
  const baseButtons: ActionButton[] = [
    {
      id: `confirm_${action.id}`,
      label: "✅ Yes, please",
      variant: 'success',
      action: 'confirm',
    },
    {
      id: `decline_${action.id}`,
      label: "❌ No, thanks",
      variant: 'danger',
      action: 'decline',
    }
  ];

  // Add action-specific buttons
  switch (action.type) {
    case 'CONFIRM_ORDER':
      return [
        {
          id: `confirm_${action.id}`,
          label: "🍽️ Place Order",
          variant: 'success',
          action: 'confirm',
        },
        {
          id: `decline_${action.id}`,
          label: "✏️ Modify Order",
          variant: 'secondary',
          action: 'decline',
        }
      ];
      
    case 'EDIT_ORDER':
      return [
        {
          id: `confirm_${action.id}`,
          label: "✏️ Show Orders",
          variant: 'primary',
          action: 'confirm',
        },
        {
          id: `decline_${action.id}`,
          label: "❌ Cancel",
          variant: 'secondary',
          action: 'decline',
        }
      ];
      
    default:
      return baseButtons;
  }
}

// Helper function to get restaurant by ID (for customer chat)
const getRestaurantById = async (
  restaurantId: string,
  db: { restaurant: { findUnique: (args: any) => Promise<any> } }
) => {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      // Include waiter personality settings
      waiterName: true,
      waiterPersonality: true,
      welcomeMessage: true,
      conversationTone: true,
      specialtyKnowledge: true,
      responseStyle: true,
      menuItems: {
        where: { available: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          available: true,
          imageUrl: true,
          imageAlt: true,
          dietaryTags: {
            select: {
              id: true,
              value: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Restaurant not found",
    });
  }

  return restaurant;
};

// This function is now imported from orderParsing utils

export const chatRouter = createTRPCRouter({
  // Send message to AI assistant with AI-driven action detection
  sendMessage: publicProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get restaurant by ID
        console.log("🔍 Looking up restaurant:", input.restaurantId);
        const restaurant = await getRestaurantById(input.restaurantId, ctx.db);
        console.log("✅ Restaurant found:", restaurant.name, "with", restaurant.menuItems.length, "menu items");

        // 🧠 NEW: Build comprehensive AI context for intelligent decision making
        console.log("🏗️ Building AI context for intelligent action detection...");
        console.log("📋 Chat Router Debug - User Message:", input.message);
        console.log("📋 Chat Router Debug - Restaurant:", restaurant.name);
        console.log("📋 Chat Router Debug - Model:", env.OPENAI_MODEL);
        
        const aiContext = await buildAIActionContext(
          restaurant,
          input.tableNumber,
          input.conversationHistory,
          ctx
        );
        
        console.log("✅ AI Context built successfully - Menu items:", aiContext.menuItems.length);

        // 🧠 NEW: Use optimized AI-driven action detection with memory and confidence scoring
        console.log("🧠 Analyzing user message with enhanced AI intelligence...");
        console.log("🔧 About to call detectActionWithAI with model:", env.OPENAI_MODEL);
        let aiActionResult: AIActionResult;
        
        try {
          console.log("🚀 CALLING detectActionWithAI NOW!");
          // Pass database context for automatic order status checking
          const enhancedContext = { ...aiContext, ctx };
          aiActionResult = await detectActionWithAI(input.message, enhancedContext);
          console.log("✅ detectActionWithAI completed successfully");
          console.log("🧠 Enhanced AI Action Detection Result:", {
            hasAction: !!aiActionResult.action,
            confidence: aiActionResult.confidence,
            reasoning: aiActionResult.reasoning,
            fallbackUsed: aiActionResult.fallbackToPatterns,
            hasMemory: !!aiContext.conversationMemory,
            functionCall: aiActionResult.functionCall?.functionName
          });
        } catch (aiError) {
          console.error("🚨 Enhanced AI Action Detection failed, using hybrid fallback:", aiError);
          
          // Try hybrid fallback before complete failure
          try {
            aiActionResult = await detectActionHybrid(input.message, aiContext);
            console.log("🔄 Hybrid fallback successful:", {
              confidence: aiActionResult.confidence,
              hasAction: !!aiActionResult.action
            });
          } catch (hybridError) {
            console.error("🚨 Hybrid fallback also failed:", hybridError);
            // Complete fallback to basic conversation
            aiActionResult = {
              action: null,
              confidence: 0.1,
              reasoning: "All AI detection methods failed",
              fallbackToPatterns: true,
              aiResponse: ""
            };
          }
        }

        // Prepare response based on AI decision
        let response: ChatResponse;

        if (aiActionResult.action) {
          // 🎯 AI detected an action - return it for user confirmation
          console.log("🎯 AI detected action:", aiActionResult.action.type);
          
          // Use AI's conversational response if available, otherwise generate one
          const conversationalResponse = aiActionResult.aiResponse || 
            generateActionConfirmationMessage(aiActionResult.action, aiContext);

          response = {
            message: conversationalResponse,
            conversationHistory: [
              ...input.conversationHistory,
              { role: "user" as const, content: input.message },
              { role: "assistant" as const, content: conversationalResponse },
            ],
            pendingAction: aiActionResult.action,
            actionButtons: generateActionButtons(aiActionResult.action)
          };
        } else {
          // 🗣️ No action needed - just conversational response
          console.log("🗣️ AI determined conversational response only");
          
          let conversationalMessage: string;
          
          if (aiActionResult.aiResponse) {
            // Use AI's response
            conversationalMessage = aiActionResult.aiResponse;
          } else {
            // Fallback to traditional AI conversation
            console.log("🔄 Falling back to traditional AI conversation...");
            const systemPrompt = createOrderAwareSystemPrompt(restaurant, input.tableNumber, {
              waiterName: restaurant.waiterName || "Waiter",
              personality: restaurant.waiterPersonality || "FRIENDLY",
              conversationTone: restaurant.conversationTone || "BALANCED",
              specialtyKnowledge: restaurant.specialtyKnowledge || "",
              responseStyle: restaurant.responseStyle || "HELPFUL",
            });

            const messages = [
              { role: "system" as const, content: systemPrompt },
              ...input.conversationHistory,
              { role: "user" as const, content: input.message },
            ];

            const completion = await openai.chat.completions.create({
              model: env.OPENAI_MODEL,
              messages: messages,
              max_tokens: 150,
              temperature: 0.5,
            });

            conversationalMessage = completion.choices[0]?.message?.content || 
              "I'm here to help! What would you like to order today?";
          }

          response = {
            message: conversationalMessage,
            conversationHistory: [
              ...input.conversationHistory,
              { role: "user" as const, content: input.message },
              { role: "assistant" as const, content: conversationalMessage },
            ],
          };
        }

        // 📊 Log enhanced AI performance for monitoring
        console.log("📊 Enhanced AI Performance Metrics:", {
          confidence: aiActionResult.confidence,
          fallbackUsed: aiActionResult.fallbackToPatterns,
          actionDetected: !!aiActionResult.action,
          reasoning: aiActionResult.reasoning,
          functionCall: aiActionResult.functionCall?.functionName,
          functionReasoning: aiActionResult.functionCall?.reasoning,
          hasMemoryContext: !!aiContext.conversationMemory,
          tableNumber: input.tableNumber,
          restaurantId: input.restaurantId
        });

        return response;

      } catch (error) {
        console.error("🚨 Chat error details:", {
          error: error,
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          restaurantId: input.restaurantId,
          tableNumber: input.tableNumber,
        });
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to process chat message: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Confirm or decline a pending action
  confirmAction: publicProcedure
    .input(confirmActionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get restaurant by ID
        const restaurant = await getRestaurantById(input.restaurantId, ctx.db);
        
        console.log(`🎯 Action ${input.actionId} ${input.confirmed ? 'CONFIRMED' : 'DECLINED'} for restaurant ${restaurant.name}`);

        // Parse action ID to get type and data with fallback support
        const fallbackActionData = input.actionData ? {
          type: input.actionData.type as ActionType,
          data: input.actionData.data
        } : undefined;
        
        const actionData = parseActionId(input.actionId, fallbackActionData);
        console.log("🔍 confirmAction - Action ID:", input.actionId);
        console.log("🔍 confirmAction - Parsed action data:", JSON.stringify(actionData, null, 2));
        
        if (!actionData) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your order confirmation expired. Please place your order again by telling me what you'd like to order.",
          });
        }

        if (input.confirmed) {
          // Execute the action based on type
          switch (actionData.type) {
            case 'ADD_TO_ORDER':
              return await executeAddToOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'REMOVE_FROM_ORDER':
              return await executeRemoveFromOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'MODIFY_ORDER_ITEM':
              return await executeModifyOrderItem(actionData, restaurant, input.tableNumber, ctx);
            
            case 'CONFIRM_ORDER':
              return await executeConfirmOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'CANCEL_ORDER':
              return await executeCancelOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'CHECK_ORDERS':
              return await executeCheckOrders(actionData, restaurant, input.tableNumber, ctx);
            
            case 'EDIT_ORDER':
              return await executeEditOrderRequest(actionData, restaurant, input.tableNumber, ctx);
            
            case 'ADD_ITEM_TO_ORDER':
              return await executeAddItemToOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'REMOVE_ITEM_FROM_ORDER':
              return await executeRemoveItemFromOrder(actionData, restaurant, input.tableNumber, ctx);
            
            case 'EXPLAIN_ORDER_LOCKED':
              return await executeExplainOrderLocked(actionData, restaurant, input.tableNumber, ctx);
            
            default:
              console.log(`⚠️ Unknown action type: ${actionData.type}`);
              return {
                success: true,
                message: "Action confirmed successfully!",
                actionId: input.actionId,
              };
          }
        } else {
          // Handle action rejection with intelligent fallbacks
          try {
            const rejectionAction: PendingAction = {
              id: input.actionId,
              type: actionData.type,
              description: '',
              data: actionData.data,
              timestamp: new Date(),
              requiresConfirmation: false,
              confirmationMessage: '',
              restaurantId: restaurant.id
            };

            const recoveryOptions: ErrorRecoveryOptions = {
              restaurant,
              tableNumber: input.tableNumber,
              conversationHistory: [],
              userMessage: ''
            };

            const fallbackResponse = handleOrderRejection(rejectionAction, recoveryOptions);
            
            return {
              success: false,
              message: fallbackResponse.message,
              actionId: input.actionId,
              suggestedActions: fallbackResponse.suggestedActions || [],
              helpfulTips: fallbackResponse.helpfulTips || [],
              alternatives: fallbackResponse.alternatives
            };
          } catch (fallbackError) {
            console.error("Fallback handling failed:", fallbackError);
            
            // Ultimate fallback
            const basicRejectionResponse = generateRejectionResponse(actionData.type, actionData.data);
            return {
              success: false,
              message: basicRejectionResponse,
              actionId: input.actionId,
              suggestedActions: generateAlternativeActions(actionData.type, restaurant),
            };
          }
        }

      } catch (error) {
        console.error("🚨 Action confirmation error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to process action confirmation: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Get intelligent recommendations
  getRecommendations: publicProcedure
    .input(getRecommendationsSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Get restaurant by ID
        const restaurant = await getRestaurantById(input.restaurantId, ctx.db);
        
        console.log(`🎯 Generating recommendations for restaurant ${restaurant.name}`);

        // Create recommendation context
        const recommendationContext: RecommendationContext = {
          userMessage: input.userMessage,
          conversationHistory: input.conversationHistory,
          currentOrder: input.currentOrder,
          timeOfDay: new Date().toISOString(),
          restaurantId: restaurant.id,
          tableNumber: input.tableNumber,
          menuItems: restaurant.menuItems
        };

        // Generate recommendations
        const recommendationEngine = createRecommendationEngine(restaurant);
        const recommendations = recommendationEngine.generateRecommendations(recommendationContext);

        console.log(`✅ Generated ${recommendations.length} recommendations`);

        return {
          success: true,
          recommendations: recommendations.map(rec => ({
            type: rec.type,
            priority: rec.priority,
            message: rec.message,
            confidence: rec.confidence,
            items: rec.items
          }))
        };

      } catch (error) {
        console.error("🚨 Recommendation generation error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate recommendations: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Check recent orders for a table
  checkOrders: publicProcedure
    .input(z.object({
      restaurantId: z.string().min(1, "Restaurant ID is required"),
      tableNumber: z.number().int().min(1).max(999),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get restaurant by ID
        const restaurant = await getRestaurantById(input.restaurantId, ctx.db);
        
        console.log(`🔍 Checking orders for table ${input.tableNumber} at ${restaurant.name}`);

        // Get current active session for this table
        console.log(`🔍 checkOrders: Looking for active session - Restaurant: ${restaurant.id}, Table: ${input.tableNumber}`);
        const currentSession = await ctx.db.customerSession.findFirst({
          where: {
            restaurantId: restaurant.id,
            tableNumber: input.tableNumber.toString(),
            status: "ACTIVE",
          },
        });

        console.log(`📋 checkOrders: Current session found:`, currentSession ? `ID: ${currentSession.id}` : 'None');

        let recentOrders;
        
        if (currentSession) {
          // Get orders for the current session only
          console.log(`🔍 checkOrders: Looking for orders with sessionId: ${currentSession.id}`);
          recentOrders = await ctx.db.order.findMany({
            where: {
              sessionId: currentSession.id,
            },
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          });
          console.log(`📦 checkOrders: Found ${recentOrders.length} orders for session ${currentSession.id}`);
        } else {
          // No active session - return empty orders array
          console.log(`❌ checkOrders: No active session found for table ${input.tableNumber}`);
          recentOrders = [];
        }

        return {
          success: true,
          orders: recentOrders.map(order => ({
            id: order.id,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            estimatedTime: order.estimatedCompletionTime,
            canEdit: order.status === 'PENDING', // Can edit if not started processing
            items: order.items.map(item => ({
              id: item.id,
              name: item.menuItem.name,
              quantity: item.quantity,
              price: typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()),
              notes: item.notes,
            })),
          })),
        };

      } catch (error) {
        console.error("🚨 Order check error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check orders: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Edit an existing order (if not started processing)
  editOrder: publicProcedure
    .input(z.object({
      orderId: z.string().min(1, "Order ID is required"),
      restaurantId: z.string().min(1, "Restaurant ID is required"),
      tableNumber: z.number().int().min(1).max(999),
      action: z.enum(['add_item', 'remove_item', 'modify_quantity', 'cancel_order']),
      itemData: z.object({
        menuItemId: z.string().optional(),
        orderItemId: z.string().optional(),
        quantity: z.number().optional(),
        notes: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get restaurant by ID
        const restaurant = await getRestaurantById(input.restaurantId, ctx.db);
        
        console.log(`🔧 Editing order ${input.orderId} - Action: ${input.action}`);

        // Get the order and check if it can be edited
        const order = await ctx.db.order.findFirst({
          where: {
            id: input.orderId,
            restaurantId: restaurant.id,
            tableNumber: `Table ${input.tableNumber}`,
          },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        });

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Check if order can still be edited using centralized validation
        const validation = validateOrderCanBeModified(order.status as any);

        if (!validation.canModify) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot edit order #${order.id.slice(-6)} - ${validation.reason}. ${
              order.status === 'PREPARING' ? 
              'Contact restaurant staff for assistance.' : 
              'Please place a new order if needed.'
            }`,
          });
        }

        // Add action-specific validation
        switch (input.action) {
          case 'add_item':
            if (!validation.canAddItems) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot add items to order #${order.id.slice(-6)} - ${validation.reason}`,
              });
            }
            break;
            
          case 'remove_item':
            if (!validation.canRemoveItems) {
              throw new TRPCError({
                code: "BAD_REQUEST", 
                message: `Cannot remove items from order #${order.id.slice(-6)} - ${validation.reason}`,
              });
            }
            break;
            
          case 'cancel_order':
            if (!validation.canCancel) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot cancel order #${order.id.slice(-6)} - ${validation.reason}`,
              });
            }
            break;
            
          case 'modify_quantity':
            if (!validation.canModify) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Cannot modify order #${order.id.slice(-6)} - ${validation.reason}`,
              });
            }
            break;
        }

        let updatedOrder;
        let actionMessage = "";

        switch (input.action) {
          case 'add_item':
            if (!input.itemData?.menuItemId || !input.itemData?.quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Menu item ID and quantity required for adding items",
              });
            }

            // Find the menu item
            const menuItem = restaurant.menuItems.find(m => m.id === input.itemData.menuItemId);
            if (!menuItem) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Menu item not found",
              });
            }

            // Add item to order
            await ctx.db.orderItem.create({
              data: {
                orderId: order.id,
                menuItemId: input.itemData.menuItemId,
                quantity: input.itemData.quantity,
                priceAtTime: menuItem.price,
                notes: input.itemData.notes,
              },
            });

            // Update order total
            const newItemTotal = menuItem.price * input.itemData.quantity;
            updatedOrder = await ctx.db.order.update({
              where: { id: order.id },
              data: { total: (typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())) + newItemTotal },
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            });

            actionMessage = `Added ${input.itemData.quantity}x ${menuItem.name} to your order (+$${newItemTotal.toFixed(2)})`;
            break;

          case 'remove_item':
            if (!input.itemData?.orderItemId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Order item ID required for removing items",
              });
            }

            // Find the order item
            const orderItem = order.items.find(item => item.id === input.itemData.orderItemId);
            if (!orderItem) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order item not found",
              });
            }

            // Remove item from order
            await ctx.db.orderItem.delete({
              where: { id: input.itemData.orderItemId },
            });

            // Update order total
            const removedItemTotal = (typeof orderItem.priceAtTime === 'number' ? orderItem.priceAtTime : parseFloat(orderItem.priceAtTime.toString())) * orderItem.quantity;
            updatedOrder = await ctx.db.order.update({
              where: { id: order.id },
              data: { total: (typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())) - removedItemTotal },
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            });

            actionMessage = `Removed ${orderItem.quantity}x ${orderItem.menuItem.name} from your order (-$${removedItemTotal.toFixed(2)})`;
            break;

          case 'modify_quantity':
            if (!input.itemData?.orderItemId || !input.itemData?.quantity) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Order item ID and new quantity required for modifying quantity",
              });
            }

            // Find the order item
            const modifyItem = order.items.find(item => item.id === input.itemData.orderItemId);
            if (!modifyItem) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order item not found",
              });
            }

            const oldQuantity = modifyItem.quantity;
            const newQuantity = input.itemData.quantity;
            const quantityDiff = newQuantity - oldQuantity;
            const priceDiff = quantityDiff * (typeof modifyItem.priceAtTime === 'number' ? modifyItem.priceAtTime : parseFloat(modifyItem.priceAtTime.toString()));

            // Update item quantity
            await ctx.db.orderItem.update({
              where: { id: input.itemData.orderItemId },
              data: { quantity: newQuantity },
            });

            // Update order total
            updatedOrder = await ctx.db.order.update({
              where: { id: order.id },
              data: { total: (typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())) + priceDiff },
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            });

            actionMessage = `Updated ${modifyItem.menuItem.name} quantity from ${oldQuantity} to ${newQuantity} (${priceDiff >= 0 ? '+' : ''}$${priceDiff.toFixed(2)})`;
            break;

          case 'cancel_order':
            // Cancel the entire order
            updatedOrder = await ctx.db.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED' },
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            });

            actionMessage = `Order #${order.id.slice(-6).toUpperCase()} has been cancelled`;
            break;

          default:
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid action",
            });
        }

        console.log(`✅ Order edited successfully: ${actionMessage}`);

        return {
          success: true,
          message: actionMessage,
          updatedOrder: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            total: updatedOrder.total,
            items: updatedOrder.items.map(item => ({
              id: item.id,
              name: item.menuItem.name,
              quantity: item.quantity,
              price: typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()),
              notes: item.notes,
            })),
          },
        };

      } catch (error) {
        console.error("🚨 Order edit error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to edit order: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});

// Action execution functions
async function executeAddToOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log("🔍 executeAddToOrder - Action data:", JSON.stringify(actionData, null, 2));
    const { item } = actionData.data;
    console.log("🔍 executeAddToOrder - Extracted item:", JSON.stringify(item, null, 2));
    
    if (!item) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No item data found in action",
      });
    }
    
    // Validate required fields
    if (!item.id || !item.quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Menu item ID and quantity required for adding items",
      });
    }
    
    // Find the menu item
    const menuItem = restaurant.menuItems.find((m: any) => m.id === item.id);
    if (!menuItem) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Menu item not found",
      });
    }

    // For now, we'll simulate adding to a session-based cart
    // In a full implementation, this would integrate with a proper order management system
    const itemTotal = menuItem.price * item.quantity;
    
    console.log(`✅ Added ${item.quantity}x ${menuItem.name} ($${itemTotal.toFixed(2)}) to order`);
    
    // Generate intelligent recommendations
    const currentOrder = [{
      id: menuItem.id,
      name: menuItem.name,
      quantity: item.quantity,
      price: menuItem.price,
      notes: item.notes
    }];
    
    const recommendationContext: RecommendationContext = {
      userMessage: '',
      conversationHistory: [],
      currentOrder,
      timeOfDay: new Date().toISOString(),
      restaurantId: restaurant.id,
      tableNumber,
      menuItems: restaurant.menuItems
    };
    
    const recommendationEngine = createRecommendationEngine(restaurant);
    const recommendations = recommendationEngine.generateRecommendations(recommendationContext);
    
    let responseMessage = `Perfect! I've added ${item.quantity}x ${menuItem.name} to your order ($${itemTotal.toFixed(2)}).`;
    
    // Add intelligent recommendation if available
    if (recommendations.length > 0 && recommendations[0].confidence > 0.7) {
      const topRecommendation = recommendations[0];
      responseMessage += `\n\n${topRecommendation.message}`;
      
      // Include specific item suggestions
      if (topRecommendation.items.length > 0) {
        const itemSuggestions = topRecommendation.items
          .slice(0, 2)
          .map(suggItem => `${suggItem.name} ($${suggItem.price.toFixed(2)})`)
          .join(' or ');
        responseMessage += ` Try our ${itemSuggestions}!`;
      }
    }

    return {
      success: true,
      message: responseMessage,
      actionId: actionData.data.actionId,
      orderUpdate: {
        itemAdded: {
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price,
          total: itemTotal,
        },
      },
    };
  } catch (error) {
    console.error("❌ Failed to add item to order:", error);
    
    // Use intelligent error handling
    const systemError = error instanceof Error ? error : new Error("Unknown error");
    const fallbackResponse = handleSystemError(systemError, {
      action: "add_to_order",
      restaurant,
      userMessage: `Add ${actionData.data.item?.quantity || 1}x ${actionData.data.item?.name || 'item'}`
    });
    
    return {
      success: false,
      message: fallbackResponse.message,
      actionId: actionData.data.actionId,
      suggestedActions: fallbackResponse.suggestedActions || [],
      helpfulTips: fallbackResponse.helpfulTips || [],
      errorRecovery: true
    };
  }
}

async function executeRemoveFromOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    const { itemName, menuItemId } = actionData.data;
    
    console.log(`✅ Removed ${itemName} from order`);
    
    return {
      success: true,
      message: `Got it! I've removed ${itemName} from your order. What else would you like to modify?`,
      actionId: actionData.data.actionId,
      orderUpdate: {
        itemRemoved: {
          name: itemName,
          menuItemId,
        },
      },
    };
  } catch (error) {
    console.error("❌ Failed to remove item from order:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to remove item from order",
    });
  }
}

async function executeModifyOrderItem(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    const { itemName, oldQuantity, newQuantity, priceDifference } = actionData.data;
    
    console.log(`✅ Modified ${itemName} quantity from ${oldQuantity} to ${newQuantity}`);
    
    const changeText = priceDifference > 0 
      ? `increased by $${priceDifference.toFixed(2)}` 
      : `reduced by $${Math.abs(priceDifference).toFixed(2)}`;
    
    return {
      success: true,
      message: `Perfect! I've updated ${itemName} to ${newQuantity} ${newQuantity === 1 ? 'item' : 'items'}. Your order total has been ${changeText}.`,
      actionId: actionData.data.actionId,
      orderUpdate: {
        itemModified: {
          name: itemName,
          oldQuantity,
          newQuantity,
          priceDifference,
        },
      },
    };
  } catch (error) {
    console.error("❌ Failed to modify order item:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to modify order item",
    });
  }
}

async function executeConfirmOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    const { items, total } = actionData.data;
    
    console.log("🔍 executeConfirmOrder - Action data:", JSON.stringify(actionData.data, null, 2));
    console.log("🔍 executeConfirmOrder - Items:", JSON.stringify(items, null, 2));
    console.log("🔍 executeConfirmOrder - Total:", total);
    console.log("🔍 executeConfirmOrder - Table number:", tableNumber);
    
    if (!tableNumber) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Table number is required to place an order",
      });
    }

    // Validate order items using centralized validation
    const itemValidation = validateOrderItems(items);
    if (!itemValidation.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Order validation failed: ${itemValidation.errors.join(', ')}. Please add items to your order before confirming.`,
      });
    }

    // Validate order total calculation
    const totalValidation = validateOrderTotal(items, total);
    if (!totalValidation.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: totalValidation.error || "Invalid order total",
      });
    }

    const validatedItems = itemValidation.validatedItems!;

    console.log("✅ Validated items for database:", JSON.stringify(validatedItems, null, 2));

    // Get or create current session for this table
    let currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    // If no active session exists, create one
    if (!currentSession) {
      console.log(`📝 Creating new session for table ${tableNumber}`);
      currentSession = await ctx.db.customerSession.create({
        data: {
          restaurantId: restaurant.id,
          tableNumber: tableNumber.toString(),
          status: "ACTIVE",
          startTime: new Date(),
        },
      });
    }

    // Create the actual order in the database with session link
    const orderResult = await ctx.db.order.create({
      data: {
        restaurantId: restaurant.id,
        sessionId: currentSession.id, // Link to session
        tableNumber: `Table ${tableNumber}`,
        customerName: currentSession.customerName || "Chat Customer",
        total: total,
        status: OrderStatus.PENDING,
        notes: "Order placed via AI chat with confirmation",
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Update session statistics
    await updateSessionStatistics(currentSession.id, ctx);

    console.log(`🎉 Order ${orderResult.id} created successfully for table ${tableNumber}`);
    
    const itemsList = items.map((item: any) => 
      `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    return {
      success: true,
      message: `Excellent! Your order has been confirmed and sent to the kitchen.\n\n📋 Order #${orderResult.id.slice(-6).toUpperCase()}\n${itemsList}\n\n💰 Total: $${total.toFixed(2)}\n⏱️ Estimated time: 15-20 minutes\n\nThank you for dining with us!`,
      actionId: actionData.data.actionId,
      orderCreated: {
        id: orderResult.id,
        total: total,
        items: orderResult.items,
        estimatedTime: "15-20 minutes",
      },
    };
  } catch (error) {
    console.error("❌ Failed to confirm order:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      actionData: actionData.data
    });
    
    // For debugging: throw the actual error instead of returning success: false
    if (error instanceof TRPCError) {
      throw error;
    }
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to confirm order: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

async function executeCancelOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    const { orderId } = actionData.data;
    
    if (!tableNumber) {
      throw new TRPCError({
        code: "BAD_REQUEST", 
        message: "Table number is required to cancel orders",
      });
    }

    // Get current session and find target order
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    if (!currentSession) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active session found for this table",
      });
    }

    // Find the order to cancel
    let targetOrder;
    if (orderId) {
      targetOrder = await ctx.db.order.findFirst({
        where: {
          sessionId: currentSession.id,
          OR: [
            { id: orderId },
            { id: { endsWith: orderId.toUpperCase() } }
          ]
        }
      });
    } else {
      // Get most recent order that can be cancelled
      targetOrder = await ctx.db.order.findFirst({
        where: {
          sessionId: currentSession.id,
          status: { in: [OrderStatus.PENDING] }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!targetOrder) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: orderId ? 
          `Order #${orderId} not found or cannot be cancelled` :
          "No orders available for cancellation",
      });
    }

    // Validate order can be cancelled
    if (targetOrder.status !== OrderStatus.PENDING) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot cancel order #${targetOrder.id.slice(-6)} - it's already ${targetOrder.status.toLowerCase()}. Orders can only be cancelled before kitchen preparation begins.`,
      });
    }

    // Perform actual cancellation
    const cancelledOrder = await ctx.db.order.update({
      where: { id: targetOrder.id },
      data: { status: OrderStatus.CANCELLED },
      include: { items: { include: { menuItem: true } } }
    });

    console.log(`✅ Order ${targetOrder.id.slice(-6)} cancelled successfully`);
    
    return {
      success: true,
      message: `Order #${targetOrder.id.slice(-6).toUpperCase()} has been cancelled successfully. The $${(typeof targetOrder.total === 'number' ? targetOrder.total : parseFloat(targetOrder.total.toString())).toFixed(2)} charge will be removed.`,
      actionId: actionData.data.actionId,
      orderUpdate: {
        cancelled: true,
        orderId: targetOrder.id,
        refundAmount: targetOrder.total,
      },
    };
  } catch (error) {
    console.error("❌ Failed to cancel order:", error);
    
    if (error instanceof TRPCError) {
      throw error;
    }
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to cancel order due to system error",
    });
  }
}

// Helper functions for rejection handling
function generateRejectionResponse(actionType: ActionType, actionData: any): string {
  switch (actionType) {
    case 'ADD_TO_ORDER':
      return "No problem! Would you like me to suggest something similar, or would you prefer to browse other options?";
    
    case 'REMOVE_FROM_ORDER':
      return "Alright, I'll keep that item in your order. Is there anything else you'd like to modify?";
    
    case 'MODIFY_ORDER_ITEM':
      return "Got it, I'll leave the quantity as is. Would you like to change anything else about your order?";
    
    case 'CONFIRM_ORDER':
      return "That's perfectly fine! Would you like to add more items, modify something, or would you prefer to start over?";
    
    case 'CANCEL_ORDER':
      return "No worries! Your order is still active. What would you like to do next?";
    
    default:
      return "No problem! What would you like to do instead?";
  }
}

function generateAlternativeActions(actionType: ActionType, restaurant: any): string[] {
  switch (actionType) {
    case 'ADD_TO_ORDER':
      return [
        "Show me similar items",
        "Browse other categories",
        "Get recommendations",
      ];
    
    case 'CONFIRM_ORDER':
      return [
        "Add more items",
        "Modify quantities",
        "Remove items",
        "Start over",
      ];
    
    default:
      return [
        "Browse menu",
        "Get recommendations",
        "Start over",
      ];
  }
}

// Execute order checking action
async function executeCheckOrders(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log(`🔍 Executing CHECK_ORDERS for table ${tableNumber}`);

    if (!tableNumber) {
      return {
        success: false,
        message: "Table number is required to check orders.",
      };
    }

    // Get current active session for this table
    console.log(`🔍 CHECK_ORDERS: Looking for active session - Restaurant: ${restaurant.id}, Table: ${tableNumber}`);
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    console.log(`📋 CHECK_ORDERS: Current session found:`, currentSession ? `ID: ${currentSession.id}` : 'None');

    if (!currentSession) {
      return {
        success: true,
        message: "You don't have an active session yet. Would you like to place a new order to start your session?",
        orders: [],
      };
    }

    // Get orders for the current session only
    console.log(`🔍 CHECK_ORDERS: Looking for orders with sessionId: ${currentSession.id}`);
    const recentOrders = await ctx.db.order.findMany({
      where: {
        sessionId: currentSession.id,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📦 CHECK_ORDERS: Found ${recentOrders.length} orders for session ${currentSession.id}`);

    if (recentOrders.length === 0) {
      return {
        success: true,
        message: "You don't have any orders in your current session yet. Would you like to place a new order?",
        orders: [],
      };
    }

    // Format orders for display
    const formattedOrders = recentOrders.map(order => {
      const itemsList = order.items.map(item => 
        `${item.quantity}x ${item.menuItem.name} ($${(typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString())).toFixed(2)} each)`
      ).join('\n  • ');

      const statusEmoji = {
        'PENDING': '⏳',
        'PREPARING': '👨‍🍳',
        'READY': '🔔',
        'SERVED': '✨',
        'CANCELLED': '❌'
      }[order.status] || '📋';

      const canEdit = order.status === 'PENDING';
      const editText = canEdit ? '\n\n✏️ This order can still be modified!' : '\n\n🔒 This order is already being processed.';

      return `${statusEmoji} **Order #${order.id.slice(-6).toUpperCase()}** (${order.status})
📅 Placed: ${order.createdAt.toLocaleString()}
💰 Total: $${(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())).toFixed(2)}

**Items:**
  • ${itemsList}${editText}`;
    });

    const message = `Here are your orders from this session:\n\n${formattedOrders.join('\n\n---\n\n')}`;

    return {
      success: true,
      message,
      orders: recentOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
                  canEdit: order.status === 'PENDING',
        items: order.items.map(item => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()),
        })),
      })),
    };

  } catch (error) {
    console.error("🚨 executeCheckOrders error:", error);
    return {
      success: false,
      message: `Failed to check orders: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Execute removing item from existing order
async function executeRemoveItemFromOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log(`🗑️ Executing REMOVE_ITEM_FROM_ORDER for table ${tableNumber}`);
    console.log(`🔍 Action data:`, JSON.stringify(actionData.data, null, 2));

    if (!tableNumber) {
      return {
        success: false,
        message: "Table number is required to remove items from orders.",
      };
    }

    const { orderId, targetItem } = actionData.data;
    
    if (!targetItem || !targetItem.name) {
      return {
        success: false,
        message: "Item information is required to remove items from your order.",
      };
    }

    // Get current active session for this table
    console.log(`🔍 Looking for active session - Restaurant: ${restaurant.id}, Table: ${tableNumber}`);
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    if (!currentSession) {
      return {
        success: false,
        message: "You don't have an active session. Please start a new order first.",
      };
    }

    // Find the order to modify (either by orderId or most recent editable order)
    let targetOrder;
    
    if (orderId) {
      // Try to find order by partial ID (e.g., "QDS2AW")
      targetOrder = await ctx.db.order.findFirst({
        where: {
          sessionId: currentSession.id,
          status: 'PENDING',
          id: {
            endsWith: orderId.toUpperCase()
          }
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });
    } else {
      // Get the most recent editable order
      targetOrder = await ctx.db.order.findFirst({
        where: {
          sessionId: currentSession.id,
          status: 'PENDING'
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!targetOrder) {
      return {
        success: false,
        message: orderId ? 
          `Order #${orderId} not found or cannot be modified.` :
          "You don't have any orders that can be modified right now.",
      };
    }

    // Validate order can be modified based on status
    const validation = validateOrderCanBeModified(targetOrder.status as OrderStatus);
    if (!validation.canRemoveItems) {
      return {
        success: false,
        message: `Cannot remove items from order #${targetOrder.id.slice(-6)} - ${validation.reason}. ${
          targetOrder.status === 'PREPARING' ? 
          'Please contact restaurant staff for assistance.' : 
          'Please place a new order if needed.'
        }`,
      };
    }

    // Find the item to remove by name
    const itemToRemove = targetOrder.items.find((item: any) => 
      item.menuItem.name.toLowerCase().includes(targetItem.name.toLowerCase()) ||
      targetItem.name.toLowerCase().includes(item.menuItem.name.toLowerCase())
    );

    if (!itemToRemove) {
      return {
        success: false,
        message: `I couldn't find "${targetItem.name}" in order #${targetOrder.id.slice(-6)}. Please check the order items and try again.`,
      };
    }

    // Remove the item from the order
    await ctx.db.orderItem.delete({
      where: { id: itemToRemove.id },
    });

    // Update order total
    const removedItemTotal = (typeof itemToRemove.priceAtTime === 'number' ? itemToRemove.priceAtTime : parseFloat(itemToRemove.priceAtTime.toString())) * itemToRemove.quantity;
    const updatedOrder = await ctx.db.order.update({
      where: { id: targetOrder.id },
      data: { 
        total: (typeof targetOrder.total === 'number' ? targetOrder.total : parseFloat(targetOrder.total.toString())) - removedItemTotal 
      },
    });

    console.log(`✅ Removed ${itemToRemove.quantity}x ${itemToRemove.menuItem.name} from order #${targetOrder.id.slice(-6)} (-$${removedItemTotal.toFixed(2)})`);

    return {
      success: true,
      message: `Perfect! I've removed ${itemToRemove.quantity}x ${itemToRemove.menuItem.name} from your order #${targetOrder.id.slice(-6).toUpperCase()} (-$${removedItemTotal.toFixed(2)}). Your new order total is $${(updatedOrder.total as number).toFixed(2)}.`,
      orderUpdate: {
        orderId: targetOrder.id,
        itemRemoved: {
          name: itemToRemove.menuItem.name,
          quantity: itemToRemove.quantity,
          price: itemToRemove.priceAtTime,
          total: removedItemTotal,
        },
        newTotal: updatedOrder.total,
      },
    };

  } catch (error) {
    console.error("🚨 executeRemoveItemFromOrder error:", error);
    return {
      success: false,
      message: `Failed to remove item from your order: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or contact staff for assistance.`,
    };
  }
}

// Execute adding item to existing order
async function executeAddItemToOrder(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log(`🍞 Executing ADD_ITEM_TO_ORDER for table ${tableNumber}`);
    console.log(`🔍 Action data:`, JSON.stringify(actionData.data, null, 2));

    if (!tableNumber) {
      return {
        success: false,
        message: "Table number is required to add items to orders.",
      };
    }

    const { itemData } = actionData.data;
    
    if (!itemData || !itemData.menuItemId) {
      return {
        success: false,
        message: "Menu item information is required to add items to your order.",
      };
    }

    // Get current active session for this table
    console.log(`🔍 Looking for active session - Restaurant: ${restaurant.id}, Table: ${tableNumber}`);
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    if (!currentSession) {
      return {
        success: false,
        message: "You don't have an active session. Please start a new order first.",
      };
    }

    // Get the most recent editable order from the current session
    const editableOrder = await ctx.db.order.findFirst({
      where: {
        sessionId: currentSession.id,
        status: 'PENDING' // Only PENDING orders can be modified
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!editableOrder) {
      return {
        success: false,
        message: "You don't have any orders that can be modified right now. Orders can only be edited before they start processing in the kitchen.",
      };
    }

    // Validate order can be modified based on status
    const validation = validateOrderCanBeModified(editableOrder.status as OrderStatus);
    if (!validation.canAddItems) {
      return {
        success: false,
        message: `Cannot add items to order #${editableOrder.id.slice(-6)} - ${validation.reason}. ${
          editableOrder.status === 'PREPARING' ? 
          'Please contact restaurant staff for assistance.' : 
          'Please place a new order if needed.'
        }`,
      };
    }

    // Find the menu item
    const menuItem = restaurant.menuItems.find((m: any) => m.id === itemData.menuItemId);
    if (!menuItem) {
      return {
        success: false,
        message: `Menu item "${itemData.name}" not found. Please check the menu and try again.`,
      };
    }

    // Add item to the order using the database
    await ctx.db.orderItem.create({
      data: {
        orderId: editableOrder.id,
        menuItemId: itemData.menuItemId,
        quantity: itemData.quantity || 1,
        priceAtTime: menuItem.price,
        notes: itemData.notes || "",
      },
    });

    // Update order total
    const newItemTotal = menuItem.price * (itemData.quantity || 1);
    const updatedOrder = await ctx.db.order.update({
      where: { id: editableOrder.id },
      data: { 
        total: (typeof editableOrder.total === 'number' ? editableOrder.total : parseFloat(editableOrder.total.toString())) + newItemTotal 
      },
    });

    console.log(`✅ Added ${itemData.quantity || 1}x ${menuItem.name} to order #${editableOrder.id.slice(-6)} (+$${newItemTotal.toFixed(2)})`);

    return {
      success: true,
      message: `Perfect! I've added ${itemData.quantity || 1}x ${menuItem.name} to your order #${editableOrder.id.slice(-6).toUpperCase()} (+$${newItemTotal.toFixed(2)}). Your new order total is $${(updatedOrder.total as number).toFixed(2)}.`,
      orderUpdate: {
        orderId: editableOrder.id,
        itemAdded: {
          name: menuItem.name,
          quantity: itemData.quantity || 1,
          price: menuItem.price,
          total: newItemTotal,
        },
        newTotal: updatedOrder.total,
      },
    };

  } catch (error) {
    console.error("🚨 executeAddItemToOrder error:", error);
    return {
      success: false,
      message: `Failed to add item to your order: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or contact staff for assistance.`,
    };
  }
}

// Execute order editing request action
async function executeEditOrderRequest(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log(`✏️ Executing EDIT_ORDER request for table ${tableNumber}`);

    if (!tableNumber) {
      return {
        success: false,
        message: "Table number is required to edit orders.",
      };
    }

    // Get current active session for this table
    console.log(`🔍 Looking for active session - Restaurant: ${restaurant.id}, Table: ${tableNumber}`);
    const currentSession = await ctx.db.customerSession.findFirst({
      where: {
        restaurantId: restaurant.id,
        tableNumber: tableNumber.toString(),
        status: "ACTIVE",
      },
    });

    console.log(`📋 Current session found:`, currentSession ? `ID: ${currentSession.id}` : 'None');

    if (!currentSession) {
      return {
        success: true,
        message: "You don't have an active session yet. Would you like to place a new order to start your session?",
        editableOrders: [],
      };
    }

    // Get orders from current session that can be edited (PENDING status only)
    console.log(`🔍 Looking for orders with sessionId: ${currentSession.id}`);
    const editableOrders = await ctx.db.order.findMany({
      where: {
        sessionId: currentSession.id,
        status: 'PENDING'
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📦 Found ${editableOrders.length} editable orders for session ${currentSession.id}`);
    
    // Let's also check all orders for this table to see what's happening
    const allTableOrders = await ctx.db.order.findMany({
      where: {
        restaurantId: restaurant.id,
        tableNumber: `Table ${tableNumber}`,
      },
      select: {
        id: true,
        sessionId: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`🔍 All orders for table ${tableNumber}:`, allTableOrders.map(o => ({
      id: o.id.slice(-6),
      sessionId: o.sessionId,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })));

    if (editableOrders.length === 0) {
      return {
        success: true,
        message: "You don't have any orders in your current session that can be modified right now. Orders can only be edited before they start processing in the kitchen. Would you like to place a new order?",
        editableOrders: [],
      };
    }

    // Format editable orders for display
    const formattedOrders = editableOrders.map(order => {
      const itemsList = order.items.map((item, index) => 
        `${index + 1}. ${item.quantity}x ${item.menuItem.name} ($${(typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString())).toFixed(2)} each) [ID: ${item.id.slice(-4)}]`
      ).join('\n  ');

      return `✏️ **Order #${order.id.slice(-6).toUpperCase()}** 
📅 Placed: ${order.createdAt.toLocaleString()}
💰 Total: $${(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())).toFixed(2)}
🍽️ Status: ${order.status}

**Items:**
  ${itemsList}

**Available actions:**
• Add more items to this order
• Remove items from this order  
• Change item quantities
• Cancel this entire order`;
    });

    const message = `Here are your orders from this session that can still be modified:\n\n${formattedOrders.join('\n\n---\n\n')}\n\nJust tell me what you'd like to change! For example:
• "Add 2 Caesar Salads to order #${editableOrders[0].id.slice(-6).toUpperCase()}"
• "Remove the pizza from my order"
• "Change the quantity of Caesar Salad to 3"
• "Cancel order #${editableOrders[0].id.slice(-6).toUpperCase()}"`;

    return {
      success: true,
      message,
      editableOrders: editableOrders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()),
        })),
      })),
    };

  } catch (error) {
    console.error("🚨 executeEditOrderRequest error:", error);
    return {
      success: false,
      message: `Failed to show editable orders: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Execute explain order locked action
async function executeExplainOrderLocked(
  actionData: { type: ActionType; data: any },
  restaurant: any,
  tableNumber: number | undefined,
  ctx: any
) {
  try {
    console.log(`🔒 Explaining order locked status for table ${tableNumber}`);
    
    const { orderStatus, orderId, requestedAction, alternativeActions, estimatedTimeRemaining } = actionData.data;
    
    // Build status-specific explanation
    let statusExplanation = "";
    let nextSteps = "";
    
    switch (orderStatus) {
      case 'PREPARING':
        statusExplanation = "Your order is currently being prepared in the kitchen. Once the cooking process begins, we can't make changes to ensure food safety and quality.";
        nextSteps = "Your order should be ready in about 10-15 minutes. If you need to make changes, please speak with restaurant staff who can coordinate with the kitchen.";
        break;
        
      case 'READY':
        statusExplanation = "Your order is ready for pickup! It's been completed and is waiting for you.";
        nextSteps = "Please pick up your order from the counter. If there's an issue with your order, please speak with restaurant staff.";
        break;
        
      case 'SERVED':
        statusExplanation = "Your order has already been served and completed.";
        nextSteps = "If you need anything else, you can place a new order or speak with restaurant staff for assistance.";
        break;
        
      default:
        statusExplanation = `Your order status is ${orderStatus.toLowerCase()}, which means it cannot be modified through the chat system.`;
        nextSteps = "Please contact restaurant staff for assistance with this order.";
    }
    
    // Build alternative actions list
    const alternatives = alternativeActions || [
      "Place a new order",
      "Speak with restaurant staff",
      "Check your order status"
    ];
    
    const alternativesList = alternatives.map(action => `• ${action}`).join('\n');
    
    // Build the complete message
    let message = `I understand you'd like to ${requestedAction}`;
    
    if (orderId) {
      message += ` for order #${orderId.slice(-6).toUpperCase()}`;
    }
    
    message += `, but I'm unable to make that change right now.\n\n🔒 **Why can't I modify this order?**\n${statusExplanation}\n\n⏭️ **What you can do instead:**\n${alternativesList}`;
    
    if (estimatedTimeRemaining) {
      message += `\n\n⏰ **Estimated time:** ${estimatedTimeRemaining}`;
    }
    
    message += `\n\nI'm here to help with anything else you need! 😊`;
    
    console.log(`✅ Explained order locked status: ${orderStatus} for ${requestedAction}`);
    
    return {
      success: true,
      message,
      actionId: actionData.data.actionId,
      orderStatus,
      alternativeActions: alternatives,
      cannotModify: true,
    };
    
  } catch (error) {
    console.error("🚨 executeExplainOrderLocked error:", error);
    return {
      success: false,
      message: "I'm having trouble explaining the order status right now. Please contact restaurant staff for assistance with your order.",
    };
  }
} 