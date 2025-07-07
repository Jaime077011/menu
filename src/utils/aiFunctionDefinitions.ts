import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Simplified OpenAI Function Definitions for AI-Driven Action Detection
 * Optimized for gpt-4.1-nano model with clear, concise functions
 */

export const AI_FUNCTION_DEFINITIONS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "place_order",
      description: "Place a new food order when customer wants to order items for the first time",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Items to order",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string" },
                name: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" },
                specialRequests: { type: "string" }
              },
              required: ["menuItemId", "name", "quantity", "price"]
            }
          },
          estimatedTotal: {
            type: "number",
            description: "Total estimated cost"
          },
          customerNotes: {
            type: "string",
            description: "Any special customer notes"
          }
        },
        required: ["items", "estimatedTotal"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "add_to_existing_order",
      description: "Add items to an existing order when customer wants to add more items",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Items to add",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string" },
                name: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" },
                specialRequests: { type: "string" }
              },
              required: ["menuItemId", "name", "quantity", "price"]
            }
          }
        },
        required: ["items"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "modify_order",
      description: "Modify an existing order (remove items, change quantities, etc.)",
      parameters: {
        type: "object",
        properties: {
          modificationType: {
            type: "string",
            enum: ["remove_item", "change_quantity", "add_special_request"],
            description: "Type of modification"
          },
          orderId: {
            type: "string",
            description: "ID of order to modify"
          },
          targetItem: {
            type: "object",
            properties: {
              name: { type: "string" },
              menuItemId: { type: "string" }
            },
            description: "Item to modify"
          },
          newQuantity: {
            type: "number",
            description: "New quantity (for quantity changes)"
          },
          customerReason: {
            type: "string",
            description: "Reason for modification"
          }
        },
        required: ["modificationType"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "cancel_order",
      description: "Cancel an existing order completely or partially",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "Order ID to cancel"
          },
          cancellationType: {
            type: "string",
            enum: ["full_order", "specific_items"],
            description: "Whether to cancel entire order or specific items"
          },
          itemsToCancel: {
            type: "array",
            items: { type: "string" },
            description: "Specific items to cancel (if partial cancellation)"
          },
          reason: {
            type: "string",
            description: "Reason for cancellation"
          }
        },
        required: ["cancellationType", "reason"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "check_order_status",
      description: "Check the current status of customer's orders",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "Specific order ID to check (optional)"
          }
        }
      }
    }
  },

  {
    type: "function",
    function: {
      name: "request_recommendations",
      description: "Get personalized food recommendations based on customer preferences",
      parameters: {
        type: "object",
        properties: {
          preferenceType: {
            type: "string",
            enum: ["dietary", "price", "mood", "popular", "chef_special"],
            description: "Type of recommendation request"
          },
          dietaryRestrictions: {
            type: "array",
            items: { type: "string" },
            description: "Dietary restrictions like 'vegetarian', 'vegan', 'gluten-free'"
          },
          priceRange: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" }
            },
            description: "Price range preferences"
          },
          moodOrOccasion: {
            type: "string",
            description: "Mood or occasion like 'celebration', 'comfort food', 'healthy'"
          },
          specificCravings: {
            type: "string",
            description: "Specific cravings like 'spicy', 'sweet', 'savory'"
          }
        },
        required: ["preferenceType"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "clarify_customer_request",
      description: "Ask for clarification when customer request is ambiguous",
      parameters: {
        type: "object",
        properties: {
          ambiguousRequest: {
            type: "string",
            description: "The unclear customer request"
          },
          possibleOptions: {
            type: "array",
            items: { 
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" }
              }
            },
            description: "Possible menu items or interpretations"
          }
        },
        required: ["ambiguousRequest"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "provide_information",
      description: "Provide information about menu items, restaurant policies, etc.",
      parameters: {
        type: "object",
        properties: {
          informationType: {
            type: "string",
            enum: ["menu_item_details", "ingredients", "nutritional_info", "restaurant_info", "policy"],
            description: "Type of information requested"
          },
          specificQuery: {
            type: "string",
            description: "Specific question or item to provide info about"
          },
          menuItemId: {
            type: "string",
            description: "Menu item ID if asking about specific item"
          }
        },
        required: ["informationType", "specificQuery"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "no_action_needed",
      description: "Use when the message is just conversation and doesn't require any specific action",
      parameters: {
        type: "object",
        properties: {
          conversationType: {
            type: "string",
            enum: ["greeting", "thanks", "small_talk", "general_question"],
            description: "Type of conversational message"
          },
          responseStyle: {
            type: "string",
            enum: ["friendly", "professional", "casual"],
            description: "Preferred response style"
          }
        },
        required: ["conversationType"]
      }
    }
  }
];

// Helper function to get a function definition by name
export function getFunctionDefinition(functionName: string): ChatCompletionTool | undefined {
  return AI_FUNCTION_DEFINITIONS.find(
    (tool) => tool.type === "function" && tool.function.name === functionName
  );
}

// Get all available function names
export function getAllFunctionNames(): string[] {
  return AI_FUNCTION_DEFINITIONS
    .filter((tool) => tool.type === "function")
    .map((tool) => tool.function.name);
}

// Validate a function call has required parameters
export function validateFunctionCall(functionName: string, parameters: any): boolean {
  const definition = getFunctionDefinition(functionName);
  if (!definition || definition.type !== "function") return false;

  const required = definition.function.parameters?.required || [];
  
  // Check if all required parameters are present
  for (const param of required) {
    if (!(param in parameters)) {
      return false;
    }
  }
  
  return true;
} 