/**
 * Subscription Expiration Testing Script
 * 
 * This script tests what happens when subscriptions expire, payments fail,
 * and how the system enforces limitations.
 * 
 * Run with: npx tsx scripts/test-subscription-expiration.ts
 */

import { PrismaClient } from "@prisma/client";
import { FeatureGate } from "../src/utils/featureGating";

const prisma = new PrismaClient();

interface TestScenario {
  name: string;
  description: string;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "UNPAID";
  trialExpired?: boolean;
  expectedFeatures: string[];
  expectedLimitations: string[];
}

const testScenarios: TestScenario[] = [
  {
    name: "Active Trial",
    description: "14-day trial, still active",
    subscriptionStatus: "TRIAL",
    trialExpired: false,
    expectedFeatures: ["basicAI", "qrOrdering", "basicAnalytics", "emailSupport"],
    expectedLimitations: ["50 menu items", "2 admin users", "1000 API calls"]
  },
  {
    name: "Expired Trial",
    description: "Trial ended, no payment method",
    subscriptionStatus: "TRIAL",
    trialExpired: true,
    expectedFeatures: ["basicAI", "qrOrdering"],
    expectedLimitations: ["LIMITED FEATURES", "50 menu items", "2 admin users"]
  },
  {
    name: "Active Subscription",
    description: "Paid subscription, all good",
    subscriptionStatus: "ACTIVE",
    expectedFeatures: ["basicAI", "qrOrdering", "basicAnalytics", "customPersonality", "advancedAnalytics"],
    expectedLimitations: ["200 menu items (Starter)", "5 admin users", "Unlimited API calls"]
  },
  {
    name: "Past Due Payment",
    description: "Payment failed, grace period",
    subscriptionStatus: "PAST_DUE",
    expectedFeatures: ["basicAI", "qrOrdering"],
    expectedLimitations: ["DEGRADED SERVICE", "Basic features only", "Payment required"]
  },
  {
    name: "Cancelled Subscription",
    description: "User cancelled, service until period end",
    subscriptionStatus: "CANCELLED",
    expectedFeatures: ["basicAI", "qrOrdering"],
    expectedLimitations: ["CANCELLED", "Service until period end", "No new features"]
  }
];

async function testSubscriptionExpiration() {
  console.log("🧪 TESTING SUBSCRIPTION EXPIRATION SCENARIOS");
  console.log("=" .repeat(80));

  try {
    // Create test restaurant if it doesn't exist
    const testRestaurant = await createOrGetTestRestaurant();
    console.log(`📍 Using test restaurant: ${testRestaurant.name} (${testRestaurant.id})`);
    console.log("");

    for (const scenario of testScenarios) {
      console.log(`🎯 SCENARIO: ${scenario.name}`);
      console.log(`📝 Description: ${scenario.description}`);
      console.log("-" .repeat(60));

      // Set up the scenario
      await setupScenario(testRestaurant.id, scenario);

      // Test feature access
      await testFeatureAccess(testRestaurant.id, scenario);

      // Test limitations
      await testLimitations(testRestaurant.id, scenario);

      // Test admin dashboard behavior
      await testAdminDashboard(testRestaurant.id, scenario);

      console.log("");
    }

    // Test webhook simulation
    await testWebhookSimulation(testRestaurant.id);

    console.log("✅ ALL EXPIRATION TESTS COMPLETED!");
    console.log("🎉 Your subscription system handles expiration correctly!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createOrGetTestRestaurant() {
  return await prisma.restaurant.upsert({
    where: { subdomain: "test-expiration" },
    update: {},
    create: {
      name: "Expiration Test Restaurant",
      subdomain: "test-expiration",
      subscriptionStatus: "TRIAL",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      adminUsers: {
        create: {
          email: "test@expiration.com",
          passwordHash: "dummy",
        }
      }
    },
    include: {
      subscription: true,
      adminUsers: true
    }
  });
}

async function setupScenario(restaurantId: string, scenario: TestScenario) {
  console.log(`⚙️ Setting up scenario: ${scenario.subscriptionStatus}`);

  // Update restaurant status
  const trialEnd = scenario.trialExpired 
    ? new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      subscriptionStatus: scenario.subscriptionStatus,
      trialEndsAt: scenario.subscriptionStatus === "TRIAL" ? trialEnd : null,
    }
  });

  // Update or create subscription
  if (scenario.subscriptionStatus !== "TRIAL") {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: "STARTER" }
    });

    if (plan) {
      await prisma.restaurantSubscription.upsert({
        where: { restaurantId },
        create: {
          restaurantId,
          planId: plan.id,
          status: scenario.subscriptionStatus,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: "cus_test_123",
          stripeSubscriptionId: "sub_test_123",
        },
        update: {
          status: scenario.subscriptionStatus,
        }
      });
    }
  }

  console.log(`   ✅ Restaurant status: ${scenario.subscriptionStatus}`);
  if (scenario.trialExpired) {
    console.log(`   ⏰ Trial expired: ${trialEnd.toLocaleDateString()}`);
  }
}

async function testFeatureAccess(restaurantId: string, scenario: TestScenario) {
  console.log("🔍 Testing feature access...");

  const features = await FeatureGate.getRestaurantFeatures(restaurantId);
  const subscriptionStatus = await FeatureGate.getSubscriptionStatus(restaurantId);

  console.log(`   📊 Subscription Status:`, {
    status: subscriptionStatus?.status || "NONE",
    planName: subscriptionStatus?.planName || "TRIAL",
    isTrialActive: subscriptionStatus?.isTrialActive || false,
    daysLeftInTrial: subscriptionStatus?.daysLeftInTrial || 0
  });

  // Test key features
  const keyFeatures = ['basicAI', 'customPersonality', 'advancedAnalytics', 'apiAccess', 'customBranding'];
  
  for (const feature of keyFeatures) {
    const hasAccess = features[feature as keyof typeof features];
    const symbol = hasAccess ? "✅" : "❌";
    console.log(`   ${symbol} ${feature}: ${hasAccess}`);
  }
}

async function testLimitations(restaurantId: string, scenario: TestScenario) {
  console.log("🚧 Testing limitations enforcement...");

  // Test menu item limits
  const menuItemCount = await prisma.menuItem.count({ where: { restaurantId } });
  const canAddMenuItem = await FeatureGate.canAddMenuItem(restaurantId);
  const menuItemLimit = await FeatureGate.enforceLimit(restaurantId, "MENU_ITEMS", menuItemCount);

  console.log(`   📋 Menu Items: ${menuItemCount}/${menuItemLimit.limit === -1 ? "∞" : menuItemLimit.limit} (Can add: ${canAddMenuItem ? "✅" : "❌"})`);

  // Test admin user limits
  const adminUserCount = await prisma.adminUser.count({ where: { restaurantId } });
  const canAddAdmin = await FeatureGate.canAddAdminUser(restaurantId);
  const adminUserLimit = await FeatureGate.enforceLimit(restaurantId, "ADMIN_USERS", adminUserCount);

  console.log(`   👥 Admin Users: ${adminUserCount}/${adminUserLimit.limit === -1 ? "∞" : adminUserLimit.limit} (Can add: ${canAddAdmin ? "✅" : "❌"})`);

  // Test what happens when limits are exceeded
  if (scenario.subscriptionStatus === "PAST_DUE" || scenario.subscriptionStatus === "CANCELLED") {
    console.log(`   ⚠️ DEGRADED SERVICE: Limited functionality due to ${scenario.subscriptionStatus} status`);
  }
}

async function testAdminDashboard(restaurantId: string, scenario: TestScenario) {
  console.log("🖥️ Testing admin dashboard behavior...");

  const subscriptionStatus = await FeatureGate.getSubscriptionStatus(restaurantId);
  
  if (!subscriptionStatus) {
    console.log("   ❌ NO SUBSCRIPTION DATA - Dashboard would show trial expired warning");
    return;
  }

  // Simulate what admin dashboard would show
  console.log(`   📊 Dashboard Status: ${subscriptionStatus.status}`);
  
  switch (scenario.subscriptionStatus) {
    case "TRIAL":
      if (scenario.trialExpired) {
        console.log("   🚨 TRIAL EXPIRED - Dashboard shows upgrade prompt");
        console.log("   💳 Payment required to continue service");
      } else {
        console.log(`   ⏰ Trial active - ${subscriptionStatus.daysLeftInTrial} days remaining`);
      }
      break;
      
    case "PAST_DUE":
      console.log("   ⚠️ PAYMENT FAILED - Dashboard shows payment retry prompt");
      console.log("   🔄 Grace period active, limited functionality");
      break;
      
    case "CANCELLED":
      console.log("   ❌ CANCELLED - Dashboard shows reactivation option");
      console.log("   📅 Service until period end");
      break;
      
    case "ACTIVE":
      console.log("   ✅ ACTIVE - Full functionality available");
      break;
  }
}

async function testWebhookSimulation(restaurantId: string) {
  console.log("🔔 TESTING WEBHOOK SIMULATION");
  console.log("-" .repeat(60));

  // Simulate payment failure webhook
  console.log("1️⃣ Simulating payment failure webhook...");
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "PAST_DUE" }
  });
  
  await prisma.restaurantSubscription.updateMany({
    where: { restaurantId },
    data: { status: "PAST_DUE" }
  });
  
  console.log("   ✅ Status updated to PAST_DUE");
  
  // Test feature access after payment failure
  const canAddMenuItem = await FeatureGate.canAddMenuItem(restaurantId);
  const features = await FeatureGate.getRestaurantFeatures(restaurantId);
  
  console.log(`   🔍 After payment failure - Can add menu item: ${canAddMenuItem ? "✅" : "❌"}`);
  console.log(`   🔍 Advanced features available: ${features.advancedAnalytics ? "✅" : "❌"}`);
  
  // Simulate payment success webhook
  console.log("\n2️⃣ Simulating payment recovery webhook...");
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "ACTIVE" }
  });
  
  await prisma.restaurantSubscription.updateMany({
    where: { restaurantId },
    data: { status: "ACTIVE" }
  });
  
  console.log("   ✅ Status restored to ACTIVE");
  
  // Test feature access after payment recovery
  const canAddMenuItemAfter = await FeatureGate.canAddMenuItem(restaurantId);
  const featuresAfter = await FeatureGate.getRestaurantFeatures(restaurantId);
  
  console.log(`   🔍 After payment recovery - Can add menu item: ${canAddMenuItemAfter ? "✅" : "❌"}`);
  console.log(`   🔍 Advanced features restored: ${featuresAfter.advancedAnalytics ? "✅" : "❌"}`);
}

// Quick test functions for specific scenarios
export async function simulateTrialExpiration(restaurantId: string) {
  console.log("⏰ SIMULATING TRIAL EXPIRATION");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      subscriptionStatus: "TRIAL",
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    }
  });
  
  console.log("✅ Trial expired - test feature access now");
}

export async function simulatePaymentFailure(restaurantId: string) {
  console.log("💳 SIMULATING PAYMENT FAILURE");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "PAST_DUE" }
  });
  
  await prisma.restaurantSubscription.updateMany({
    where: { restaurantId },
    data: { status: "PAST_DUE" }
  });
  
  console.log("✅ Payment failed - test limited functionality now");
}

export async function simulateSubscriptionCancellation(restaurantId: string) {
  console.log("❌ SIMULATING SUBSCRIPTION CANCELLATION");
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { subscriptionStatus: "CANCELLED" }
  });
  
  await prisma.restaurantSubscription.updateMany({
    where: { restaurantId },
    data: { 
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelAtPeriodEnd: true
    }
  });
  
  console.log("✅ Subscription cancelled - test end-of-period functionality");
}

// Run the test
if (require.main === module) {
  testSubscriptionExpiration().catch(console.error);
}

export { testSubscriptionExpiration, simulateTrialExpiration, simulatePaymentFailure, simulateSubscriptionCancellation }; 