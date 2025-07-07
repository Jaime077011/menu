/**
 * Enhanced TypeScript interfaces for AI-driven action detection
 * These types provide comprehensive type safety for the new AI-powered system
 */

// Re-export existing action types for compatibility
export type {
  ActionType,
  PendingAction,
  ActionButton,
  ActionState,
  ParsedOrderItem
} from "./chatActions";

/**
 * AI-specific action metadata
 */
export interface AIActionMetadata {
  /** Confidence score from AI decision (0-1) */
  confidence: number;
  /** AI reasoning for the decision */
  reasoning: string;
  /** Whether this action fell back to pattern matching */
  fallbackUsed: boolean;
  /** Execution time in milliseconds */
  executionTime?: number;
  /** AI model used for decision */
  model?: string;
  /** Function call details if AI used function calling */
  functionCall?: AIFunctionCallMetadata;
}

/**
 * AI function call metadata
 */
export interface AIFunctionCallMetadata {
  /** Name of the function the AI chose to call */
  functionName: string;
  /** Parameters passed to the function */
  parameters: Record<string, any>;
  /** Validation status of the function call */
  validationPassed: boolean;
  /** Any validation errors */
  validationErrors?: string[];
}

/**
 * Enhanced pending action with AI metadata
 */
export interface AIEnhancedPendingAction {
  /** Base pending action */
  action: import("./chatActions").PendingAction | null;
  /** AI-specific metadata */
  aiMetadata: AIActionMetadata;
  /** Original AI response text */
  aiResponse?: string;
  /** Suggested follow-up actions */
  suggestedFollowUps?: string[];
}

/**
 * AI action detection context
 */
export interface AIActionDetectionContext {
  /** Restaurant identifier */
  restaurantId: string;
  /** Table number if known */
  tableNumber?: number;
  /** Available menu items with full details */
  menuItems?: MenuItemContext[];
  /** Recent conversation history */
  conversationHistory?: ConversationMessage[];
  /** Current active orders */
  currentOrders?: OrderContext[];
  /** Customer session information */
  customerSession?: CustomerSessionContext;
  /** Restaurant-specific settings */
  restaurantSettings?: RestaurantSettings;
  /** Customer preferences if known */
  customerPreferences?: CustomerPreferences;
}

/**
 * Simplified AI action context for compatibility
 * This is used by the detection functions and context builder
 */
export interface AIActionContext {
  restaurantId: string;
  tableNumber?: number;
  menuItems?: MenuItemContext[];
  conversationHistory?: ConversationMessage[];
  currentOrders?: OrderContext[];
  customerSession?: CustomerSessionContext;
  restaurantSettings?: RestaurantSettings;
  restaurantInfo?: {
    name: string;
    subdomain: string;
    waiterName: string;
  };
  conversationMemory?: string; // Enhanced context from conversation memory system
  orderStatusRules?: string; // Rules for order status handling
  orderValidationContext?: {
    canModifyByStatus: Record<string, boolean>;
    currentOrderStatuses: Array<{ orderId: string; status: string; canModify: boolean }>;
    hasModifiableOrders: boolean;
  };
}

/**
 * Menu item context for AI
 */
export interface MenuItemContext {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  /** Dietary tags for AI to consider */
  dietaryTags?: string[];
  /** Ingredients for allergy/dietary considerations */
  ingredients?: string[];
  /** Preparation time for urgency considerations */
  prepTime?: number;
  /** Popularity score for recommendations */
  popularityScore?: number;
}

/**
 * Conversation message for AI context
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  /** Associated action if any */
  actionId?: string;
  /** Message metadata */
  metadata?: {
    confidence?: number;
    intent?: string;
    entities?: Record<string, any>;
  };
}

/**
 * Order context for AI decision making
 */
export interface OrderContext {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  estimatedCompletionTime?: Date;
  items: OrderItemContext[];
  /** Whether this order can still be modified */
  canModify: boolean;
  /** Special requests or notes */
  notes?: string;
}

/**
 * Order item context
 */
export interface OrderItemContext {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  /** Whether this item can be modified */
  canModify: boolean;
}

/**
 * Customer session context
 */
export interface CustomerSessionContext {
  id: string;
  customerName?: string;
  tableNumber: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | "CANCELLED";
  startTime: Date;
  totalOrders: number;
  totalSpent: number;
  /** Customer preferences learned during session */
  sessionPreferences?: CustomerPreferences;
}

/**
 * Personality configuration using new template system
 */
export interface PersonalityConfig {
  id: string;
  name: string;
  tone: string;
  responseStyle: string;
  welcomeMessage: string;
  description?: string;
}

/**
 * Restaurant settings for AI behavior
 */
export interface RestaurantSettings {
  /** AI waiter personality (legacy enum - for backwards compatibility) */
  waiterPersonality?: "FRIENDLY" | "PROFESSIONAL" | "CASUAL" | "FORMAL";
  /** New personality template (preferred) */
  personalityTemplate?: PersonalityConfig;
  /** Conversation tone */
  conversationTone: "WARM" | "NEUTRAL" | "ENERGETIC" | "CALM";
  /** Response style */
  responseStyle: "CONCISE" | "DETAILED" | "HELPFUL" | "ENTERTAINING";
  /** Specialty knowledge areas */
  specialtyKnowledge?: string[];
  /** Custom AI instructions */
  customInstructions?: string;
  /** Upselling preferences */
  upsellSettings?: {
    enabled: boolean;
    aggressiveness: "LOW" | "MEDIUM" | "HIGH";
    categories: string[];
  };
}

/**
 * Customer preferences for personalization
 */
export interface CustomerPreferences {
  /** Dietary restrictions */
  dietaryRestrictions?: string[];
  /** Favorite cuisines */
  favoriteCuisines?: string[];
  /** Price sensitivity */
  priceRange?: "BUDGET" | "MODERATE" | "PREMIUM" | "NO_PREFERENCE";
  /** Spice tolerance */
  spiceTolerance?: "MILD" | "MEDIUM" | "HOT" | "VERY_HOT";
  /** Portion size preference */
  portionPreference?: "SMALL" | "REGULAR" | "LARGE";
  /** Previous orders for learning */
  orderHistory?: {
    menuItemId: string;
    frequency: number;
    lastOrdered: Date;
  }[];
}

/**
 * AI decision result with comprehensive information
 */
export interface AIDecisionResult {
  /** The decided action (null if no action needed) */
  action: import("./chatActions").PendingAction | null;
  /** Confidence in the decision (0-1) */
  confidence: number;
  /** Human-readable reasoning */
  reasoning: string;
  /** Whether fallback was used */
  fallbackUsed: boolean;
  /** AI's conversational response */
  conversationalResponse?: string;
  /** Suggested follow-up questions */
  followUpSuggestions?: string[];
  /** Detected customer intent */
  detectedIntent?: CustomerIntent;
  /** Extracted entities from the message */
  extractedEntities?: ExtractedEntities;
  /** Performance metrics */
  performance?: {
    executionTime: number;
    tokensUsed?: number;
    model: string;
  };
}

/**
 * Customer intent classification
 */
export interface CustomerIntent {
  /** Primary intent category */
  primary: "ORDER" | "MODIFY" | "CANCEL" | "INQUIRE" | "COMPLAIN" | "CHAT" | "REQUEST_HELP";
  /** Secondary intent if applicable */
  secondary?: string;
  /** Confidence in intent detection */
  confidence: number;
  /** Intent-specific parameters */
  parameters?: Record<string, any>;
}

/**
 * Entities extracted from customer message
 */
export interface ExtractedEntities {
  /** Menu items mentioned */
  menuItems?: {
    id: string;
    name: string;
    confidence: number;
    quantity?: number;
  }[];
  /** Numbers/quantities mentioned */
  quantities?: number[];
  /** Time expressions */
  timeExpressions?: string[];
  /** Dietary terms */
  dietaryTerms?: string[];
  /** Emotional indicators */
  emotions?: {
    type: "HAPPY" | "FRUSTRATED" | "CONFUSED" | "EXCITED" | "IMPATIENT";
    confidence: number;
  }[];
  /** Urgency indicators */
  urgency?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

/**
 * AI action execution result
 */
export interface AIActionExecutionResult {
  /** Whether the action was executed successfully */
  success: boolean;
  /** Result message */
  message: string;
  /** Updated order/session data */
  data?: any;
  /** Any errors that occurred */
  errors?: string[];
  /** Follow-up actions suggested */
  followUpActions?: import("./chatActions").PendingAction[];
}

/**
 * AI performance metrics for monitoring
 */
export interface AIPerformanceMetrics {
  /** Total decisions made */
  totalDecisions: number;
  /** Successful decisions */
  successfulDecisions: number;
  /** Average confidence score */
  averageConfidence: number;
  /** Average execution time */
  averageExecutionTime: number;
  /** Fallback usage rate */
  fallbackRate: number;
  /** Most common intents */
  commonIntents: Record<string, number>;
  /** Error rate by category */
  errorRates: Record<string, number>;
}

/**
 * AI learning data for improvement
 */
export interface AILearningData {
  /** Customer message */
  userMessage: string;
  /** AI decision */
  aiDecision: AIDecisionResult;
  /** Actual outcome */
  actualOutcome: "SUCCESS" | "FAILURE" | "PARTIAL_SUCCESS";
  /** User feedback if available */
  userFeedback?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  /** Context at time of decision */
  context: AIActionDetectionContext;
  /** Timestamp */
  timestamp: Date;
  /** Session identifier */
  sessionId: string;
}

/**
 * Type guards for AI actions
 */
export const AIActionTypeGuards = {
  isAIEnhancedAction: (obj: any): obj is AIEnhancedPendingAction => {
    return obj && typeof obj === 'object' && 'aiMetadata' in obj;
  },
  
  hasAIMetadata: (obj: any): obj is { aiMetadata: AIActionMetadata } => {
    return obj && obj.aiMetadata && typeof obj.aiMetadata.confidence === 'number';
  },
  
  isHighConfidenceDecision: (result: AIDecisionResult): boolean => {
    return result.confidence >= 0.8;
  },
  
  requiresFallback: (result: AIDecisionResult): boolean => {
    return result.confidence < 0.5 || result.fallbackUsed;
  }
};

/**
 * AI action utilities
 */
export const AIActionUtils = {
  /** Create AI metadata */
  createAIMetadata: (
    confidence: number,
    reasoning: string,
    fallbackUsed: boolean,
    executionTime?: number,
    model?: string
  ): AIActionMetadata => ({
    confidence,
    reasoning,
    fallbackUsed,
    executionTime,
    model: model || "gpt-4o-mini" // Use the default model from environment
  }),
  
  /** Merge AI context with additional data */
  enhanceContext: (
    baseContext: Partial<AIActionDetectionContext>,
    additionalData: Partial<AIActionDetectionContext>
  ): AIActionDetectionContext => ({
    restaurantId: "",
    ...baseContext,
    ...additionalData
  }),
  
  /** Calculate overall confidence score */
  calculateOverallConfidence: (
    aiConfidence: number,
    contextQuality: number,
    fallbackUsed: boolean
  ): number => {
    let score = aiConfidence * 0.7 + contextQuality * 0.3;
    if (fallbackUsed) score *= 0.8; // Reduce confidence if fallback was used
    return Math.max(0, Math.min(1, score));
  }
}; 