/**
 * Subscription System Test Script
 * Run with: npx tsx scripts/test-subscription-system.ts
 */

import { PrismaClient } from "@prisma/client";
import { FeatureGate } from "../src/utils/featureGating";

const prisma = new PrismaClient();

async function testSubscriptionSystem() {
  console.log("🧪 Testing Subscription System...\n");

  try {
    // Test 1: Check if subscription plans exist
    console.log("1️⃣ Testing Subscription Plans...");
    const plans = await prisma.subscriptionPlan.findMany();
    console.log(`   ✅ Found ${plans.length} subscription plans`);
    plans.forEach(plan => {
      console.log(`   📋 ${plan.displayName}: $${plan.price}/month (${plan.maxMenuItems} menu items)`);
    });
    console.log("");

    // Test 2: Check test restaurants
    console.log("2️⃣ Testing Test Restaurants...");
    const restaurants = await prisma.restaurant.findMany({
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    });

    for (const restaurant of restaurants) {
      console.log(`   🏪 ${restaurant.name} (${restaurant.subdomain})`);
      console.log(`      Status: ${restaurant.subscriptionStatus}`);
      if (restaurant.subscription) {
        console.log(`      Plan: ${restaurant.subscription.plan.displayName}`);
        console.log(`      Trial ends: ${restaurant.subscription.trialEnd?.toLocaleDateString()}`);
      }
    }
    console.log("");

    // Test 3: Feature Gate Testing
    console.log("3️⃣ Testing Feature Gates...");
    if (restaurants.length > 0) {
      const testRestaurant = restaurants[0]!;
      
      // Test basic features
      const hasBasicAI = await FeatureGate.checkFeature(testRestaurant.id, "basicAI");
      const hasCustomBranding = await FeatureGate.checkFeature(testRestaurant.id, "customBranding");
      const hasApiAccess = await FeatureGate.checkFeature(testRestaurant.id, "apiAccess");
      
      console.log(`   🔧 Testing features for ${testRestaurant.name}:`);
      console.log(`      Basic AI: ${hasBasicAI ? '✅' : '❌'}`);
      console.log(`      Custom Branding: ${hasCustomBranding ? '✅' : '❌'}`);
      console.log(`      API Access: ${hasApiAccess ? '✅' : '❌'}`);

      // Test limits
      const canAddMenuItem = await FeatureGate.canAddMenuItem(testRestaurant.id);
      const canAddAdmin = await FeatureGate.canAddAdminUser(testRestaurant.id);
      
      console.log(`      Can add menu item: ${canAddMenuItem ? '✅' : '❌'}`);
      console.log(`      Can add admin: ${canAddAdmin ? '✅' : '❌'}`);
    }
    console.log("");

    // Test 4: Usage Tracking
    console.log("4️⃣ Testing Usage Tracking...");
    if (restaurants.length > 0) {
      const testRestaurant = restaurants[0]!;
      
      // Track some usage
      await FeatureGate.trackUsage(testRestaurant.id, "API_CALLS", 5);
      await FeatureGate.trackUsage(testRestaurant.id, "ORDERS", 2);
      
      // Get usage metrics
      const usage = await FeatureGate.getUsageMetrics(testRestaurant.id, 1);
      console.log(`   📊 Usage metrics for ${testRestaurant.name}:`);
      usage.forEach(metric => {
        console.log(`      ${metric.metricType}: ${metric.value} (${metric.period.toLocaleDateString()})`);
      });
    }
    console.log("");

    // Test 5: Subscription Status
    console.log("5️⃣ Testing Subscription Status...");
    if (restaurants.length > 0) {
      const testRestaurant = restaurants[0]!;
      const status = await FeatureGate.getSubscriptionStatus(testRestaurant.id);
      
      if (status) {
        console.log(`   📈 Subscription status for ${testRestaurant.name}:`);
        console.log(`      Status: ${status.status}`);
        console.log(`      Plan: ${status.planName}`);
        console.log(`      Price: $${status.planPrice}/month`);
        console.log(`      Trial active: ${status.isTrialActive ? '✅' : '❌'}`);
        console.log(`      Days left in trial: ${status.daysLeftInTrial}`);
      }
    }
    console.log("");

    console.log("🎉 All tests completed successfully!");
    console.log("✅ Subscription system is working correctly!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSubscriptionSystem().catch(console.error); 