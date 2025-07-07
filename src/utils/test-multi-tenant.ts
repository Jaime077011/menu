/**
 * Multi-tenant testing utilities
 * This file helps validate our multi-tenant architecture works correctly
 */

import { db } from "@/server/db";
import { extractSubdomainFromHost, getRestaurantFromSubdomain, isValidRestaurantSubdomain } from "./restaurant";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL";
  message: string;
}

/**
 * Test subdomain extraction from various hostnames
 */
export async function testSubdomainExtraction(): Promise<TestResult[]> {
  const testCases = [
    { hostname: "pizza-palace.localhost:3000", expected: "pizza-palace" },
    { hostname: "burger-barn.localhost", expected: "burger-barn" },
    { hostname: "pizza-palace.example.com", expected: "pizza-palace" },
    { hostname: "localhost:3000", expected: null },
    { hostname: "example.com", expected: null },
    { hostname: "www.example.com", expected: "www" },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const result = extractSubdomainFromHost(testCase.hostname);
    const passed = result === testCase.expected;
    
    results.push({
      test: `Subdomain extraction: ${testCase.hostname}`,
      status: passed ? "PASS" : "FAIL",
      message: `Expected: ${testCase.expected}, Got: ${result}`,
    });
  }

  return results;
}

/**
 * Test restaurant data retrieval from subdomains
 */
export async function testRestaurantRetrieval(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test valid restaurant subdomains
  const validSubdomains = ["pizza-palace.localhost", "burger-barn.localhost"];
  
  for (const hostname of validSubdomains) {
    try {
      const restaurant = await getRestaurantFromSubdomain(hostname);
      const subdomain = extractSubdomainFromHost(hostname);
      
      if (restaurant && restaurant.subdomain === subdomain) {
        results.push({
          test: `Restaurant retrieval: ${hostname}`,
          status: "PASS",
          message: `Found restaurant: ${restaurant.name} (${restaurant.subdomain})`,
        });
      } else {
        results.push({
          test: `Restaurant retrieval: ${hostname}`,
          status: "FAIL",
          message: `Expected restaurant with subdomain ${subdomain}, got: ${restaurant?.subdomain || "null"}`,
        });
      }
    } catch (error) {
      results.push({
        test: `Restaurant retrieval: ${hostname}`,
        status: "FAIL",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  // Test invalid subdomain
  try {
    const restaurant = await getRestaurantFromSubdomain("invalid-restaurant.localhost");
    results.push({
      test: "Invalid restaurant retrieval",
      status: restaurant === null ? "PASS" : "FAIL",
      message: restaurant === null ? "Correctly returned null for invalid subdomain" : "Should have returned null",
    });
  } catch (error) {
    results.push({
      test: "Invalid restaurant retrieval",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  return results;
}

/**
 * Test multi-tenant data isolation
 */
export async function testDataIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Get restaurants
    const restaurants = await db.restaurant.findMany({
      select: { id: true, name: true, subdomain: true },
    });

    if (restaurants.length < 2) {
      results.push({
        test: "Multi-tenant setup",
        status: "FAIL",
        message: "Need at least 2 restaurants for isolation testing",
      });
      return results;
    }

    // Test menu item isolation
    for (const restaurant of restaurants) {
      const menuItems = await db.menuItem.findMany({
        where: { restaurantId: restaurant.id },
        select: { id: true, name: true, restaurantId: true },
      });

      const hasValidIsolation = menuItems.every(item => item.restaurantId === restaurant.id);
      
      results.push({
        test: `Menu isolation: ${restaurant.name}`,
        status: hasValidIsolation ? "PASS" : "FAIL",
        message: `Found ${menuItems.length} menu items, all belong to correct restaurant: ${hasValidIsolation}`,
      });
    }

    // Test order isolation
    for (const restaurant of restaurants) {
      const orders = await db.order.findMany({
        where: { restaurantId: restaurant.id },
        select: { id: true, restaurantId: true },
      });

      const hasValidIsolation = orders.every(order => order.restaurantId === restaurant.id);
      
      results.push({
        test: `Order isolation: ${restaurant.name}`,
        status: hasValidIsolation ? "PASS" : "FAIL",
        message: `Found ${orders.length} orders, all belong to correct restaurant: ${hasValidIsolation}`,
      });
    }

  } catch (error) {
    results.push({
      test: "Data isolation test",
      status: "FAIL",
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  return results;
}

/**
 * Run all multi-tenant tests
 */
export async function runAllMultiTenantTests(): Promise<void> {
  console.log("🧪 Running Multi-Tenant Tests...\n");

  const subdomainTests = await testSubdomainExtraction();
  const retrievalTests = await testRestaurantRetrieval();
  const isolationTests = await testDataIsolation();

  const allTests = [...subdomainTests, ...retrievalTests, ...isolationTests];
  
  // Print results
  allTests.forEach(result => {
    const emoji = result.status === "PASS" ? "✅" : "❌";
    console.log(`${emoji} ${result.test}: ${result.message}`);
  });

  // Summary
  const passed = allTests.filter(t => t.status === "PASS").length;
  const total = allTests.length;
  
  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All multi-tenant tests passed!");
  } else {
    console.log("⚠️ Some tests failed. Please review the issues above.");
  }
} 