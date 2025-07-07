/**
 * Subscription Expiration Testing Script
 * 
 * Run with: npx tsx scripts/test-subscription-expiration-scenarios.ts
 */

import { PrismaClient } from "@prisma/client";
import { FeatureGate } from "../src/utils/featureGating";

const prisma = new PrismaClient();

async function testSubscriptionExpiration() {
  console.log("🧪 TESTING SUBSCRIPTION EXPIRATION SCENARIOS");
  console.log("=" .repeat(80));

  try {
    // Create test restaurant
    const testRestaurant = await prisma.restaurant.upsert({
      where: { subdomain: "test-expiration" },
      update: {},
      create: {
        name: "Expiration Test Restaurant",
        subdomain: "test-expiration",
        subscriptionStatus: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        adminUsers: {
          create: {
            email: "test@expiration.com",
            passwordHash: "dummy",
          }
        }
      }
    });

    console.log(`📍 Test Restaurant: ${testRestaurant.name} (${testRestaurant.id})\n`);

    // Test 1: Trial Expired
    console.log("1️⃣ TESTING TRIAL EXPIRATION");
    console.log("-".repeat(50));
    await simulateTrialExpiration(testRestaurant.id);
    await testFeatureAccess(testRestaurant.id, "TRIAL EXPIRED");

    // Test 2: Payment Failed
    console.log("\n2️⃣ TESTING PAYMENT FAILURE");
    console.log("-".repeat(50));
    await simulatePaymentFailure(testRestaurant.id);
    await testFeatureAccess(testRestaurant.id, "PAYMENT FAILED");

    // Test 3: Subscription Cancelled
    console.log("\n3️⃣ TESTING SUBSCRIPTION CANCELLATION");
    console.log("-".repeat(50));
    await simulateSubscriptionCancellation(testRestaurant.id);
    await testFeatureAccess(testRestaurant.id, "CANCELLED");

    console.log("\n✅ ALL TESTS COMPLETED!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function simulateTrialExpiration(restaurantId: string) {
  console.log("⏰ Simulating trial expiration...");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      subscriptionStatus: "TRIAL",
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    }
  });
  
  console.log("✅ Trial expired");
}

async function simulatePaymentFailure(restaurantId: string) {
  console.log("💳 Simulating payment failure...");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "PAST_DUE" }
  });
  
  console.log("✅ Payment failed - status set to PAST_DUE");
}

async function simulateSubscriptionCancellation(restaurantId: string) {
  console.log("❌ Simulating subscription cancellation...");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "CANCELLED" }
  });
  
  console.log("✅ Subscription cancelled");
}

async function testFeatureAccess(restaurantId: string, scenario: string) {
  console.log(`🔍 Testing feature access for: ${scenario}`);

  const features = await FeatureGate.getRestaurantFeatures(restaurantId);
  const subscriptionStatus = await FeatureGate.getSubscriptionStatus(restaurantId);
  const canAddMenuItem = await FeatureGate.canAddMenuItem(restaurantId);
  const canAddAdmin = await FeatureGate.canAddAdminUser(restaurantId);

  console.log("📊 Results:");
  console.log(`   Status: ${subscriptionStatus?.status || "NONE"}`);
  console.log(`   Basic AI: ${features.basicAI ? "✅" : "❌"}`);
  console.log(`   Custom Branding: ${features.customBranding ? "✅" : "❌"}`);
  console.log(`   Advanced Analytics: ${features.advancedAnalytics ? "✅" : "❌"}`);
  console.log(`   API Access: ${features.apiAccess ? "✅" : "❌"}`);
  console.log(`   Can Add Menu Item: ${canAddMenuItem ? "✅" : "❌"}`);
  console.log(`   Can Add Admin: ${canAddAdmin ? "✅" : "❌"}`);
}

// Run the test
testSubscriptionExpiration().catch(console.error); 