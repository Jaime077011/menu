import { PrismaClient } from '@prisma/client';
import { detectActionWithAI } from '@/src/utils/aiActionDetection';
import { buildAIActionContext } from '@/src/utils/aiContextBuilder';

const prisma = new PrismaClient();

async function testAIActionDetection() {
  try {
    console.log('🧪 === AI ACTION DETECTION TEST ===');
    
    // Get a test restaurant
    const restaurant = await prisma.restaurant.findFirst({
      include: {
        menuItems: {
          include: {
            dietaryTags: true
          }
        }
      }
    });

    if (!restaurant) {
      console.error('❌ No restaurant found in database');
      return;
    }

    console.log('🏪 Testing with restaurant:', restaurant.name);
    console.log('🍽️ Menu items:', restaurant.menuItems.length);

    // Build AI context
    const mockCtx = {
      db: prisma
    };

    const aiContext = await buildAIActionContext(
      restaurant,
      1, // table number
      [], // empty conversation history
      mockCtx
    );

    console.log('✅ AI Context built successfully');

    // Test different messages
    const testMessages = [
      "I want 2 Caesar salads please",
      "Add a pizza to my order", 
      "What do you recommend?",
      "Remove the burger from my order",
      "Hello, how are you?",
      "Cancel my order",
      "Check my order status"
    ];

    for (const message of testMessages) {
      console.log(`\n🎯 === TESTING MESSAGE: "${message}" ===`);
      
      try {
        const result = await detectActionWithAI(message, aiContext);
        
        console.log('📋 Test Result:', {
          hasAction: !!result.action,
          actionType: result.action?.type,
          confidence: result.confidence,
          reasoning: result.reasoning,
          fallbackUsed: result.fallbackToPatterns,
          functionCall: result.functionCall?.functionName
        });

        if (result.action) {
          console.log('✅ ACTION DETECTED:', {
            id: result.action.id,
            type: result.action.type,
            requiresConfirmation: result.action.requiresConfirmation,
            confirmationMessage: result.action.confirmationMessage?.slice(0, 100) + "..."
          });
        } else {
          console.log('❌ NO ACTION DETECTED');
          console.log('💬 AI Response:', result.aiResponse?.slice(0, 100) + "...");
        }
        
      } catch (error) {
        console.error('❌ Test failed for message:', message);
        console.error('Error:', error);
      }
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAIActionDetection(); 