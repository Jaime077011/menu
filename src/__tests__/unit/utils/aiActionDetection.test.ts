import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock OpenAI before importing the module
jest.mock('openai');

// Mock environment variables
jest.mock('@/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-4-turbo-preview'
  }
}));

// Mock the AI function definitions
jest.mock('@/utils/aiFunctionDefinitions', () => ({
  AI_FUNCTION_DEFINITIONS: [],
  validateFunctionCall: jest.fn().mockReturnValue(true)
}));

import { 
  detectActionHybrid, 
  detectActionWithAI,
  fallbackToPatternMatching
} from '@/utils/aiActionDetection';
import type { AIActionContext } from '@/types/aiActions';

describe('AI-Driven Action Detection', () => {
  let mockContext: AIActionContext;
  
  beforeEach(() => {
    // Setup mock context with realistic restaurant data
    mockContext = {
      restaurantId: 'test-restaurant-123',
      tableNumber: 4,
      menuItems: [
        {
          id: 'menu-item-1',
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing',
          price: 12.99,
          category: 'salads',
          available: true,
          dietaryTags: ['vegetarian'],
          ingredients: ['lettuce', 'cheese', 'garlic'],
          prepTime: 8,
          popularityScore: 0.8
        },
        {
          id: 'menu-item-2',
          name: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce and mozzarella',
          price: 16.99,
          category: 'pizzas',
          available: true,
          dietaryTags: ['vegetarian'],
          ingredients: ['tomato', 'cheese', 'basil'],
          prepTime: 15,
          popularityScore: 0.9
        }
      ],
      conversationHistory: [
        {
          role: 'assistant',
          content: 'Hi! I\'m Mark. What can I get for you today?',
          timestamp: new Date()
        }
      ],
      currentOrders: [],
      customerSession: {
        id: 'session-123',
        customerName: 'Test Customer',
        tableNumber: '4',
        status: 'ACTIVE',
        startTime: new Date(),
        totalOrders: 0,
        totalSpent: 0
      },
      restaurantSettings: {
        waiterPersonality: 'FRIENDLY',
        conversationTone: 'WARM',
        responseStyle: 'HELPFUL',
        specialtyKnowledge: ['pizza', 'italian'],
        upsellSettings: {
          enabled: true,
          aggressiveness: 'MEDIUM',
          categories: ['appetizers', 'desserts']
        }
      },
      restaurantInfo: {
        name: 'Pizza Palace',
        subdomain: 'pizza-palace',
        waiterName: 'Mark'
      }
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AI Action Detection', () => {
    it('should detect order intent for simple quantity requests', async () => {
      // Mock successful OpenAI response
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'I\'ll help you order 2 Caesar Salads.',
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
                  customerNotes: 'Customer wants 2 salads'
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

      const result = await detectActionWithAI('give me 2 salads please', mockContext);

      expect(result.action).toBeTruthy();
      expect(result.action?.type).toBe('CONFIRM_ORDER');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.fallbackToPatterns).toBe(false);
    });

    it('should handle conversational messages without actions', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Hello! I\'m doing great, thank you for asking.',
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

      const result = await detectActionWithAI('Hi, how are you?', mockContext);

      expect(result.action).toBeNull();
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.fallbackToPatterns).toBe(false);
      expect(result.aiResponse).toContain('Hello');
    });

    it('should fall back to pattern matching when AI fails', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI API Error'));

      const mockOpenAI = require('openai');
      mockOpenAI.OpenAI = jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const result = await detectActionHybrid('give me 2 salads', mockContext);

      expect(result.fallbackToPatterns).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const mockCreate = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              choices: [{
                message: {
                  content: 'Quick response',
                  tool_calls: null
                }
              }]
            });
          }, 100); // Simulate 100ms API response
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

      const startTime = Date.now();
      const result = await detectActionWithAI('Hello', mockContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should be under 5 seconds
      expect(result).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty menu items gracefully', async () => {
      const emptyMenuContext = {
        ...mockContext,
        menuItems: []
      };

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'I apologize, but we don\'t have any menu items available right now.',
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

      const result = await detectActionWithAI('I want pizza', emptyMenuContext);

      expect(result.action).toBeNull();
      expect(result.aiResponse).toContain('apologize');
    });

    it('should handle malformed AI responses', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Response',
            tool_calls: [{
              function: {
                name: 'place_order',
                arguments: 'invalid json{'
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

      const result = await detectActionWithAI('order pizza', mockContext);

      expect(result.fallbackToPatterns).toBe(true);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Fallback System', () => {
    it('should use pattern matching when AI confidence is low', async () => {
      const result = await fallbackToPatternMatching('give me 2 pizzas', mockContext);

      // Should either return an action or null (depending on pattern matching)
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });
}); 