// Note: Database functions should only be called server-side
// Import db only when needed to avoid client-side environment variable errors

export interface RestaurantContext {
  id: string;
  name: string;
  subdomain: string;
}

/**
 * Get restaurant data from subdomain or hostname
 * Works for both development (pizza-palace.localhost) and production (pizza-palace.example.com)
 * Also works with direct subdomain strings (pizza-palace)
 */
export async function getRestaurantFromSubdomain(hostnameOrSubdomain: string): Promise<RestaurantContext | null> {
  // Check if it's already a subdomain (no dots) or a hostname (with dots)
  let subdomain: string | null;
  
  if (hostnameOrSubdomain.includes('.')) {
    // It's a hostname, extract subdomain
    subdomain = extractSubdomainFromHost(hostnameOrSubdomain);
  } else {
    // It's already a subdomain
    subdomain = hostnameOrSubdomain;
  }
  
  if (!subdomain) {
    return null;
  }

  try {
    // Dynamic import to avoid client-side environment variable errors
    const { db } = await import("@/server/db");
    
    const restaurant = await db.restaurant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    return restaurant;
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - pizza-palace.localhost:3000 -> pizza-palace
 * - burger-barn.example.com -> burger-barn
 * - localhost:3000 -> null
 * - example.com -> null
 */
export function extractSubdomainFromHost(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(":")[0];
  
  if (!hostWithoutPort) return null;

  // Split by dots
  const parts = hostWithoutPort.split(".");
  
  // For localhost development: pizza-palace.localhost
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    const subdomain = parts[0];
    return subdomain && subdomain !== "localhost" ? subdomain : null;
  }
  
  // For production domains: pizza-palace.example.com
  if (parts.length >= 3) {
    return parts[0] || null;
  }
  
  // No subdomain found
  return null;
}

/**
 * Validate if a subdomain corresponds to an existing restaurant
 */
export async function isValidRestaurantSubdomain(subdomain: string): Promise<boolean> {
  try {
    // Dynamic import to avoid client-side environment variable errors
    const { db } = await import("@/server/db");
    
    const restaurant = await db.restaurant.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    
    return !!restaurant;
  } catch (error) {
    console.error("Error validating subdomain:", error);
    return false;
  }
}

/**
 * Get all restaurant subdomains (useful for middleware)
 */
export async function getAllRestaurantSubdomains(): Promise<string[]> {
  try {
    // Dynamic import to avoid client-side environment variable errors
    const { db } = await import("@/server/db");
    
    const restaurants = await db.restaurant.findMany({
      select: { subdomain: true },
    });
    
    return restaurants.map(r => r.subdomain);
  } catch (error) {
    console.error("Error fetching restaurant subdomains:", error);
    return [];
  }
} 