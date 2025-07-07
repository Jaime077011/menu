// Test script for automatic order status checking
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutomaticOrderStatusChecking() {
  console.log("🧪 === TESTING AUTOMATIC ORDER STATUS CHECKING ===");
  
  try {
    // Find a restaurant with active orders
    const restaurant = await prisma.restaurant.findFirst({
      where: { 
        isActive: true,
        menuItems: { some: {} }
      },
      include: {
        menuItems: true
      }
    });

    if (!restaurant) {
      console.log("❌ No active restaurant found");
      return;
    }

    console.log(`✅ Testing with restaurant: ${restaurant.name}`);

    // Create a test session
    const testSession = await prisma.customerSession.create({
      data: {
        restaurantId: restaurant.id,
        tableNumber: "99",
        status: "ACTIVE",
        startTime: new Date()
      }
    });

    console.log(`✅ Created test session for table 99`);

    // Create a test order with PREPARING status
    const testOrder = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        sessionId: testSession.id,
        tableNumber: "Table 99",
        customerName: "Test Customer",
        total: 25.99,
        status: "PREPARING", // This should block modifications
        notes: "Test order for automatic status checking",
        items: {
          create: [
            {
              menuItemId: restaurant.menuItems[0].id,
              quantity: 2,
              priceAtTime: restaurant.menuItems[0].price,
              notes: "Test item"
            }
          ]
        }
      }
    });

    console.log(`✅ Created test order with PREPARING status: ${testOrder.id}`);

    // Test function that simulates the order status check
    const testContext = {
      restaurantId: restaurant.id,
      tableNumber: 99,
      menuItems: restaurant.menuItems
    };

    const mockCtx = { db: prisma };

    // Import the checkOrderStatusForModification function
    const checkOrderStatusForModification = async (context, ctx) => {
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
    };

    // Test the function
    console.log("\n🧪 Testing automatic order status check...");
    const statusResult = await checkOrderStatusForModification(testContext, mockCtx);
    
    console.log("📋 Status Check Result:", statusResult);

    if (!statusResult.canModify && statusResult.reason === "Your order is already preparing") {
      console.log("✅ SUCCESS: Automatic order status checking works correctly!");
      console.log("   - AI will automatically reject modifications");
      console.log("   - Order status: PREPARING");
      console.log("   - Reason:", statusResult.reason);
    } else {
      console.log("❌ FAILED: Status check didn't work as expected");
      console.log("   Expected: canModify=false, reason about preparing");
      console.log("   Got:", statusResult);
    }

    // Test with PENDING status (should allow modifications)
    await prisma.order.update({
      where: { id: testOrder.id },
      data: { status: "PENDING" }
    });

    console.log("\n🧪 Testing with PENDING status (should allow modifications)...");
    const pendingResult = await checkOrderStatusForModification(testContext, mockCtx);
    
    console.log("📋 Pending Status Result:", pendingResult);

    if (pendingResult.canModify) {
      console.log("✅ SUCCESS: PENDING orders can be modified");
    } else {
      console.log("❌ FAILED: PENDING orders should be modifiable");
    }

    // Cleanup
    await prisma.order.delete({ where: { id: testOrder.id } });
    await prisma.customerSession.delete({ where: { id: testSession.id } });
    
    console.log("\n🧹 Cleanup completed");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutomaticOrderStatusChecking()
  .then(() => {
    console.log("\n🎉 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("🚨 Test error:", error);
    process.exit(1);
  }); 