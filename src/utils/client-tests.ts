/**
 * Client-side tests that don't require database access
 */

import { extractSubdomainFromHost } from "./restaurant";

interface TestResult {
  test: string;
  status: "PASS" | "FAIL";
  message: string;
}

/**
 * Test subdomain extraction (client-side safe)
 */
export function testSubdomainExtraction(): TestResult[] {
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
 * Test current page subdomain detection
 */
export function testCurrentSubdomain(): TestResult[] {
  const results: TestResult[] = [];
  
  if (typeof window !== "undefined") {
    const currentHostname = window.location.hostname;
    const currentSubdomain = extractSubdomainFromHost(currentHostname);
    
    results.push({
      test: `Current page subdomain detection`,
      status: "PASS", // Always pass, just informational
      message: `Current hostname: ${currentHostname}, Extracted subdomain: ${currentSubdomain || "none"}`,
    });
  } else {
    results.push({
      test: `Current page subdomain detection`,
      status: "FAIL",
      message: "Not running in browser environment",
    });
  }

  return results;
}

/**
 * Run all client-side tests
 */
export function runClientSideTests(): TestResult[] {
  const subdomainTests = testSubdomainExtraction();
  const currentTests = testCurrentSubdomain();
  
  return [...subdomainTests, ...currentTests];
} 