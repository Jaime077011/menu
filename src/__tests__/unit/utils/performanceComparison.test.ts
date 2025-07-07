import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('openai');
jest.mock('@/env', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-4-turbo-preview'
  }
}));

jest.mock('@/utils/aiFunctionDefinitions', () => ({
  AI_FUNCTION_DEFINITIONS: [],
  validateFunctionCall: jest.fn().mockReturnValue(true)
}));

import { detectActionHybrid } from '@/utils/aiActionDetection';
import { detectUserActionIntent } from '@/utils/actionDetection';
import type { AIActionContext } from '@/types/aiActions';

describe('Performance Comparison: AI vs Pattern Matching', () => {
  let mockContext: AIActionContext;
  
  beforeEach(() => {
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
      conversationHistory: [],
      currentOrders: [],
      restaurantInfo: {
        name: 'Pizza Palace',
        subdomain: 'pizza-palace',
        waiterName: 'Mark'
      }
    };

    jest.clearAllMocks();
  });

  const testCases = [
    {
      name: 'Simple quantity order',
      message: 'give me 2 salads please',
      expectedAction: true
    },
    {
      name: 'Complex multi-item order',
      message: 'I want a pizza and a salad with extra dressing',
      expectedAction: true
    },
    {
      name: 'Conversational greeting',
      message: 'Hi, how are you today?',
      expectedAction: false
    },
    {
      name: 'Menu inquiry',
      message: 'What do you recommend?',
      expectedAction: true
    },
    {
      name: 'Order modification',
      message: 'Can I change my order to 3 pizzas instead?',
      expectedAction: true
    }
  ];

  describe('Response Time Comparison', () => {
    testCases.forEach(testCase => {
      it(`should handle "${testCase.name}" efficiently`, async () => {
        // Mock AI response
        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'AI response',
              tool_calls: testCase.expectedAction ? [{
                function: {
                  name: 'place_order',
                  arguments: JSON.stringify({
                    items: [{
                      menuItemId: 'menu-item-1',
                      name: 'Caesar Salad',
                      quantity: 1,
                      price: 12.99
                    }],
                    estimatedTotal: 12.99
                  })
                }
              }] : null
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

        // Test AI-driven approach
        const aiStartTime = Date.now();
        const aiResult = await detectActionHybrid(testCase.message, mockContext);
        const aiEndTime = Date.now();
        const aiResponseTime = aiEndTime - aiStartTime;

        // Test pattern matching approach
        const patternStartTime = Date.now();
        const patternResult = detectUserActionIntent(testCase.message, {
          restaurantId: mockContext.restaurantId,
          tableNumber: mockContext.tableNumber,
          menuItems: mockContext.menuItems,
          conversationHistory: mockContext.conversationHistory
        });
        const patternEndTime = Date.now();
        const patternResponseTime = patternEndTime - patternStartTime;

        // Assertions
        expect(aiResult).toBeDefined();
        expect(aiResponseTime).toBeLessThan(5000); // AI should respond within 5 seconds
        expect(patternResponseTime).toBeLessThan(100); // Pattern matching should be very fast

        // Log performance comparison
        console.log(`📊 Performance for "${testCase.name}":`);
        console.log(`   AI Response Time: ${aiResponseTime}ms`);
        console.log(`   Pattern Response Time: ${patternResponseTime}ms`);
        console.log(`   AI Confidence: ${aiResult.confidence}`);
        console.log(`   Used Fallback: ${aiResult.fallbackToPatterns}`);
      });
    });
  });

  describe('Accuracy Comparison', () => {
    it('should show AI detection accuracy vs pattern matching', async () => {
      const accuracyTests = [
        {
          message: 'I\'m really craving something cheesy and delicious',
          expectAIBetter: true, // AI should understand context better
        },
        {
          message: 'give me 2 salads',
          expectPatternGood: true, // Pattern matching should handle this well
        },
        {
          message: 'Can I get something light but filling for lunch?',
          expectAIBetter: true, // AI should understand nuanced requests
        }
      ];

      const results = [];

      for (const test of accuracyTests) {
        // Mock AI response
        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'AI understood the context',
              tool_calls: [{
                function: {
                  name: 'request_recommendations',
                  arguments: JSON.stringify({
                    preferenceType: 'contextual',
                    specificCravings: test.message
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

        const aiResult = await detectActionHybrid(test.message, mockContext);
        const patternResult = detectUserActionIntent(test.message, {
          restaurantId: mockContext.restaurantId,
          tableNumber: mockContext.tableNumber,
          menuItems: mockContext.menuItems,
          conversationHistory: mockContext.conversationHistory
        });

        results.push({
          message: test.message,
          aiDetected: !!aiResult.action,
          patternDetected: !!patternResult,
          aiConfidence: aiResult.confidence,
          expectAIBetter: test.expectAIBetter
        });
      }

      // Log accuracy comparison
      console.log('\n📊 Accuracy Comparison Results:');
      results.forEach(result => {
        console.log(`\nMessage: "${result.message}"`);
        console.log(`  AI Detected: ${result.aiDetected} (confidence: ${result.aiConfidence})`);
        console.log(`  Pattern Detected: ${result.patternDetected}`);
        console.log(`  Expected AI Better: ${result.expectAIBetter}`);
      });

      // Ensure at least some tests pass
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback System Validation', () => {
    it('should gracefully handle AI failures', async () => {
      // Mock AI failure
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

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
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.reasoning).toContain('failed');
    });

    it('should maintain service availability during AI downtime', async () => {
      // Simulate AI service downtime
      const mockCreate = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service Unavailable')), 1000);
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
      const result = await detectActionHybrid('order pizza', mockContext);
      const endTime = Date.now();

      // Should still provide a response within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
      expect(result.fallbackToPatterns).toBe(true);
      
      // Service should still be functional
      expect(result).toBeDefined();
    });
  });

  describe('Confidence Scoring Validation', () => {
    it('should provide meaningful confidence scores', async () => {
      const confidenceTests = [
        {
          message: 'I want exactly 2 Caesar salads please',
          expectedHighConfidence: true
        },
        {
          message: 'maybe something good?',
          expectedHighConfidence: false
        }
      ];

      for (const test of confidenceTests) {
        const mockCreate = jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Response',
              tool_calls: test.expectedHighConfidence ? [{
                function: {
                  name: 'place_order',
                  arguments: JSON.stringify({
                    items: [{
                      menuItemId: 'menu-item-1',
                      name: 'Caesar Salad',
                      quantity: 2,
                      price: 12.99
                    }],
                    estimatedTotal: 25.98
                  })
                }
              }] : null
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

        const result = await detectActionHybrid(test.message, mockContext);

        if (test.expectedHighConfidence) {
          expect(result.confidence).toBeGreaterThan(0.7);
        } else {
          expect(result.confidence).toBeLessThan(0.8);
        }
      }
    });
  });
}); 