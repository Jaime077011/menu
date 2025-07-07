import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { appRouter } from '@/server/api/root';
import type { AppRouter } from '@/server/api/root';

// Mock dependencies before imports
jest.mock('openai');
jest.mock('@/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-4-turbo-preview',
    DATABASE_URL: 'mock-db-url'
  }
}));

jest.mock('@/utils/aiFunctionDefinitions', () => ({
  AI_FUNCTION_DEFINITIONS: [],
  validateFunctionCall: jest.fn().mockReturnValue(true)
}));

// Mock database
jest.mock('@/server/db', () => ({
  db: {
    restaurant: {
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    menuItem: {
      findMany: jest.fn()
    },
    order: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    customerSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}));

const trpcMsw = createTRPCMsw<AppRouter>();
const server = setupServer();

describe('AI-Driven Chat Flow Integration Tests', () => {
  beforeEach(() => {
    server.listen();
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  const mockRestaurantData = {
    id: 'restaurant-123',
    name: 'Pizza Palace',
    subdomain: 'pizza-palace',
    waiterName: 'Mark',
    waiterPersonality: 'FRIENDLY'
  };

  const mockMenuItems = [
    {
      id: 'menu-item-1',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with caesar dressing',
      price: 12.99,
      category: 'salads',
      available: true,
      restaurantId: 'restaurant-123'
    },
    {
      id: 'menu-item-2',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce and mozzarella',
      price: 16.99,
      category: 'pizzas',
      available: true,
      restaurantId: 'restaurant-123'
    }
  ];

  const mockSession = {
    id: 'session-123',
    customerName: 'Test Customer',
    tableNumber: '4',
    status: 'ACTIVE',
    restaurantId: 'restaurant-123',
    startTime: new Date(),
    totalOrders: 0,
    totalSpent: 0
  };

  describe('Complete Order Flow with AI', () => {
    it('should handle complete order flow from greeting to confirmation', async () => {
      // Mock database responses
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);
      mockDb.order.create.mockResolvedValue({
        id: 'order-123',
        items: [{ id: 'menu-item-1', quantity: 2 }],
        total: 25.98,
        status: 'PENDING'
      });

      // Mock OpenAI responses for different conversation stages
      const mockCreate = jest.fn()
        .mockResolvedValueOnce({
          // Greeting response
          choices: [{
            message: {
              content: 'Hello! Welcome to Pizza Palace. I\'m Mark, your virtual waiter. What can I get for you today?',
              tool_calls: null
            }
          }]
        })
        .mockResolvedValueOnce({
          // Order detection response
          choices: [{
            message: {
              content: 'Perfect! I\'ll prepare 2 Caesar Salads for you.',
              tool_calls: [{
                function: {
                  name: 'place_order',
                  arguments: JSON.stringify({
                    items: [{
                      menuItemId: 'menu-item-1',
                      name: 'Caesar Salad',
                      quantity: 2,
                      price: 12.99,
                      specialRequests: ''
                    }],
                    estimatedTotal: 25.98,
                    customerNotes: 'Customer wants 2 Caesar Salads'
                  })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          // Confirmation response
          choices: [{
            message: {
              content: 'Great! Your order has been confirmed and sent to the kitchen.',
              tool_calls: null
            }
          }]
        });

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      // Create tRPC context
      const createContext = () => ({
        db: mockDb,
        session: null
      });

      const caller = appRouter.createCaller(createContext());

      // Step 1: Initial greeting
      const greetingResponse = await caller.chat.sendMessage({
        message: 'Hello',
        restaurantId: 'restaurant-123',
        tableNumber: 4
      });

      expect(greetingResponse.message).toContain('Welcome');
      expect(greetingResponse.action).toBeNull();

      // Step 2: Place order
      const orderResponse = await caller.chat.sendMessage({
        message: 'I want 2 Caesar salads please',
        restaurantId: 'restaurant-123',
        tableNumber: 4
      });

      expect(orderResponse.action).toBeTruthy();
      expect(orderResponse.action?.type).toBe('CONFIRM_ORDER');
      expect(orderResponse.action?.data.items).toHaveLength(1);
      expect(orderResponse.action?.data.items[0].quantity).toBe(2);

      // Step 3: Confirm order
      const confirmResponse = await caller.chat.confirmOrder({
        restaurantId: 'restaurant-123',
        tableNumber: 4,
        items: orderResponse.action!.data.items,
        total: orderResponse.action!.data.total,
        sessionId: 'session-123'
      });

      expect(confirmResponse.success).toBe(true);
      expect(confirmResponse.orderId).toBe('order-123');
      expect(mockDb.order.create).toHaveBeenCalled();
    });

    it('should handle AI fallback during order processing', async () => {
      // Mock database responses
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);

      // Mock AI failure, then fallback to pattern matching
      const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI API Error'));

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const createContext = () => ({
        db: mockDb,
        session: null
      });

      const caller = appRouter.createCaller(createContext());

      // Should still process order using pattern matching fallback
      const response = await caller.chat.sendMessage({
        message: 'give me 2 salads',
        restaurantId: 'restaurant-123',
        tableNumber: 4
      });

      expect(response.action).toBeTruthy();
      expect(response.metadata?.fallbackToPatterns).toBe(true);
      expect(response.metadata?.confidence).toBeLessThan(0.8);
    });
  });

  describe('AI Context Building', () => {
    it('should build comprehensive context for AI decisions', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);
      mockDb.order.findMany.mockResolvedValue([]);

      // Import after mocks are set up
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);

      expect(context.restaurantInfo.name).toBe('Pizza Palace');
      expect(context.restaurantInfo.waiterName).toBe('Mark');
      expect(context.menuItems).toHaveLength(2);
      expect(context.menuItems[0].name).toBe('Caesar Salad');
      expect(context.tableNumber).toBe(4);
    });
  });

  describe('AI Action Detection Flow', () => {
    it('should detect order intent and validate menu items', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);

      // Mock AI response with correct order
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Perfect! I\'ll prepare 2 Caesar Salads for you.',
            tool_calls: [{
              function: {
                name: 'place_order',
                arguments: JSON.stringify({
                  items: [{
                    menuItemId: 'menu-item-1',
                    name: 'Caesar Salad',
                    quantity: 2,
                    price: 12.99,
                    specialRequests: ''
                  }],
                  estimatedTotal: 25.98,
                  customerNotes: 'Customer wants 2 Caesar Salads'
                })
              }
            }]
          }
        }]
      });

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const { detectActionHybrid } = require('@/utils/aiActionDetection');
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);
      const result = await detectActionHybrid('I want 2 Caesar salads please', context);

      expect(result.action).toBeTruthy();
      expect(result.action?.type).toBe('CONFIRM_ORDER');
      expect(result.action?.data.items).toHaveLength(1);
      expect(result.action?.data.items[0].quantity).toBe(2);
      expect(result.fallbackToPatterns).toBe(false);
    });

    it('should handle AI failure with pattern matching fallback', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);

      // Mock AI failure
      const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI API Error'));

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const { detectActionHybrid } = require('@/utils/aiActionDetection');
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);
      const result = await detectActionHybrid('give me 2 salads', context);

      expect(result.fallbackToPatterns).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.reasoning).toContain('failed');
    });
  });

  describe('Menu Item ID Validation', () => {
    it('should auto-correct invalid menu item IDs', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);

      // Mock AI response with invalid menu item ID but correct name
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Order processed',
            tool_calls: [{
              function: {
                name: 'place_order',
                arguments: JSON.stringify({
                  items: [{
                    menuItemId: 'invalid-id-123',
                    name: 'Caesar Salad',
                    quantity: 1,
                    price: 12.99
                  }],
                  estimatedTotal: 12.99
                })
              }
            }]
          }
        }]
      });

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const { detectActionHybrid } = require('@/utils/aiActionDetection');
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);
      const result = await detectActionHybrid('I want a Caesar salad', context);

      // Should auto-correct the menu item ID
      expect(result.action?.data.items[0].id).toBe('menu-item-1');
      expect(result.action?.data.items[0].name).toBe('Caesar Salad');
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockRejectedValue(new Error('Database Connection Error'));

      const { buildAIContext } = require('@/utils/aiContextBuilder');

      await expect(
        buildAIContext('restaurant-123', 4)
      ).rejects.toThrow('Database Connection Error');
    });

    it('should measure AI response times', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);

      // Mock slow AI response
      const mockCreate = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              choices: [{
                message: {
                  content: 'Slow response',
                  tool_calls: null
                }
              }]
            });
          }, 200); // 200ms delay
        })
      );

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const { detectActionHybrid } = require('@/utils/aiActionDetection');
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);
      
      const startTime = Date.now();
      const result = await detectActionHybrid('Hello', context);
      const endTime = Date.now();

      expect(result.executionTime).toBeGreaterThan(0);
      expect(endTime - startTime).toBeGreaterThan(200);
    });
  });

  describe('Conversation Flow', () => {
    it('should handle multi-turn conversations with context', async () => {
      const mockDb = require('@/server/db').db;
      mockDb.restaurant.findFirst.mockResolvedValue(mockRestaurantData);
      mockDb.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockDb.customerSession.findFirst.mockResolvedValue(mockSession);

      const conversationHistory = [
        {
          role: 'user' as const,
          content: 'Hi there',
          timestamp: new Date()
        },
        {
          role: 'assistant' as const,
          content: 'Hello! Welcome to Pizza Palace. What can I get for you?',
          timestamp: new Date()
        }
      ];

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Based on our previous conversation, I can help you with your order.',
            tool_calls: null
          }
        }]
      });

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const { detectActionHybrid } = require('@/utils/aiActionDetection');
      const { buildAIContext } = require('@/utils/aiContextBuilder');

      const context = await buildAIContext('restaurant-123', 4);
      context.conversationHistory = conversationHistory;

      const result = await detectActionHybrid('What do you recommend?', context);

      expect(result.aiResponse).toContain('previous conversation');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Hi there')
            })
          ])
        })
      );
    });
  });
}); 